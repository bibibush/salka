import { render, screen } from '@testing-library/react-native';

import { VerdictBadge } from './verdict-badge';

describe('VerdictBadge', () => {
  it('Verdict 에 해당하는 한글 라벨을 표시한다', () => {
    render(<VerdictBadge verdict="GOOD" />);
    expect(screen.getByText('양호')).toBeTruthy();
  });

  it('CAUTION Verdict 라벨을 표시한다', () => {
    render(<VerdictBadge verdict="CAUTION" />);
    expect(screen.getByText('주의')).toBeTruthy();
  });
});
