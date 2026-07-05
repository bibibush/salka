import type { AnalysisResult } from '@cosmetics-analyzer/api-client';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { apiClient } from '@/shared/api';

/** expo-image-picker 로 선택한 이미지의 업로드용 표현. */
export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

/** 텍스트 전성분 분석 요청. */
export function useAnalyzeText(): UseMutationResult<AnalysisResult, Error, string> {
  return useMutation({
    mutationFn: (ingredients: string) => apiClient.analyzeByIngredientsText(ingredients),
  });
}

/** 이미지 전성분 분석 요청. */
export function useAnalyzeImage(): UseMutationResult<AnalysisResult, Error, PickedImage> {
  return useMutation({
    // RN 의 FormData 는 { uri, name, type } 형태를 파일 파트로 받는다(웹의 Blob 과 다름).
    mutationFn: (image: PickedImage) =>
      apiClient.analyzeByIngredientsImage(image as unknown as Blob, image.name),
  });
}
