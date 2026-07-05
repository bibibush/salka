import { describe, expect, it } from 'vitest';

import { RECOMMENDATION_LABEL, VERDICT_LABEL, verdictTone } from './verdict';

describe('verdict 라벨/톤 매핑', () => {
  it('Verdict 를 참고 판단형 한글 라벨로 매핑한다', () => {
    expect(VERDICT_LABEL.GOOD).toBe('양호');
    expect(VERDICT_LABEL.CAUTION).toBe('주의');
    expect(VERDICT_LABEL.BAD).toBe('유의');
  });

  it('Recommendation 을 참고 판단형 한글 라벨로 매핑한다', () => {
    expect(RECOMMENDATION_LABEL.RECOMMENDED).toBeTruthy();
    expect(RECOMMENDATION_LABEL.NEUTRAL).toBeTruthy();
    expect(RECOMMENDATION_LABEL.CAUTION_NEEDED).toBeTruthy();
  });

  it('금지된 단정 표현(유해/위험/안전)을 라벨에 사용하지 않는다', () => {
    const banned = ['유해', '위험', '안전'];
    const labels = [...Object.values(VERDICT_LABEL), ...Object.values(RECOMMENDATION_LABEL)];
    for (const label of labels) {
      for (const word of banned) {
        expect(label).not.toContain(word);
      }
    }
  });

  it('verdictTone 은 Verdict 를 색상 토큰 키로 매핑한다', () => {
    expect(verdictTone('GOOD')).toBe('good');
    expect(verdictTone('CAUTION')).toBe('caution');
    expect(verdictTone('BAD')).toBe('bad');
  });
});
