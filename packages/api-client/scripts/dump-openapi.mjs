// 백엔드(apps/api) FastAPI 앱에서 OpenAPI 스펙을 추출해 openapi.json 으로 저장한다.
// uv 가 설치된 환경(파이썬 의존성 보유)에서만 동작한다.
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(here, '../../../apps/api');
const outFile = resolve(here, '../openapi.json');

const spec = execFileSync('uv', ['run', 'python', '-m', 'scripts.export_openapi'], {
  cwd: apiDir,
  encoding: 'utf-8',
  maxBuffer: 16 * 1024 * 1024,
});

writeFileSync(outFile, spec, 'utf-8');
console.log(`OpenAPI 스펙을 ${outFile} 에 저장했습니다.`);
