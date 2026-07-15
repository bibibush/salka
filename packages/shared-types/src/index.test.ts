import { describe, expect, it } from 'vitest';

import { Recommendation, Verdict } from './index';

describe('shared analysis enums', () => {
  it('keeps verdict values aligned with the API wire contract', () => {
    expect(Object.values(Verdict)).toEqual(['GOOD', 'CAUTION', 'BAD']);
  });

  it('keeps recommendation values aligned with the API wire contract', () => {
    expect(Object.values(Recommendation)).toEqual(['RECOMMENDED', 'NEUTRAL', 'CAUTION_NEEDED']);
  });
});
