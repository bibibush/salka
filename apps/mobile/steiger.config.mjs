// apps/mobile Steiger 설정 (FSD 슬라이스/세그먼트 구조 린터).
import { steigerConfig } from '@cosmetics-analyzer/config-eslint/steiger';

export default [
  ...steigerConfig,
  {
    rules: {
      // insignificant-slice: "한 곳에서만 참조되는 슬라이스는 병합하라"는 휴리스틱.
      // AGENTS/PDD 가 features·widgets 레이어 분리를 필수로 규정하므로 off 한다.
      // 레이어 경계(임포트 방향)는 eslint-plugin-boundaries 가 별도로 강제한다.
      'fsd/insignificant-slice': 'off',
    },
  },
];
