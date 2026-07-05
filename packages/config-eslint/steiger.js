// 공용 Steiger 설정 (FSD 구조 전용 린터).
// eslint-plugin-boundaries 와 별개로, FSD 슬라이스/세그먼트 구조 자체를 검사한다.
//
// 앱(Web/RN)은 루트에 steiger.config.js 를 두고 이 베이스를 확장한다:
//   import { steigerConfig } from '@cosmetics-analyzer/config-eslint/steiger';
//   export default steigerConfig;
import fsd from '@feature-sliced/steiger-plugin';

/** @type {import('steiger').Config} */
export const steigerConfig = [...fsd.configs.recommended];

export default steigerConfig;
