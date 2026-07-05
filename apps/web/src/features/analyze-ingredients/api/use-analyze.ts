import type { AnalysisResult } from '@cosmetics-analyzer/api-client';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { apiClient } from '@/shared/api';

/** 텍스트 전성분 분석 요청. */
export function useAnalyzeText(): UseMutationResult<AnalysisResult, Error, string> {
  return useMutation({
    mutationFn: (ingredients: string) => apiClient.analyzeByIngredientsText(ingredients),
  });
}

/** 이미지 전성분 분석 요청. */
export function useAnalyzeImage(): UseMutationResult<AnalysisResult, Error, File> {
  return useMutation({
    mutationFn: (image: File) => apiClient.analyzeByIngredientsImage(image, image.name),
  });
}
