import { describe, expect, it } from 'vitest';

import { formatPrice, formatRam, formatStorage } from '@/lib/format';

describe('formatPrice', () => {
  it('formats with EGP and the Egyptian locale by default', () => {
    const formatted = formatPrice(12345);
    expect(formatted).toContain('ج.م');
    expect(formatted).toContain('١٢٬٣٤٥');
  });

  it('uses Western digits when the en-US locale is requested', () => {
    const formatted = formatPrice(12345, 'USD', 'en-US');
    expect(formatted).toContain('$');
    expect(formatted).toContain('12,345');
  });
});

describe('formatRam / formatStorage', () => {
  it('formats GB under 1024', () => {
    expect(formatRam(16)).toBe('16 GB');
    expect(formatStorage(512)).toBe('512 GB');
  });

  it('formats TB at or above 1024 GB', () => {
    expect(formatRam(1024)).toBe('1 TB');
    expect(formatStorage(2048)).toBe('2 TB');
  });
});
