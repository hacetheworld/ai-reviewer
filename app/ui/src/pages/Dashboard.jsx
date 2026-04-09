import React, { useEffect, useState } from 'react';
import { apiRequest } from '../components/Api.js';

export default function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const gh = await apiRequest('/repos');
      setRepos(gh);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function enable(repo) {
    setError('');
    try {
      await apiRequest(`/repos/${repo.repoId}/enable`, {
        method: 'POST',
        body: { owner: repo.owner, name: repo.name },
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function disable(repo) {
    setError('');
    try {
      await apiRequest(`/repos/${repo.repoId}/disable`, {
        method: 'POST',
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Repos from your GitHub account.</p>

      <div className="mt-4">
        <button className="rounded border bg-white px-3 py-2 text-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      <div className="mt-4 overflow-hidden rounded border bg-white">
        {loading ? (
          <div className="p-4 text-sm">Loading...</div>
        ) : repos.length === 0 ? (
          <div className="p-4 text-sm">No repos found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-2">Repo</th>
                <th className="px-4 py-2">Visibility</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((r) => (
                <tr key={r.repoId} className="border-b last:border-b-0">
                  <td className="px-4 py-2">{r.fullName}</td>
                  <td className="px-4 py-2">{r.private ? 'Private' : 'Public'}</td>
                  <td className="px-4 py-2">
                    {r.isEnabled ? (
                      <button
                        className="rounded border bg-white px-3 py-1.5 text-xs font-medium"
                        onClick={() => disable(r)}
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                        onClick={() => enable(r)}
                      >
                        Enable
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
