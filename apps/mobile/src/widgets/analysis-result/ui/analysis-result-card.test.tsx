import type { AnalysisResult } from '@cosmetics-analyzer/api-client';
import { render, screen } from '@testing-library/react-native';

import { AnalysisResultCard } from './analysis-result-card';

const result: AnalysisResult = {
  overall_score: 78,
  verdict: 'GOOD',
  summary: '전반적으로 무난한 편입니다',
  recommendation: 'RECOMMENDED',
  assessments: [
    { ingredient: 'Niacinamide', verdict: 'GOOD', score: 90, reason: '보습과 톤 개선에 도움' },
    { ingredient: 'Fragrance', verdict: 'CAUTION', score: 40, reason: '민감성 피부는 확인 필요' },
  ],
  cautions: [{ ingredient: 'Fragrance', reason: '향료에 민감한 경우 주의' }],
  disclaimer: '본 결과는 참고용이며 의학적 진단이 아닙니다.',
};

describe('AnalysisResultCard', () => {
  it('전체 점수와 요약을 표시한다', () => {
    render(<AnalysisResultCard result={result} />);
    expect(screen.getByText('78')).toBeTruthy();
    expect(screen.getByText('전반적으로 무난한 편입니다')).toBeTruthy();
  });

  it('개별 성분 평가(이름과 사유)를 표시한다', () => {
    render(<AnalysisResultCard result={result} />);
    expect(screen.getByText('Niacinamide')).toBeTruthy();
    expect(screen.getByText('보습과 톤 개선에 도움')).toBeTruthy();
    // Fragrance 는 성분 평가와 주의 성분 양쪽에 등장할 수 있다.
    expect(screen.getAllByText('Fragrance').length).toBeGreaterThan(0);
  });

  it('주의 성분(cautions)을 표시한다', () => {
    render(<AnalysisResultCard result={result} />);
    expect(screen.getByText('향료에 민감한 경우 주의')).toBeTruthy();
  });

  it('면책 문구를 항상 표시한다', () => {
    render(<AnalysisResultCard result={result} />);
    expect(screen.getByText('본 결과는 참고용이며 의학적 진단이 아닙니다.')).toBeTruthy();
  });
});
