// FSD(Feature-Sliced Design) 레이어 경계 강제 설정 (eslint-plugin-boundaries).
//
// 상위 레이어는 하위 레이어만 import 할 수 있다 (FSD 표준):
//   app > pages > widgets > features > entities > shared
// 같은 레이어 슬라이스 간 cross-import 는 금지한다.
//
// 앱(Web/RN)은 자신의 eslint.config.js 에서 이 팩토리를 호출해 적용한다:
//   import { fsdBoundariesConfig } from '@cosmetics-analyzer/config-eslint/fsd';
//   export default [...reactConfig, ...fsdBoundariesConfig()];
import boundaries from 'eslint-plugin-boundaries';

// 상위 → 하위 순서. index 가 작을수록 상위 레이어.
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

/**
 * @param {object} [options]
 * @param {string} [options.basePath] 레이어가 위치한 소스 루트 (기본 'src')
 * @returns {import('eslint').Linter.Config[]}
 */
export function fsdBoundariesConfig(options = {}) {
  const basePath = options.basePath ?? 'src';

  const elements = LAYERS.map((layer) => ({
    type: layer,
    pattern: `${basePath}/${layer}/*`,
    mode: 'folder',
  }));

  // 각 레이어가 import 가능한 하위 레이어 목록을 생성한다.
  const rules = LAYERS.map((layer, index) => {
    const allow = LAYERS.slice(index + 1);
    // shared 는 슬라이스가 아니라 세그먼트(ui/api/lib/config)로 구성되며,
    // 세그먼트 간 상호 참조는 FSD 상 허용된다. 따라서 shared → shared 를 허용한다.
    if (layer === 'shared') {
      allow.push('shared');
    }
    return {
      from: { type: layer },
      allow: {
        to: {
          type: allow,
          internalPath: ['index.ts', 'index.tsx', 'index.js', 'index.jsx'],
        },
      },
    };
  });

  return [
    {
      files: [`**/${basePath}/**/*.{ts,tsx,js,jsx}`],
      plugins: { boundaries },
      settings: {
        'boundaries/include': [`**/${basePath}/**/*`],
        'boundaries/elements': elements,
      },
      rules: {
        'boundaries/dependencies': ['error', { default: 'disallow', rules }],
      },
    },
  ];
}

export default fsdBoundariesConfig;
