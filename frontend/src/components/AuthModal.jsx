import React, { useState } from 'react';
import { X, Lock, User, Key, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthenticate }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const token = `jwt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    onAuthenticate({
      name: mode === 'login' ? 'Deep Researcher' : name || 'Deep Researcher',
      email,
      token,
    });
    setEmail('');
    setName('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[32px] border border-slate-800/80 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-400/80">Secure workspace</p>
            <h2 className="text-2xl font-semibold text-white">{mode === 'login' ? 'Sign in to DeepFetch' : 'Create your account'}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800/70 hover:text-white transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`w-full rounded-3xl px-4 py-3 text-sm font-semibold transition duration-200 ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800/80'}`}
          >
            Login with email
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`w-full rounded-3xl px-4 py-3 text-sm font-semibold transition duration-200 ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800/80'}`}
          >
            Create new account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <label className="block text-sm text-slate-300">
              <span className="flex items-center gap-2 mb-2 font-medium text-slate-200">
                <User className="w-4 h-4 text-indigo-400" /> Full name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                required={mode === 'signup'}
              />
            </label>
          )}

          <label className="block text-sm text-slate-300">
            <span className="flex items-center gap-2 mb-2 font-medium text-slate-200">
              <Key className="w-4 h-4 text-indigo-400" /> Email address
            </span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@deepfetch.ai"
              className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-indigo-500"
              required
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="flex items-center gap-2 mb-2 font-medium text-slate-200">
              <Lock className="w-4 h-4 text-indigo-400" /> Password
            </span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-indigo-500"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:bg-indigo-500 hover:-translate-y-0.5"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>
            By continuing, you agree to the DeepFetch AI terms. This is a demo auth flow with a mock JWT token.
          </p>
        </div>
      </div>
    </div>
  );
}
