// 백엔드 OpenAPI 에서 생성한 타입(./generated/schema)을 사용하는 ky 기반 클라이언트.
// 호출은 모두 이 wrapper 를 통해 수행한다 (PDD §4.3).
import ky from 'ky';
import type { Options } from 'ky';

import type { components } from './generated/schema';

export type AnalysisResult = components['schemas']['AnalysisResultSchema'];
export type IngredientAssessment = components['schemas']['IngredientAssessmentSchema'];
export type Caution = components['schemas']['CautionSchema'];
export type HealthResponse = components['schemas']['HealthResponse'];
export type AnalyzeByTextRequest = components['schemas']['AnalyzeByTextRequest'];

export interface ApiClientOptions {
  /** 백엔드 서버 루트 URL (예: http://localhost:8000) */
  baseUrl: string;
  /** ky 인스턴스 추가 옵션 (헤더, 타임아웃, hooks 등) */
  kyOptions?: Options;
}

export interface CosmeticsApiClient {
  /** GET /health */
  health(): Promise<HealthResponse>;
  /** POST /api/v1/analysis/by-ingredients-text */
  analyzeByIngredientsText(ingredients: string): Promise<AnalysisResult>;
  /** POST /api/v1/analysis/by-ingredients-image */
  analyzeByIngredientsImage(image: Blob, filename?: string): Promise<AnalysisResult>;
}

export function createApiClient({ baseUrl, kyOptions }: ApiClientOptions): CosmeticsApiClient {
  const http = ky.create({ baseUrl, ...kyOptions });

  return {
    health: () => http.get('health').json<HealthResponse>(),

    analyzeByIngredientsText: (ingredients) => {
      const body: AnalyzeByTextRequest = { ingredients };
      return http
        .post('api/v1/analysis/by-ingredients-text', { json: body })
        .json<AnalysisResult>();
    },

    analyzeByIngredientsImage: (image, filename = 'ingredients.jpg') => {
      const form = new FormData();
      form.append('image', image, filename);
      return http
        .post('api/v1/analysis/by-ingredients-image', { body: form })
        .json<AnalysisResult>();
    },
  };
}
