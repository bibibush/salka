// 디자인 토큰: Web(Tailwind v4)과 RN(NativeWind v4)이 config-tailwind preset 을
// 통해 동일한 값을 사용한다. 단정 표현을 피하는 제품 톤에 맞춰 채도를 절제한다.

export const colors = {
  // 브랜드 (절제된 청록 계열)
  brand: {
    50: '#eefcf9',
    100: '#d4f6ee',
    200: '#abe9de',
    300: '#74d6c8',
    400: '#3dbcae',
    500: '#1f9f93',
    600: '#177f78',
    700: '#166661',
    800: '#16514e',
    900: '#164341',
  },
  neutral: {
    0: '#ffffff',
    50: '#f8fafa',
    100: '#eef1f1',
    200: '#dde3e3',
    300: '#c2cbcb',
    400: '#97a3a3',
    500: '#6b7878',
    600: '#505b5b',
    700: '#3d4646',
    800: '#272d2d',
    900: '#151919',
  },
  // 판정 등급(Verdict) 색상. 단정형 의미를 피하고 시각 구분 용도로만 사용한다.
  verdict: {
    good: '#2f9e6f',
    caution: '#c9962a',
    bad: '#c0563f',
  },
  // 추천 등급(Recommendation) 색상.
  recommendation: {
    recommended: '#2f9e6f',
    neutral: '#6b7878',
    cautionNeeded: '#c9962a',
  },
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
} as const;

export type Tokens = typeof tokens;

export default tokens;
