import React from 'react';
import { X, Settings, ShieldCheck, LogOut } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, user, onLogout }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[32px] border border-slate-800/80 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-400/80">Account Settings</p>
            <h2 className="text-2xl font-semibold text-white">Workspace profile</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800/70 hover:text-white transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/80 p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-indigo-600 text-white text-xl font-semibold">
              {user?.name?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.name || 'Deep Researcher'}</p>
              <p className="text-xs text-slate-400">{user?.email || 'user@deepfetch.ai'}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-100">Security</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">Your credentials are stored locally in browser storage as a mock workspace token.</p>
            </div>
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-slate-100">Preferences</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">Customize the workspace experience when integrated with the full product stack.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-400"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
