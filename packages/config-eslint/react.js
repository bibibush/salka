// React(Web/RN) 앱용 ESLint flat config. base + 브라우저 글로벌.
// React 플러그인은 앱(R3/R4)에서 자체 추가한다 — 여기서는 공용 베이스만 제공한다.
import globals from 'globals';
import { baseConfig } from './base.js';

/** @type {import('typescript-eslint').ConfigArray} */
export const reactConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];

export default reactConfig;
