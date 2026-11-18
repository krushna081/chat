import { describe, expect, it } from 'vitest';
import { EXPIRY_MS, getExpiryDate, isValidExpiry } from '../utils/messageExpiry.js';

describe('message expiry', () => {
  it('resolves every supported expiry value', () => {
    for (const value of Object.keys(EXPIRY_MS)) {
      expect(isValidExpiry(value)).toBe(true);
    }
  });

  it('returns the correct expiry timestamp', () => {
    const now = Date.UTC(2026, 0, 1);
    expect(getExpiryDate('1h', now).getTime()).toBe(now + 60 * 60 * 1000);
    expect(getExpiryDate('24h', now).getTime()).toBe(now + 24 * 60 * 60 * 1000);
    expect(getExpiryDate('3d', now).getTime()).toBe(now + 3 * 24 * 60 * 60 * 1000);
    expect(getExpiryDate('1w', now).getTime()).toBe(now + 7 * 24 * 60 * 60 * 1000);
    expect(getExpiryDate('permanent', now)).toBeNull();
  });

  it('rejects unknown expiry values', () => {
    expect(isValidExpiry('never')).toBe(false);
    expect(getExpiryDate('never')).toBeNull();
  });
});
