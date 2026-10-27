import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from './api.js';

afterEach(() => vi.unstubAllGlobals());

describe('API request errors', () => {
  it('turns an unavailable server into an actionable network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(request('/mysteries')).rejects.toMatchObject({ name: 'ApiError', code: 'NETWORK_ERROR' });
  });

  it('preserves the server error code needed for safe accusation retries', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: { code: 'ALREADY_SUBMITTED', message: 'The original result is unchanged.', requestId: 'req-1' } }),
    }));
    await expect(request('/mysteries/case/accusations')).rejects.toMatchObject({
      code: 'ALREADY_SUBMITTED', status: 409, requestId: 'req-1',
    });
    expect(ApiError).toBeTypeOf('function');
  });
});
