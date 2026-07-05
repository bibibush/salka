// apps/web ESLint flat config.
// 공용 reactConfig(base tseslint + Prettier + 브라우저 글로벌) + FSD 레이어 경계(boundaries).
//
// NOTE: eslint-plugin-react / react-hooks / react-refresh 는 아직 ESLint 10 의 새 context
// API 에 대응하지 않아(예: react 7.37.5 의 getFilename, react-hooks 7.x 의 zod v4 충돌)
// 로딩이 깨진다. ESLint 10 대응 버전이 나오면 다시 추가한다. 그 전까지 React 규칙은
// TypeScript strict + tseslint 로 대체한다.
import { reactConfig } from '@cosmetics-analyzer/config-eslint/react';
import { fsdBoundariesConfig } from '@cosmetics-analyzer/config-eslint/fsd';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      // boundaries가 `@/` alias와 확장자를 해석할 수 있도록 TS 리졸버를 등록한다.
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
  },
  // FSD 레이어 경계: app > pages > widgets > features > entities > shared
  ...fsdBoundariesConfig({ basePath: 'src' }),
  // 테스트/설정 파일은 경계 규칙 대상에서 제외
  {
    files: [
      '**/*.test.{ts,tsx}',
      'vitest.setup.ts',
      'vite.config.ts',
      'eslint.config.js',
      'steiger.config.js',
    ],
    rules: {
      'boundaries/element-types': 'off',
      'boundaries/no-private': 'off',
    },
  },
];
