// 공용 ESLint flat config 베이스 (TS + Prettier 호환).
// 모든 TS 패키지/앱이 이 베이스를 확장한다.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/** @type {import('typescript-eslint').ConfigArray} */
export const baseConfig = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/generated/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Prettier와 충돌하는 포맷팅 규칙 비활성화 (항상 마지막)
  prettier,
);

export default baseConfig;
