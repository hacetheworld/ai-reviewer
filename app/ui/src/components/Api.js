const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const githubUserId = window.localStorage.getItem('githubUserId') || '';
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(githubUserId ? { 'X-GitHub-User-Id': githubUserId } : {}),
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
