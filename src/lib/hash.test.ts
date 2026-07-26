import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '@/lib/hash';

describe('password hashing', () => {
  it('produces a deterministic hash for the same password + salt', async () => {
    const salt = 'a'.repeat(32);
    const a = await hashPassword('hunter2', salt);
    const b = await hashPassword('hunter2', salt);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]+$/);
  });

  it('verifies a correct password', async () => {
    const salt = 'b'.repeat(32);
    const hash = await hashPassword('correct horse battery staple', salt);
    await expect(verifyPassword('correct horse battery staple', salt, hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const salt = 'c'.repeat(32);
    const hash = await hashPassword('right', salt);
    await expect(verifyPassword('wrong', salt, hash)).resolves.toBe(false);
  });

  it('rejects a tampered hash of the same length', async () => {
    const salt = 'd'.repeat(32);
    const hash = await hashPassword('right', salt);
    const tampered = hash.replace(/.$/, (c) => (c === '0' ? '1' : '0'));
    await expect(verifyPassword('right', salt, tampered)).resolves.toBe(false);
  });
});
