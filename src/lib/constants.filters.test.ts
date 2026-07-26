import { describe, expect, it } from 'vitest';

import { matchesCpuFilter, formatStorageFilterLabel } from '@/lib/constants';

describe('matchesCpuFilter', () => {
  it('matches chip families inside full product labels', () => {
    expect(matchesCpuFilter('Apple M3 Pro', 'M3')).toBe(true);
    expect(matchesCpuFilter('Apple M3 Pro', 'M3 Pro')).toBe(true);
    expect(matchesCpuFilter('Apple A18 Pro', 'A18 Pro')).toBe(true);
    expect(matchesCpuFilter('Intel Core i9', 'Intel')).toBe(true);
  });

  it('does not match longer numeric chip suffixes', () => {
    expect(matchesCpuFilter('Apple M10', 'M1')).toBe(false);
    expect(matchesCpuFilter('A17 Pro', 'A1')).toBe(false);
  });

  it('treats empty / all as pass-through', () => {
    expect(matchesCpuFilter('Apple M2', '')).toBe(true);
    expect(matchesCpuFilter('Apple M2', 'all')).toBe(true);
  });
});

describe('formatStorageFilterLabel', () => {
  it('formats terabyte sizes', () => {
    expect(formatStorageFilterLabel(1024)).toBe('1 TB');
    expect(formatStorageFilterLabel(2048)).toBe('2 TB');
    expect(formatStorageFilterLabel(512)).toBe('512 GB');
  });
});
