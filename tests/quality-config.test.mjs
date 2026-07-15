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

test('unfinished Mobile CD remains manual until R5-CD2 credentials are ready', async () => {
  const workflow = await readFile(new URL('.github/workflows/mobile-cd.yml', rootUrl), 'utf8');
  const triggerBlock = workflow.match(/^on:\n([\s\S]*?)\n\nconcurrency:/m)?.[1];

  assert.ok(triggerBlock, 'Mobile CD trigger block not found');
  assert.match(triggerBlock, /^  workflow_dispatch:/m);
  assert.doesNotMatch(triggerBlock, /^  push:/m);
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
