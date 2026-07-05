// Tailwind v4 레거시 JS 설정. 공용 preset(config-tailwind)을 통해 RN(NativeWind)과
// 동일한 디자인 토큰을 사용한다. CSS 에서 `@config` 지시자로 로드한다.
import preset from '@cosmetics-analyzer/config-tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
};
