import type { AnalysisResult } from '@cosmetics-analyzer/api-client';
import { create } from 'zustand';

// 마지막 분석 결과를 메모리에만 보관한다 (PDD §9: 클라이언트는 메모리 store 에만 보관).
// 앱 재시작 시 초기화되며 어떤 영속 저장소에도 기록하지 않는다.
export interface AnalysisResultState {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult) => void;
  reset: () => void;
}

export const useAnalysisResultStore = create<AnalysisResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  reset: () => set({ result: null }),
}));
