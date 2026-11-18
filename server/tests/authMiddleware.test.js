import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findById } = vi.hoisted(() => ({ findById: vi.fn() }));

vi.mock('../models/User.js', () => ({
  default: { findById },
}));

const { authenticate } = await import('../middleware/auth.js');
const { signAccessToken } = await import('../utils/auth.js');

const USER_ID = '507f1f77bcf86cd799439011';

const buildApp = () => {
  const app = express();
  app.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ success: true, userId: req.userId });
  });
  app.use((error, req, res, _next) => {
    res.status(error.status || 500).json({ success: false, message: error.message });
  });
  return app;
};

const mockUser = (tokenVersion = 0) => {
  findById.mockReturnValue({
    select: vi.fn().mockResolvedValue({
      _id: USER_ID,
      isEmailVerified: true,
      tokenVersion,
    }),
  });
};

describe('authenticate middleware', () => {
  beforeEach(() => {
    findById.mockReset();
  });

  it('rejects missing credentials', async () => {
    const response = await request(buildApp()).get('/protected');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('rejects malformed tokens', async () => {
    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-token');
    expect(response.status).toBe(401);
    expect(findById).not.toHaveBeenCalled();
  });

  it('accepts a valid access token and attaches the user id', async () => {
    mockUser(2);
    const token = signAccessToken({ _id: USER_ID, tokenVersion: 2 });
    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(USER_ID);
    expect(findById).toHaveBeenCalledWith(USER_ID);
  });

  it('rejects a token after the session version changes', async () => {
    mockUser(3);
    const token = signAccessToken({ _id: USER_ID, tokenVersion: 2 });
    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  it('rejects an unverified account', async () => {
    findById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: USER_ID,
        isEmailVerified: false,
        tokenVersion: 0,
      }),
    });
    const token = signAccessToken({ _id: USER_ID, tokenVersion: 0 });
    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
