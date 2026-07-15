// React(Web/RN) 앱용 ESLint flat config. base + 브라우저 글로벌 + Hooks 규칙.
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import { baseConfig } from './base.js';

/** @type {import('typescript-eslint').ConfigArray} */
export const reactConfig = [
  ...baseConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default reactConfig;
