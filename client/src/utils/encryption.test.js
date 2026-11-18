import { describe, expect, it } from 'vitest';
import {
  bufferToHex,
  clearStoredEncryptionKeys,
  decryptMessage,
  encryptMessage,
  exportKey,
  generateEncryptionKey,
  getStoredKey,
  hexToBuffer,
  importKey,
  retrieveEncryptionKey,
  storeEncryptionKey,
} from './encryption.js';

const ROOM_ID = '0123456789abcdef';

describe('client-side encryption', () => {
  it('round-trips AES-GCM messages', async () => {
    const key = await generateEncryptionKey();
    const encrypted = await encryptMessage('hello RelayChat', key);

    expect(encrypted.iv).toMatch(/^[a-f0-9]{24}$/);
    expect(encrypted.encryptedData).toMatch(/^[a-f0-9]+$/);
    await expect(decryptMessage(encrypted.encryptedData, encrypted.iv, key)).resolves.toBe(
      'hello RelayChat'
    );
  });

  it('rejects tampered ciphertext', async () => {
    const key = await generateEncryptionKey();
    const encrypted = await encryptMessage('secret', key);
    const tampered = `${encrypted.encryptedData.slice(0, -2)}00`;

    await expect(decryptMessage(tampered, encrypted.iv, key)).rejects.toThrow();
  });

  it('exports and imports a room key without changing it', async () => {
    const key = await generateEncryptionKey();
    const hexKey = await exportKey(key);
    expect(hexKey).toMatch(/^[a-f0-9]{64}$/);

    const imported = await importKey(hexKey);
    const encrypted = await encryptMessage('round trip', imported);
    await expect(decryptMessage(encrypted.encryptedData, encrypted.iv, key)).resolves.toBe(
      'round trip'
    );
  });

  it('stores room keys in memory only and clears them explicitly', async () => {
    const key = await generateEncryptionKey();
    const hexKey = await exportKey(key);

    storeEncryptionKey(hexKey, ROOM_ID);
    expect(retrieveEncryptionKey(ROOM_ID)).toBe(hexKey);
    await expect(getStoredKey(ROOM_ID)).resolves.toBeTruthy();

    clearStoredEncryptionKeys();
    expect(retrieveEncryptionKey(ROOM_ID)).toBeNull();
    await expect(getStoredKey(ROOM_ID)).resolves.toBeNull();
  });

  it('ignores malformed keys and malformed hexadecimal data', async () => {
    storeEncryptionKey('not-a-key', ROOM_ID);
    expect(retrieveEncryptionKey(ROOM_ID)).toBeNull();
    expect(() => hexToBuffer('abc')).toThrow();
    expect(() => hexToBuffer('zz')).toThrow();
    await expect(importKey('a'.repeat(63))).rejects.toThrow();
  });

  it('encodes bytes as lowercase hexadecimal', () => {
    expect(bufferToHex(new Uint8Array([0, 15, 255]))).toBe('000fff');
  });
});
