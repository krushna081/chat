import { describe, expect, it } from 'vitest';
import { validateMessagePayload } from '../controllers/chatController.js';

const roomId = '0123456789abcdef';
const encryptedMessage = 'a'.repeat(32);
const iv = 'b'.repeat(24);

describe('Socket.IO message payload validation', () => {
  it('accepts only room ids and encrypted payloads', () => {
    expect(validateMessagePayload({ roomId, encryptedMessage, iv })).toBe(true);
  });

  it('rejects plaintext messages', () => {
    expect(validateMessagePayload({ roomId, message: 'hello', iv })).toBe(false);
  });

  it('rejects malformed ids, ciphertext, and IVs', () => {
    expect(validateMessagePayload({ roomId: 'bad', encryptedMessage, iv })).toBe(false);
    expect(validateMessagePayload({ roomId, encryptedMessage: 'not-hex', iv })).toBe(false);
    expect(validateMessagePayload({ roomId, encryptedMessage, iv: 'bad' })).toBe(false);
    expect(validateMessagePayload(null)).toBe(false);
  });
});
