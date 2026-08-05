import React, { useState } from 'react';
import { X, Lock, User, Key, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

const TOKEN_STORAGE_KEY = 'deepfetch_access_token';

export default function AuthModal({ isOpen, onClose, onAuthenticated, fullscreen = false }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      let accessToken = null;

      if (mode === 'login') {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.detail || 'Login failed. Please check your credentials.');
          return;
        }
        accessToken = data.access_token;
      } else {
        // Register first, then auto-login to obtain the JWT
        const regRes = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const regData = await regRes.json().catch(() => ({}));
        if (!regRes.ok) {
          setError(regData.detail || 'Registration failed. Please try again.');
          return;
        }

        const loginRes = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json().catch(() => ({}));
        if (!loginRes.ok) {
          setError(loginData.detail || 'Account created, but auto-login failed. Please sign in.');
          return;
        }
        accessToken = loginData.access_token;
      }

      if (!accessToken) {
        setError('No access token returned by the server.');
        return;
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      const displayName = email.split('@')[0].replace(/[._-]+/g, ' ');
      onAuthenticated({
        user: { name: displayName || 'Deep Researcher', email },
        token: accessToken,
      });
      setEmail('');
      setPassword('');
    } catch (e) {
      setError('Network error. Please ensure the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const content = (
    <div className="w-full max-w-md rounded-[32px] border border-gray-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-600 dark:text-indigo-400/80">Secure workspace</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {mode === 'login' ? 'Sign in to DeepFetch' : 'Create your account'}
          </h2>
        </div>
        {!fullscreen && (
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`w-full rounded-3xl px-4 py-3 text-sm font-semibold transition duration-200 ${
            mode === 'login'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/80'
          }`}
        >
          Login with email
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`w-full rounded-3xl px-4 py-3 text-sm font-semibold transition duration-200 ${
            mode === 'signup'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/80'
          }`}
        >
          Create new account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2 mb-2 font-medium text-slate-800 dark:text-slate-200">
            <Key className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Email address
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="you@deepfetch.ai"
            className="w-full rounded-3xl border border-gray-300 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            required
          />
        </label>

        <label className="block text-sm text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2 mb-2 font-medium text-slate-800 dark:text-slate-200">
            <Lock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Password
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="••••••••"
            minLength={8}
            className="w-full rounded-3xl border border-gray-300 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            required
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-500 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:bg-indigo-500 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
        <p>
          <ShieldCheck className="inline w-3.5 h-3.5 mr-1 text-indigo-500 dark:text-indigo-400" />
          By continuing, you authenticate with the DeepFetch backend. Your JWT session is stored locally.
        </p>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-500/50 dark:bg-slate-950/95 backdrop-blur-sm p-4">
        {content}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-500/50 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      {content}
    </div>
  );
}
