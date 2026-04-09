const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json) {
    throw new Error(json?.error || 'Request failed');
  }
  if (json.success === false) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}
