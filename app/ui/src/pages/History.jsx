import React, { useEffect, useState } from 'react';
import { apiRequest } from '../components/Api.js';

export default function History() {
  const [repos, setRepos] = useState([]);
  const [repoId, setRepoId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadRepos() {
    const data = await apiRequest('/repos/enabled');
    setRepos(data || []);
  }

  async function load(selectedRepoId) {
    setLoading(true);
    setError('');
    try {
      if (!selectedRepoId) {
        setItems([]);
        return;
      }

      const data = await apiRequest(`/history?repoId=${encodeURIComponent(selectedRepoId)}`);
      setItems(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRepos()
      .then(() => setLoading(false))
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">History</h1>
      <p className="mt-1 text-sm text-slate-600">Past reviews saved in DB (per repo).</p>

      <div className="mt-4 max-w-xl">
        <div className="text-sm font-medium">Repo</div>
        <select
          className="mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
          value={repoId}
          onChange={async (e) => {
            const id = e.target.value;
            setRepoId(id);
            await load(id);
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

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="text-sm">Loading...</div>
        ) : !repoId ? (
          <div className="text-sm">Select a repo to view history.</div>
        ) : items.length === 0 ? (
          <div className="text-sm">No history for this repo.</div>
        ) : (
          items.map((h) => (
            <div key={h.id} className="rounded border bg-white p-4">
              <div className="text-sm font-medium">
                {h.pr_title ? h.pr_title : 'Pull Request'} · PR #{h.pr_number}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{h.summary}</div>
              <div className="mt-2 text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</div>

              {Array.isArray(h.comments) && h.comments.length ? (
                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-700">Comments posted</div>
                  <div className="mt-2 space-y-2">
                    {h.comments.map((c, idx) => (
                      <div key={idx} className="rounded border bg-slate-50 p-2 text-xs">
                        <div className="font-mono text-slate-700">
                          {c.path} @ {c.position}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-slate-800">{c.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
