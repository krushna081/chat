import { describe, expect, it } from 'vitest';
import { isStrongPassword, isValidEmail, isValidUsername } from './validation.js';

describe('client-side validation', () => {
  it('matches the server password policy', () => {
    expect(isStrongPassword('RelayChat1!')).toBe(true);
    expect(isStrongPassword('relaychat1!')).toBe(false);
    expect(isStrongPassword('RelayChat!')).toBe(false);
    expect(isStrongPassword('RelayChat1')).toBe(false);
  });

  it('validates email and username forms', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidUsername('krushna_081')).toBe(true);
    expect(isValidUsername('a')).toBe(false);
  });
});
