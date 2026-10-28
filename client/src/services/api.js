export function getApiBase(envUrl = import.meta.env.VITE_API_URL) {
  const trimmed = (envUrl || '').trim();
  if (!trimmed) {
    return '/api/v1';
  }
  const clean = trimmed.replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}

export const API_BASE = getApiBase();

export function resolveAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (/^https?:\/\//i.test(API_BASE)) {
    const origin = new URL(API_BASE).origin;
    const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${origin}${normalized}`;
  }
  return pathOrUrl;
}

export class ApiError extends Error {
  constructor(message, { code = 'API_ERROR', status = 0, requestId } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export async function request(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_BASE}${normalizedPath}`;
  let response;
  try {
    response = await fetch(fullUrl, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[API Network Error] ${options.method || 'GET'} ${fullUrl}:`, err);
    }
    throw new ApiError('The server could not be reached. Check that the API is running, then try again.', { code: 'NETWORK_ERROR' });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (import.meta.env.DEV) {
      console.error(`[API Error ${response.status}] ${options.method || 'GET'} ${fullUrl}:`, data);
    }
    throw new ApiError(data?.error?.message || `The request failed (${response.status}). Please try again.`, {
      code: data?.error?.code || 'API_ERROR', status: response.status, requestId: data?.error?.requestId,
    });
  }
  return data;
}

export const createMystery = (payload) => request('/mysteries', { method: 'POST', body: JSON.stringify(payload) });
export const getMystery = (id) => request(`/mysteries/${id}`);
export const submitAccusation = (id, suspectId) => request(`/mysteries/${id}/accusations`, { method: 'POST', body: JSON.stringify({ suspectId }) });
export const getResult = (id) => request(`/mysteries/${id}/result`);
