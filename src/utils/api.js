const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('veridairy_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMessage = errorData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  // If response is a file download or raw text
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),

  // Batches
  getBatches: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/batches${qs ? `?${qs}` : ''}`);
  },
  getBatch: (id) => request(`/batches/${id}`),
  createBatch: (data) => request('/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (id, data) => request(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBatch: (id) => request(`/batches/${id}`, { method: 'DELETE' }),

  // Tokens
  generateTokens: (batchId, count) => request(`/batches/${batchId}/tokens`, { method: 'POST', body: JSON.stringify({ count }) }),
  getTokens: (batchId) => request(`/batches/${batchId}/tokens`),
  getQrBundle: (batchId) => request(`/batches/${batchId}/qr-bundle`),

  // Verification & Registry
  verifyToken: (tokenCode) => request(`/verify/${tokenCode}`),
  getStats: () => request('/stats'),
  getCows: () => request('/cows'),
  getArtisans: () => request('/artisans'),
  getAuditLogs: () => request('/audit-logs'),

  // Direct CSV Download URL
  getBatchCsvUrl: (batchId) => `${API_BASE}/batches/${batchId}/download-csv`,
};
