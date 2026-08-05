import React from 'react';
import { X, LogOut, ShieldCheck } from 'lucide-react';

export default function LogoutConfirmationModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[32px] border border-slate-800/80 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-rose-400/80">Sign Out</p>
            <h2 className="text-2xl font-semibold text-white">Log out of workspace?</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800/70 hover:text-white transition-all duration-200"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/15 text-rose-400 flex-shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">You'll be locked out of the workspace</p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Your local access token will be cleared and you'll need to sign back in to resume research sessions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-800/40 bg-emerald-950/30 px-4 py-3">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Saved research reports are stored in the backend and will remain available after you sign back in.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 border border-slate-800 hover:bg-slate-800 transition duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition duration-200"
          >
            Confirm Logout
          </button>
        </div>
      </div>
    </div>
  );
}
