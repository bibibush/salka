// apps/mobile ESLint flat config.
// 공용 reactConfig(base tseslint + Prettier) + FSD 레이어 경계(boundaries).
//
// eslint-plugin-react-hooks는 ESLint 10 호환 버전을 공용 config에서 적용한다.
// eslint-plugin-react는 7.37.5의 peer 범위가 ESLint 9까지라 제외한다.
//
// mobile 패키지는 CommonJS(Expo/Metro 관례)이므로 이 flat config 는 .mjs 로 둔다.
import { reactConfig } from '@cosmetics-analyzer/config-eslint/react';
import { fsdBoundariesConfig } from '@cosmetics-analyzer/config-eslint/fsd';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.expo/**',
      'coverage/**',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
    ],
  },
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      // boundaries 가 `@/` alias 와 확장자를 해석할 수 있도록 TS 리졸버를 등록한다.
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
      'jest.config.js',
      'babel.config.js',
      'metro.config.js',
      'tailwind.config.js',
      'eslint.config.mjs',
      'steiger.config.mjs',
    ],
    rules: {
      'boundaries/dependencies': 'off',
    },
  },
  // CommonJS 설정 파일은 require() 사용이 정상이다.
  {
    files: ['metro.config.js', 'tailwind.config.js', 'babel.config.js', 'jest.config.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
