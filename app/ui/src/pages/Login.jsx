import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../components/Api.js';

export default function Login() {
  const navigate = useNavigate();
  const [pat, setPat] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', ok: '' });

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: '', ok: '' });
    try {
      await apiRequest('/auth/pat', { method: 'POST', body: { pat } });
      setStatus({ loading: false, error: '', ok: 'Saved.' });
      setPat('');
      navigate('/dashboard');
    } catch (err) {
      setStatus({ loading: false, error: err.message, ok: '' });
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Login</h1>
      <p className="mt-1 text-sm text-slate-600">Paste your GitHub Personal Access Token.</p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded border bg-white px-3 py-2 text-sm"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          placeholder="GitHub PAT"
          type="password"
          autoComplete="off"
        />

        <button
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={status.loading || !pat.trim()}
        >
          {status.loading ? 'Saving...' : 'Submit'}
        </button>

        {status.error ? <div className="text-sm text-red-600">{status.error}</div> : null}
        {status.ok ? <div className="text-sm text-green-700">{status.ok}</div> : null}
      </form>
    </div>
  );
}
