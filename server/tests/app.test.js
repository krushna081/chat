import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';

describe('Express app surface', () => {
  it('returns a safe health response', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      service: 'relaychat',
      status: 'ok',
    });
    expect(response.body).not.toHaveProperty('mongodbUri');
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, message: 'Not found' });
  });

  it('protects chat routes', async () => {
    const response = await request(app).get('/api/chat/rooms');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ success: false, message: 'Authentication required' });
  });
});
