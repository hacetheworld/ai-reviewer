import React, { useEffect, useState } from 'react';
import { apiRequest } from '../components/Api.js';

export default function Config() {
  const [repoId, setRepoId] = useState('');
  const [rules, setRules] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', ok: '' });
  const [repos, setRepos] = useState([]);

  async function loadRepos() {
    const data = await apiRequest('/repos/enabled');
    setRepos(data || []);
  }

  async function loadConfig(selectedRepoId) {
    setStatus({ loading: true, error: '', ok: '' });
    try {
      const data = await apiRequest(`/repos/${selectedRepoId}/config`);
      setRules(data?.rules || '');
      setStatus({ loading: false, error: '', ok: '' });
    } catch (e) {
      setStatus({ loading: false, error: e.message, ok: '' });
    }
  }

  useEffect(() => {
    loadRepos().catch(() => {});
  }, []);

  async function onSave() {
    if (!repoId) return;
    setStatus({ loading: true, error: '', ok: '' });
    try {
      await apiRequest(`/repos/${repoId}/config`, { method: 'POST', body: { rules } });
      setStatus({ loading: false, error: '', ok: 'Saved.' });
    } catch (e) {
      setStatus({ loading: false, error: e.message, ok: '' });
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold">Config</h1>
      <p className="mt-1 text-sm text-slate-600">Edit per-repo review rules (stored in DB).</p>

      <div className="mt-4 grid gap-3">
        <div>
          <div className="text-sm font-medium">Repo</div>
          <select
            className="mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
            value={repoId}
            onChange={async (e) => {
              const id = e.target.value;
              setRepoId(id);
              if (id) await loadConfig(id);
            }}
          >
            <option value="">Select enabled repo</option>
            {repos.map((r) => (
              <option key={r.repo_id} value={r.repo_id}>
                {r.owner}/{r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-medium">Rules</div>
          <textarea
            className="mt-1 h-64 w-full rounded border bg-white px-3 py-2 text-sm"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="e.g. Prefer early returns, require tests for new logic..."
          />
        </div>

        <button
          className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={onSave}
          disabled={status.loading || !repoId}
        >
          {status.loading ? 'Saving...' : 'Save'}
        </button>

        {status.error ? <div className="text-sm text-red-600">{status.error}</div> : null}
        {status.ok ? <div className="text-sm text-green-700">{status.ok}</div> : null}
      </div>
    </div>
  );
}
