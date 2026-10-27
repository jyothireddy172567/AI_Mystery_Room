const BASE = import.meta.env.VITE_API_URL || '/api/v1';

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
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch {
    throw new ApiError('The server could not be reached. Check that the API is running, then try again.', { code: 'NETWORK_ERROR' });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
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
