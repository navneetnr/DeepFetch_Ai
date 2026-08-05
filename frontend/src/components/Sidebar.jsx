import React from 'react';
import { Plus, PanelLeftClose, PanelLeftOpen, History, Trash2, LogOut, Settings, LogIn } from 'lucide-react';

export default function Sidebar({
  isOpen,
  onToggle,
  onNewResearch,
  history = [],
  activeHistoryId,
  onSelectHistory,
  onDeleteHistory,
  user,
  onOpenAuth,
  onOpenSettings,
  onLogout
}) {
  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-[#0f1420] border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 transition-all duration-300 flex flex-col justify-between ${
        isOpen ? 'w-72' : 'w-20'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <img
              src="/logo.png"
              alt="DeepFetch AI Logo"
              className="w-9 h-9 object-contain rounded-md flex-shrink-0"
            />
            {isOpen && (
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                DeepFetch <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
            )}
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-200"
            title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewResearch}
          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] ${
            isOpen ? 'justify-start' : 'justify-center px-0'
          }`}
          title="Start New Chat"
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 terminal-scrollbar">
        {isOpen ? (
          <div>
            {history.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-500 text-xs">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No history yet.</p>
                <p className="text-[11px] mt-1 text-slate-400 dark:text-slate-600">Start a new chat to begin.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((item) => {
                  const isActive = item.id === activeHistoryId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectHistory(item)}
                      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-200 border border-indigo-500/40'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                      }`}
                    >
                      <span className="truncate pr-6">{item.query}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistory(item.id, e);
                        }}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 rounded transition-opacity"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={onNewResearch}
              className={`p-3 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 ${
                activeHistoryId ? '' : 'bg-indigo-600/15 text-indigo-500 dark:text-indigo-400'
              }`}
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              {isOpen && (
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name || 'Pro User'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email || 'user@deepfetch.ai'}</p>
                </div>
              )}
            </div>
            {isOpen && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onOpenSettings}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Account Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className={`w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors duration-200 ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogIn className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            {isOpen && <span>Sign In / Register</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
