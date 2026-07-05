import type { AnalysisResult } from '@cosmetics-analyzer/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useAnalysisResultStore } from '@/entities/analysis';
import { apiClient } from '@/shared/api';

import { AnalyzeForm } from './analyze-form';

// 백엔드 호출을 대체할 mock API 클라이언트 (네트워크 의존 제거).
jest.mock('@/shared/api', () => ({
  apiClient: {
    analyzeByIngredientsText: jest.fn(),
    analyzeByIngredientsImage: jest.fn(),
  },
}));

// 이미지 선택은 네이티브 모듈이므로 mock 으로 대체한다.
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

const mockedAnalyzeText = apiClient.analyzeByIngredientsText as jest.Mock;

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
    jest.clearAllMocks();
    useAnalysisResultStore.getState().reset();
  });

  it('입력한 성분 텍스트로 분석을 요청하고 결과를 store 에 보관한다', async () => {
    mockedAnalyzeText.mockResolvedValue(result);
    const onAnalyzed = jest.fn();
    renderForm(onAnalyzed);

    fireEvent.changeText(screen.getByLabelText('전성분 텍스트'), 'Water, Niacinamide');
    fireEvent.press(screen.getByText('분석하기'));

    await waitFor(() => {
      expect(mockedAnalyzeText).toHaveBeenCalledWith('Water, Niacinamide');
    });
    await waitFor(() => {
      expect(useAnalysisResultStore.getState().result).toEqual(result);
    });
    expect(onAnalyzed).toHaveBeenCalled();
  });

  it('성분 텍스트가 비어 있으면 분석을 요청하지 않는다', async () => {
    renderForm();

    fireEvent.press(screen.getByText('분석하기'));

    await waitFor(() => {
      expect(screen.getByText('전성분 텍스트를 입력해 주세요.')).toBeTruthy();
    });
    expect(mockedAnalyzeText).not.toHaveBeenCalled();
  });
});
