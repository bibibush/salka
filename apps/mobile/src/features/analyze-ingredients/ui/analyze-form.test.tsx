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
}));

// 카메라는 네이티브 모듈이므로 mock 으로 대체한다.
// CameraView 는 ref 로 takePictureAsync 를 노출하는 forwardRef 컴포넌트로 흉내낸다.
let mockCameraPermission: { granted: boolean } | null = { granted: true };
const mockRequestPermission = jest.fn();
const mockTakePicture = jest.fn();

jest.mock('expo-camera', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    // RN host 컴포넌트를 렌더하면 nativewind babel 변환과 충돌하므로 null 을 반환하고
    // ref 로 takePictureAsync 만 노출한다. camera-view testID 는 실제 컴포넌트의 래퍼에 있다.
    CameraView: React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTakePicture }));
      return null;
    }),
    useCameraPermissions: () => [mockCameraPermission, mockRequestPermission],
  };
});

const mockedAnalyzeText = apiClient.analyzeByIngredientsText as jest.Mock;
const mockedAnalyzeImage = apiClient.analyzeByIngredientsImage as jest.Mock;

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

describe('AnalyzeForm (카메라 촬영 - 메인)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraPermission = { granted: true };
    useAnalysisResultStore.getState().reset();
  });

  it('기본 진입 시 카메라 라이브 프리뷰를 메인으로 보여준다', () => {
    renderForm();

    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.getByLabelText('촬영')).toBeTruthy();
  });

  it('촬영 버튼을 누르면 사진을 찍어 분석을 요청하고 결과를 store 에 보관한다', async () => {
    mockTakePicture.mockResolvedValue({ uri: 'file://photo.jpg', width: 100, height: 100 });
    mockedAnalyzeImage.mockResolvedValue(result);
    const onAnalyzed = jest.fn();
    renderForm(onAnalyzed);

    fireEvent.press(screen.getByLabelText('촬영'));

    await waitFor(() => {
      expect(mockTakePicture).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockedAnalyzeImage).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(useAnalysisResultStore.getState().result).toEqual(result);
    });
    expect(onAnalyzed).toHaveBeenCalled();
  });

  it('카메라 권한이 없으면 프리뷰 대신 권한 요청 UI 를 보여준다', () => {
    mockCameraPermission = { granted: false };
    renderForm();

    expect(screen.queryByTestId('camera-view')).toBeNull();
    const grant = screen.getByText('카메라 권한 허용');
    expect(grant).toBeTruthy();

    fireEvent.press(grant);
    expect(mockRequestPermission).toHaveBeenCalled();
  });
});

describe('AnalyzeForm (보조 입력: 텍스트/이미지 업로드)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraPermission = { granted: true };
    useAnalysisResultStore.getState().reset();
  });

  it('텍스트 입력으로 전환해 성분 텍스트로 분석을 요청한다', async () => {
    mockedAnalyzeText.mockResolvedValue(result);
    const onAnalyzed = jest.fn();
    renderForm(onAnalyzed);

    fireEvent.press(screen.getByText('텍스트 입력'));
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

  it('텍스트 입력 전환 후 성분 텍스트가 비어 있으면 분석을 요청하지 않는다', async () => {
    renderForm();

    fireEvent.press(screen.getByText('텍스트 입력'));
    fireEvent.press(screen.getByText('분석하기'));

    await waitFor(() => {
      expect(screen.getByText('전성분 텍스트를 입력해 주세요.')).toBeTruthy();
    });
    expect(mockedAnalyzeText).not.toHaveBeenCalled();
  });
});
