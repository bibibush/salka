import assert from 'node:assert/strict';
import { access, readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const rootUrl = new URL('../', import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, rootUrl), 'utf8'));
}

async function findTsconfigFiles(directory = fileURLToPath(rootUrl)) {
  const ignoredDirectories = new Set([
    '.expo',
    '.git',
    '.turbo',
    '.venv',
    'build',
    'coverage',
    'dist',
    'node_modules',
  ]);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      files.push(...(await findTsconfigFiles(path)));
    } else if (entry.isFile() && /^tsconfig.*\.json$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

test('root package exposes the R5 quality commands and dependencies', async () => {
  const packageJson = await readJson('package.json');
  const dependencies = packageJson.devDependencies;

  assert.equal(packageJson.scripts.prepare, 'husky');
  assert.equal(packageJson.scripts['test:quality'], 'node --test tests/quality-config.test.mjs');

  for (const dependency of [
    '@commitlint/cli',
    '@commitlint/config-conventional',
    'eslint',
    'husky',
    'lint-staged',
    'prettier',
    'zod',
    'zod-validation-error',
  ]) {
    assert.ok(dependencies[dependency], `missing root devDependency: ${dependency}`);
  }
});

test('git hooks run staged-file checks and Conventional Commits validation', async () => {
  const preCommitUrl = new URL('.husky/pre-commit', rootUrl);
  const commitMsgUrl = new URL('.husky/commit-msg', rootUrl);

  await Promise.all([access(preCommitUrl), access(commitMsgUrl)]);

  const [preCommit, commitMsg, preCommitStat, commitMsgStat] = await Promise.all([
    readFile(preCommitUrl, 'utf8'),
    readFile(commitMsgUrl, 'utf8'),
    stat(preCommitUrl),
    stat(commitMsgUrl),
  ]);

  assert.equal(preCommit.trim(), 'pnpm exec lint-staged');
  assert.equal(commitMsg.trim(), 'pnpm exec commitlint --edit "$1"');
  assert.ok(preCommitStat.mode & 0o100, 'pre-commit hook must be executable');
  assert.ok(commitMsgStat.mode & 0o100, 'commit-msg hook must be executable');
});

test('lint-staged and commitlint configs cover TS, Python, formatting, and commit messages', async () => {
  const [{ default: lintStaged }, { default: commitlint }] = await Promise.all([
    import(new URL('../lint-staged.config.mjs', import.meta.url)),
    import(new URL('../commitlint.config.mjs', import.meta.url)),
  ]);

  assert.ok(Object.keys(lintStaged).some((pattern) => pattern.includes('apps/web')));
  assert.ok(Object.keys(lintStaged).some((pattern) => pattern.includes('apps/mobile')));
  assert.ok(Object.keys(lintStaged).some((pattern) => pattern.includes('packages')));
  assert.ok(Object.keys(lintStaged).some((pattern) => pattern.includes('apps/api')));
  assert.ok(
    Object.values(lintStaged)
      .flat()
      .some((command) => String(command).includes('prettier')),
  );
  assert.deepEqual(commitlint.extends, ['@commitlint/config-conventional']);
});

test('CI runs repository quality-config tests and is no longer marked as a draft', async () => {
  const workflow = await readFile(new URL('.github/workflows/ci.yml', rootUrl), 'utf8');

  assert.doesNotMatch(workflow, /DRAFT|초안/);
  assert.match(workflow, /^  quality-config:/m);
  assert.match(workflow, /pnpm test:quality/);
});

test('CI triggers on pull requests and main push, and scopes push changes to the push diff', async () => {
  const workflow = await readFile(new URL('.github/workflows/ci.yml', rootUrl), 'utf8');
  const triggerBlock = workflow.match(/^on:\r?\n([\s\S]*?)\r?\n\r?\nconcurrency:/m)?.[1];

  assert.ok(triggerBlock, 'CI trigger block not found');
  assert.match(triggerBlock, /^  pull_request:/m);
  assert.match(triggerBlock, /^  push:/m);
  assert.match(triggerBlock, /branches:\s*\[main\]/);
  // push 는 기본 브랜치 merge-base 가 아니라 직전 커밋 대비로 변경을 감지해야 한다.
  assert.match(workflow, /base:\s*\$\{\{\s*github\.event\.before\s*\}\}/);
});

test('Mobile CD wires the main-push EAS pipeline behind a feature flag [R5-CD2]', async () => {
  const workflow = await readFile(new URL('.github/workflows/mobile-cd.yml', rootUrl), 'utf8');
  const triggerBlock = workflow.match(/^on:\r?\n([\s\S]*?)\r?\n\r?\nconcurrency:/m)?.[1];

  assert.ok(triggerBlock, 'Mobile CD trigger block not found');
  assert.doesNotMatch(workflow, /DRAFT|초안/);
  // main push + 수동 실행 두 트리거를 모두 지원한다.
  assert.match(triggerBlock, /^  push:/m);
  assert.match(triggerBlock, /branches:\s*\[main\]/);
  assert.match(triggerBlock, /^  workflow_dispatch:/m);
  // push diff 는 기본 브랜치 merge-base 가 아니라 직전 커밋 대비로 감지한다(항상 skip 방지).
  assert.match(workflow, /base:\s*\$\{\{\s*github\.event\.before\s*\}\}/);

  // 자격증명/projectId 준비 전에는 push 가 실제 배포하지 않도록 기능 플래그로 gate 한다.
  // (플래그 미설정 시 push 는 action=none 으로 안전하게 no-op → main push 가 실패하지 않는다.)
  assert.match(workflow, /vars\.MOBILE_CD_ENABLED/);

  // 네이티브 변경 여부로 스토어 빌드/제출 vs OTA 를 분기한다.
  assert.match(workflow, /eas build .*--profile production/);
  assert.match(workflow, /eas submit .*--profile production/);
  assert.match(workflow, /eas update --branch production/);

  // EAS 인증은 시크릿 참조로만, 백엔드 URL 은 변수로 주입한다(literal 값 금지).
  assert.match(workflow, /secrets\.EXPO_TOKEN/);
  assert.match(workflow, /vars\.EXPO_PUBLIC_API_BASE_URL/);
});

test('Web CD deploys the static build to S3 + CloudFront on main push [R5-CD1]', async () => {
  const workflow = await readFile(new URL('.github/workflows/web-cd.yml', rootUrl), 'utf8');
  const triggerBlock = workflow.match(/^on:\r?\n([\s\S]*?)\r?\n\r?\nconcurrency:/m)?.[1];

  assert.ok(triggerBlock, 'Web CD trigger block not found');
  assert.doesNotMatch(workflow, /DRAFT|초안/);
  // main push + 수동 실행 두 트리거 모두 지원
  assert.match(triggerBlock, /^  push:/m);
  assert.match(triggerBlock, /branches:\s*\[main\]/);
  assert.match(triggerBlock, /^  workflow_dispatch:/m);
  // paths-filter 는 이번 push 로 실제 바뀐 것(직전 커밋 대비)만 배포 대상으로 본다.
  // (base 미지정 시 기본 브랜치 merge-base 기준이라 항상 "변경 없음"으로 skip 된다.)
  assert.match(workflow, /base:\s*\$\{\{\s*github\.event\.before\s*\}\}/);
  // 정적 빌드 → S3 sync → CloudFront 무효화
  assert.match(workflow, /turbo run build --filter=web/);
  assert.match(workflow, /aws s3 sync/);
  assert.match(workflow, /cloudfront create-invalidation/);
  // AWS 자격증명은 시크릿/변수 참조로만 주입한다(literal 값 금지).
  assert.match(workflow, /secrets\.AWS_ACCESS_KEY_ID/);
  assert.match(workflow, /secrets\.AWS_SECRET_ACCESS_KEY/);
  assert.match(workflow, /vars\.WEB_S3_BUCKET/);
  assert.match(workflow, /vars\.CLOUDFRONT_DISTRIBUTION_ID/);
});

test('API CD builds a Docker image and deploys it over SSH on main push [R5-CD1]', async () => {
  const workflow = await readFile(new URL('.github/workflows/api-cd.yml', rootUrl), 'utf8');
  const triggerBlock = workflow.match(/^on:\r?\n([\s\S]*?)\r?\n\r?\nconcurrency:/m)?.[1];

  assert.ok(triggerBlock, 'API CD trigger block not found');
  assert.doesNotMatch(workflow, /DRAFT|초안/);
  assert.match(triggerBlock, /^  push:/m);
  assert.match(triggerBlock, /branches:\s*\[main\]/);
  assert.match(triggerBlock, /^  workflow_dispatch:/m);
  // paths-filter 는 이번 push 로 실제 바뀐 것(직전 커밋 대비)만 배포 대상으로 본다.
  assert.match(workflow, /base:\s*\$\{\{\s*github\.event\.before\s*\}\}/);
  // 이미지 빌드/푸시 + SSH 배포
  assert.match(workflow, /docker\/build-push-action/);
  assert.match(workflow, /appleboy\/ssh-action/);
  // 호스트/키는 시크릿 참조로만 주입한다(literal 값 금지).
  assert.match(workflow, /secrets\.DEPLOY_SSH_HOST/);
  assert.match(workflow, /secrets\.DEPLOY_SSH_KEY/);
  assert.match(workflow, /secrets\.DEPLOY_SSH_USER/);
});

test('API CD injects prod runtime config from GitHub Secrets/Variables at deploy time [R5-CD1]', async () => {
  const workflow = await readFile(new URL('.github/workflows/api-cd.yml', rootUrl), 'utf8');

  // 서버에 미리 둔 env-file 경로(API_ENV_FILE)에 의존하지 않는다.
  assert.doesNotMatch(workflow, /API_ENV_FILE/, 'must not depend on a pre-placed server env-file');

  // 운영 provider 선택은 Variables, 실제 키는 Secrets 로 주입한다.
  assert.match(workflow, /vars\.LLM_PROVIDER/);
  assert.match(workflow, /vars\.OCR_PROVIDER/);
  assert.match(workflow, /secrets\.LLM_API_KEY/);
  assert.match(workflow, /secrets\.OCR_API_KEY/);

  // 배포 시점에 env-file 을 만들어 컨테이너에 주입한다(prod 환경).
  assert.match(workflow, /ENV=prod/, 'container must run with ENV=prod');
  assert.match(workflow, /--env-file/, 'runtime config must be passed via --env-file');
});

test('API CD registers its server block into the shared nginx and reloads it in place [R5-CD1]', async () => {
  const workflow = await readFile(new URL('.github/workflows/api-cd.yml', rootUrl), 'utf8');

  // 공용 nginx 는 8000 포트(SSL)로 listen 하고, api 컨테이너(8000)로 프록시한다.
  assert.match(workflow, /listen\s+8000\s+ssl/, 'shared nginx must listen on port 8000 (ssl)');
  assert.match(
    workflow,
    /proxy_pass\s+http:\/\/cosmetics-api:8000/,
    'shared nginx must proxy to the api container on port 8000',
  );
  // 도메인·인증서 경로는 고정값으로 박아 넣는다(환경변수 불필요).
  assert.match(
    workflow,
    /server_name\s+api\.agentops\.p-e\.kr/,
    'nginx server_name must be the fixed backend domain',
  );

  // 새 nginx 를 세우지 않고, 공용 conf.d 에 이 앱 전용 server 블록만 배치한다.
  assert.match(workflow, /conf\.d/, 'server block must live in the shared conf.d directory');
  // api 컨테이너는 공용 프록시 네트워크에 join 해 컨테이너명으로 도달 가능해야 한다.
  assert.match(workflow, /proxy_net/, 'api container must join the shared proxy network');

  // 이미 떠 있는 공용 nginx 는 재시작/재생성이 아니라 무중단 reload 만 한다.
  assert.match(workflow, /nginx -t/, 'nginx config must be validated before reload');
  assert.match(workflow, /nginx -s reload/, 'shared nginx must be reloaded in place');
  // 공용 nginx 를 이 워크플로가 직접 기동/정의하지 않는다(reload 만).
  assert.doesNotMatch(
    workflow,
    /image:\s*nginx/,
    'API CD must not define/start its own nginx; it only reloads the existing one',
  );
});

test('CD workflows never commit literal hosts or credentials [R5-CD1]', async () => {
  for (const name of ['web-cd.yml', 'api-cd.yml']) {
    const workflow = await readFile(new URL(`.github/workflows/${name}`, rootUrl), 'utf8');
    // 실제 IP/도메인/키가 아니라 시크릿/변수 참조만 사용해야 한다.
    assert.doesNotMatch(
      workflow,
      /\b\d{1,3}(?:\.\d{1,3}){3}\b/,
      `${name} must not embed a literal IP`,
    );
    assert.doesNotMatch(
      workflow,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      `${name} must not embed a private key`,
    );
  }
});

test('local .env files document CD variables as <...> placeholders [R5-CD1]', async () => {
  const webEnv = await readFile(new URL('apps/web/.env.example', rootUrl), 'utf8');
  const apiEnv = await readFile(new URL('apps/api/.env.example', rootUrl), 'utf8');

  // 웹 CD(S3 + CloudFront)가 참조하는 값들을 플레이스홀더로 문서화
  for (const key of ['WEB_S3_BUCKET', 'CLOUDFRONT_DISTRIBUTION_ID', 'AWS_ACCESS_KEY_ID']) {
    assert.match(
      webEnv,
      new RegExp(`${key}=<[^>]+>`),
      `apps/web/.env.example must document ${key}`,
    );
  }
  // API CD(SSH 배포)가 참조하는 값들을 플레이스홀더로 문서화
  for (const key of ['DEPLOY_SSH_HOST', 'DEPLOY_SSH_KEY']) {
    assert.match(
      apiEnv,
      new RegExp(`${key}=<[^>]+>`),
      `apps/api/.env.example must document ${key}`,
    );
  }
});

test('shared TypeScript packages execute a real Vitest suite', async () => {
  const packageJson = await readJson('packages/shared-types/package.json');

  assert.equal(packageJson.scripts.test, 'vitest run');
  assert.ok(packageJson.devDependencies.vitest);
  await access(new URL('packages/shared-types/src/index.test.ts', rootUrl));
});

test('workspace toolchain versions follow the PDD and Expo React contract', async () => {
  const typedWorkspaces = [
    'apps/web/package.json',
    'apps/mobile/package.json',
    'packages/api-client/package.json',
    'packages/config-tailwind/package.json',
    'packages/shared-types/package.json',
    'packages/ui-tokens/package.json',
  ];

  for (const workspace of typedWorkspaces) {
    const packageJson = await readJson(workspace);
    assert.match(
      packageJson.devDependencies.typescript,
      /^\^5\./,
      `${workspace} must use the PDD TypeScript 5.x line`,
    );
  }

  const web = await readJson('apps/web/package.json');
  assert.equal(web.dependencies.react, '19.1.0');
  assert.equal(web.dependencies['react-dom'], '19.1.0');
  assert.match(web.devDependencies['@types/react'], /^~19\.1\./);
  assert.match(web.devDependencies['@types/react-dom'], /^~19\.1\./);
});

test('project tsconfig files do not use baseUrl', async () => {
  const tsconfigFiles = await findTsconfigFiles();
  assert.ok(tsconfigFiles.length > 0, 'no project tsconfig files found');

  for (const tsconfigFile of tsconfigFiles) {
    const tsconfig = JSON.parse(await readFile(tsconfigFile, 'utf8'));
    assert.ok(
      !Object.hasOwn(tsconfig.compilerOptions ?? {}, 'baseUrl'),
      `${tsconfigFile} must not define compilerOptions.baseUrl`,
    );
  }
});

test('ESLint config uses supported React Hooks and boundaries rules', async () => {
  const [{ reactConfig }, { fsdBoundariesConfig }] = await Promise.all([
    import(new URL('../packages/config-eslint/react.js', import.meta.url)),
    import(new URL('../packages/config-eslint/fsd.js', import.meta.url)),
  ]);

  assert.ok(
    reactConfig.some((config) => config.plugins?.['react-hooks']),
    'React Hooks plugin must be enabled',
  );
  assert.ok(
    reactConfig.some((config) => config.rules?.['react-hooks/rules-of-hooks'] === 'error'),
    'rules-of-hooks must be enforced',
  );

  const rules = fsdBoundariesConfig().flatMap((config) => Object.keys(config.rules ?? {}));
  assert.ok(rules.includes('boundaries/dependencies'));
  assert.ok(!rules.includes('boundaries/element-types'));
  assert.ok(!rules.includes('boundaries/entry-point'));
  assert.ok(!rules.includes('boundaries/no-private'));
});
