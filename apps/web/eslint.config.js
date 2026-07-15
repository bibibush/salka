// apps/web ESLint flat config.
// 공용 reactConfig(base tseslint + Prettier + 브라우저 글로벌) + FSD 레이어 경계(boundaries).
//
// eslint-plugin-react-hooks/react-refresh 는 ESLint 10 호환 버전을 사용한다.
// eslint-plugin-react 는 7.37.5의 peer 범위가 ESLint 9까지라 제외한다.
import { reactConfig } from '@cosmetics-analyzer/config-eslint/react';
import { fsdBoundariesConfig } from '@cosmetics-analyzer/config-eslint/fsd';
import reactRefresh from 'eslint-plugin-react-refresh';

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
  reactRefresh.configs.vite,
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
      'boundaries/dependencies': 'off',
    },
  },
];
