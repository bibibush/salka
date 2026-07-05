import type { AnalysisResult } from '@cosmetics-analyzer/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalysisResultStore } from '@/entities/analysis';
import { apiClient } from '@/shared/api';

import { AnalyzeForm } from './analyze-form';

// 백엔드 호출을 대체할 mock API 클라이언트 (네트워크 의존 제거).
vi.mock('@/shared/api', () => ({
  apiClient: {
    analyzeByIngredientsText: vi.fn(),
    analyzeByIngredientsImage: vi.fn(),
  },
}));

const result: AnalysisResult = {
  overall_score: 82,
  verdict: 'GOOD',
  summary: '무난합니다',
  recommendation: 'RECOMMENDED',
  assessments: [],
  cautions: [],
  disclaimer: '참고용입니다.',
};

function renderForm(onAnalyzed?: () => void) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AnalyzeForm onAnalyzed={onAnalyzed} />, { wrapper });
}

describe('AnalyzeForm (텍스트 성분 분석)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalysisResultStore.getState().reset();
  });

  it('입력한 성분 텍스트로 분석을 요청하고 결과를 store 에 보관한다', async () => {
    vi.mocked(apiClient.analyzeByIngredientsText).mockResolvedValue(result);
    const onAnalyzed = vi.fn();
    const user = userEvent.setup();
    renderForm(onAnalyzed);

    await user.type(screen.getByLabelText('전성분 텍스트'), 'Water, Niacinamide');
    await user.click(screen.getByRole('button', { name: '분석하기' }));

    await waitFor(() => {
      expect(apiClient.analyzeByIngredientsText).toHaveBeenCalledWith('Water, Niacinamide');
    });
    await waitFor(() => {
      expect(useAnalysisResultStore.getState().result).toEqual(result);
    });
    expect(onAnalyzed).toHaveBeenCalled();
  });

  it('성분 텍스트가 비어 있으면 분석을 요청하지 않는다', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: '분석하기' }));

    expect(apiClient.analyzeByIngredientsText).not.toHaveBeenCalled();
  });
});
