import type { AnalysisResult } from '@cosmetics-analyzer/api-client';

export type Verdict = AnalysisResult['verdict'];
export type Recommendation = AnalysisResult['recommendation'];

/** Verdict 색상 토큰 키 (ui-tokens 의 verdict.* 와 매핑). */
export type VerdictTone = 'good' | 'caution' | 'bad';

// 참고 판단형 한글 라벨. 단정 표현("유해"/"위험"/"안전")은 사용하지 않는다 (PDD §13).
export const VERDICT_LABEL: Record<Verdict, string> = {
  GOOD: '양호',
  CAUTION: '주의',
  BAD: '유의',
};

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  RECOMMENDED: '참고로 추천',
  NEUTRAL: '중립',
  CAUTION_NEEDED: '주의해서 확인',
};

const VERDICT_TONE: Record<Verdict, VerdictTone> = {
  GOOD: 'good',
  CAUTION: 'caution',
  BAD: 'bad',
};

export function verdictTone(verdict: Verdict): VerdictTone {
  return VERDICT_TONE[verdict];
}
