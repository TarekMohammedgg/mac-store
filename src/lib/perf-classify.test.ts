import { describe, expect, it } from 'vitest';

import { classify } from '@/lib/perf-classify';

describe('perf-classify', () => {
  it('marks a value as small when it is under the threshold', () => {
    expect(classify(100, 200)).toBe('small');
  });

  it('marks a value as large when it is at or above the threshold', () => {
    expect(classify(200, 200)).toBe('large');
  });

  it('handles zero', () => {
    expect(classify(0, 1)).toBe('small');
  });
});
