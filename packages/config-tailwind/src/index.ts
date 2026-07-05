// Tailwind preset: Web(Tailwind v4)과 RN(NativeWind v4)이 공유한다.
// ui-tokens 의 값을 Tailwind theme 형태(문자열)로 변환해 단일 소스로 유지한다.
import { colors, fontSize, fontWeight, radius, spacing } from '@cosmetics-analyzer/ui-tokens';

const px = (value: number): string => `${value}px`;

const mapPx = (input: Record<string, number>): Record<string, string> =>
  Object.fromEntries(Object.entries(input).map(([key, value]) => [key, px(value)]));

/**
 * Tailwind / NativeWind 공용 preset.
 * 앱에서 `presets: [preset]` 로 사용한다.
 */
export const preset = {
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        neutral: colors.neutral,
        verdict: colors.verdict,
        recommendation: colors.recommendation,
      },
      spacing: mapPx(spacing),
      borderRadius: mapPx(radius),
      fontSize: mapPx(fontSize),
      fontWeight: { ...fontWeight },
    },
  },
};

export type Preset = typeof preset;

export default preset;
