import { describe, expect, it } from 'vitest';
import {
  isValidEncryptedPayload,
  isValidImage,
  isValidPassword,
  isValidRoomId,
  isValidUsername,
} from '../utils/validation.js';

const validCiphertext = 'a'.repeat(32);
const validIv = 'b'.repeat(24);

describe('server-side validation', () => {
  it('accepts only hex encrypted payloads with a 12-byte IV', () => {
    expect(isValidEncryptedPayload(validCiphertext, validIv)).toBe(true);
    expect(isValidEncryptedPayload('plain text', validIv)).toBe(false);
    expect(isValidEncryptedPayload(validCiphertext, 'b'.repeat(22))).toBe(false);
    expect(isValidEncryptedPayload('a'.repeat(31), validIv)).toBe(false);
  });

  it('validates passwords with length and character requirements', () => {
    expect(isValidPassword('RelayChat1!')).toBe(true);
    expect(isValidPassword('relaychat1!')).toBe(false);
    expect(isValidPassword('RelayChat!')).toBe(false);
    expect(isValidPassword('RelayChat1')).toBe(false);
  });

  it('validates usernames and room ids', () => {
    expect(isValidUsername('krushna_081')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidRoomId('0123456789abcdef')).toBe(true);
    expect(isValidRoomId('not-a-room')).toBe(false);
  });

  it('only allows safe raster data URLs or HTTPS image URLs', () => {
    expect(isValidImage('https://example.com/avatar.png')).toBe(true);
    expect(isValidImage('data:image/png;base64,aGVsbG8=')).toBe(true);
    expect(isValidImage('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isValidImage('javascript:alert(1)')).toBe(false);
    const oversized = Buffer.alloc(512 * 1024 + 1).toString('base64');
    expect(isValidImage(`data:image/png;base64,${oversized}`)).toBe(false);
  });
});
