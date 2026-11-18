import { describe, expect, it } from 'vitest';
import { getApiBaseUrl } from './api.js';

describe('API URL resolution', () => {
  it('defaults to the same-origin /api path', () => {
    expect(getApiBaseUrl('')).toBe('/api');
    expect(getApiBaseUrl(undefined)).toBe('/api');
  });

  it('normalizes configured paths and absolute URLs', () => {
    expect(getApiBaseUrl('/api/')).toBe('/api');
    expect(getApiBaseUrl('https://relaychat.example.com/api/')).toBe(
      'https://relaychat.example.com/api'
    );
  });
});
