// 백엔드(apps/api) 도메인 DTO 를 미러링한 프론트엔드 공용 타입.
// 와이어 포맷(snake_case)을 그대로 따르며, api-client 의 OpenAPI 생성 타입과
// 구조적으로 호환되어야 한다(런타임 검증은 api-client 의 타입 어서션에서 수행).

/** 성분/결과 판정 등급 (참고 판단형). */
export const Verdict = {
  GOOD: 'GOOD',
  CAUTION: 'CAUTION',
  BAD: 'BAD',
} as const;
export type Verdict = (typeof Verdict)[keyof typeof Verdict];

/** 전체 결과 추천 등급 (참고 판단형). */
export const Recommendation = {
  RECOMMENDED: 'RECOMMENDED',
  NEUTRAL: 'NEUTRAL',
  CAUTION_NEEDED: 'CAUTION_NEEDED',
} as const;
export type Recommendation = (typeof Recommendation)[keyof typeof Recommendation];

/** 개별 성분 평가. */
export interface IngredientAssessment {
  ingredient: string;
  verdict: Verdict;
  /** 0~100 */
  score: number;
  reason: string;
}

/** 주의 성분. */
export interface Caution {
  ingredient: string;
  reason: string;
}

/** 분석 결과. 면책 문구(disclaimer)가 항상 포함된다. */
export interface AnalysisResult {
  /** 0~100 */
  overall_score: number;
  verdict: Verdict;
  summary: string;
  recommendation: Recommendation;
  assessments: IngredientAssessment[];
  cautions: Caution[];
  disclaimer: string;
}

/** 성분 텍스트 분석 요청 본문. */
export interface AnalyzeByTextRequest {
  ingredients: string;
}

/** 헬스 체크 응답. */
export interface HealthResponse {
  status: string;
}

/** RFC 7807 Problem Details (application/problem+json). */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string | null;
  instance?: string | null;
}
