import type { AnalysisResult } from '@cosmetics-analyzer/api-client';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAnalysisResultStore } from './result-store';

const sample: AnalysisResult = {
  overall_score: 78,
  verdict: 'GOOD',
  summary: '전반적으로 무난한 편',
  recommendation: 'RECOMMENDED',
  assessments: [{ ingredient: 'Niacinamide', verdict: 'GOOD', score: 90, reason: '보습에 도움' }],
  cautions: [],
  disclaimer: '본 결과는 참고용입니다.',
};

describe('useAnalysisResultStore (메모리 결과 보관)', () => {
  beforeEach(() => {
    useAnalysisResultStore.getState().reset();
  });

  it('초기 결과는 null 이다', () => {
    expect(useAnalysisResultStore.getState().result).toBeNull();
  });

  it('setResult 로 마지막 결과를 보관한다', () => {
    useAnalysisResultStore.getState().setResult(sample);
    expect(useAnalysisResultStore.getState().result).toEqual(sample);
  });

  it('reset 으로 결과를 비운다', () => {
    useAnalysisResultStore.getState().setResult(sample);
    useAnalysisResultStore.getState().reset();
    expect(useAnalysisResultStore.getState().result).toBeNull();
  });
});
