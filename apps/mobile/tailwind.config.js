// NativeWind v4 (Tailwind v3) 설정.
// 공용 preset(config-tailwind)으로 Web(Tailwind v4)과 동일한 디자인 토큰을 사용한다.
const preset = require('@cosmetics-analyzer/config-tailwind').default;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset'), preset],
  theme: { extend: {} },
  plugins: [],
};
