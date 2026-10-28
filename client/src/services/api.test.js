import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getApiBase, request, resolveAssetUrl } from './api.js';

afterEach(() => vi.unstubAllGlobals());

describe('API base URL normalization and asset resolution', () => {
  it('normalizes various formats of VITE_API_URL', () => {
    expect(getApiBase('')).toBe('/api/v1');
    expect(getApiBase(undefined)).toBe('/api/v1');
    expect(getApiBase('https://ai-mystery-room-nxc3.onrender.com')).toBe('https://ai-mystery-room-nxc3.onrender.com/api/v1');
    expect(getApiBase('https://ai-mystery-room-nxc3.onrender.com/')).toBe('https://ai-mystery-room-nxc3.onrender.com/api/v1');
    expect(getApiBase('https://ai-mystery-room-nxc3.onrender.com/api/v1')).toBe('https://ai-mystery-room-nxc3.onrender.com/api/v1');
    expect(getApiBase('https://ai-mystery-room-nxc3.onrender.com/api/v1/')).toBe('https://ai-mystery-room-nxc3.onrender.com/api/v1');
  });

  it('handles relative and absolute asset URLs safely', () => {
    expect(resolveAssetUrl('')).toBe('');
    expect(resolveAssetUrl('https://example.com/photo.png')).toBe('https://example.com/photo.png');
    // In test environment without full URL in VITE_API_URL, relative paths stay relative
    expect(resolveAssetUrl('/api/v1/mysteries/123/evidence/e1/image')).toBe('/api/v1/mysteries/123/evidence/e1/image');
  });
});

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
