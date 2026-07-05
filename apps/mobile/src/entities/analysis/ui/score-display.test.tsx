import { render, screen } from '@testing-library/react-native';

import { ScoreDisplay } from './score-display';

describe('ScoreDisplay', () => {
  it('점수와 기본 라벨(종합 점수)을 표시한다', () => {
    render(<ScoreDisplay score={78} />);
    expect(screen.getByText('78')).toBeTruthy();
    expect(screen.getByText('종합 점수')).toBeTruthy();
  });

  it('전달한 라벨을 표시한다', () => {
    render(<ScoreDisplay score={40} label="성분 점수" />);
    expect(screen.getByText('40')).toBeTruthy();
    expect(screen.getByText('성분 점수')).toBeTruthy();
  });
});
