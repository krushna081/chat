import { describe, expect, it } from 'vitest';
import {
  generateOTP,
  getAccessTokenFromSocket,
  hashOTP,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyOTP,
  verifyRefreshToken,
} from '../utils/auth.js';

const user = { _id: '507f1f77bcf86cd799439011', tokenVersion: 3 };

describe('authentication utilities', () => {
  it('generates six digit one-time codes', () => {
    for (let index = 0; index < 20; index += 1) {
      expect(generateOTP()).toMatch(/^\d{6}$/);
    }
  });

  it('hashes and verifies one-time codes', async () => {
    const otp = '123456';
    const hashed = await hashOTP(otp);
    expect(hashed).not.toBe(otp);
    await expect(verifyOTP(otp, hashed)).resolves.toBe(true);
    await expect(verifyOTP('654321', hashed)).resolves.toBe(false);
  });

  it('signs and verifies access tokens with type and token version', () => {
    const token = signAccessToken(user);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(user._id);
    expect(decoded.ver).toBe(3);
    expect(decoded.type).toBe('access');
    expect(decoded.iss).toBe('relaychat');
    expect(decoded.aud).toBe('relaychat-web');
  });

  it('only accepts refresh tokens through the refresh verifier', () => {
    const refreshToken = signRefreshToken(user);
    expect(verifyRefreshToken(refreshToken).type).toBe('refresh');
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });

  it('rejects an access token passed to the refresh verifier', () => {
    const accessToken = signAccessToken(user);
    expect(verifyRefreshToken(accessToken)).toBeNull();
  });

  it('reads socket authentication only from the httpOnly access cookie', () => {
    const socket = {
      handshake: {
        auth: { token: 'handshake-token' },
        headers: { cookie: 'accessToken=cookie-token; refreshToken=refresh-token' },
      },
    };
    expect(getAccessTokenFromSocket(socket)).toBe('cookie-token');
    expect(
      getAccessTokenFromSocket({
        handshake: { auth: { token: 'handshake-token' }, headers: {} },
      })
    ).toBeNull();
  });
});
