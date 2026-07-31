import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Clock,
  Trash2,
  FileText,
  Download,
  User,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'exports'

  // Helper to categorize history items into timeframe buckets
  const groupHistory = (items) => {
    const now = new Date();
    const today = [];
    const yesterday = [];
    const previous7Days = [];
    const older = [];

    items.forEach((item) => {
      const date = new Date(item.timestamp || Date.now());
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0 && now.getDate() === date.getDate()) {
        today.push(item);
      } else if (diffDays <= 1) {
        yesterday.push(item);
      } else if (diffDays <= 7) {
        previous7Days.push(item);
      } else {
        older.push(item);
      }
    });

    return { today, yesterday, previous7Days, older };
  };

  const grouped = groupHistory(history);

  // List of history items that have generated reports for the Exports tab
  const reportsList = history.filter((item) => item.report && item.report.trim().length > 0);

  const handleDownloadReport = (e, item, format = 'md') => {
    e.stopPropagation();
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DeepFetch_Session_${item.id || Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([item.report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DeepFetch_Report_${(item.query || 'Research').slice(0, 20).replace(/\s+/g, '_')}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderHistoryGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-1.5 mb-4">
        <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{title}</span>
        </div>
        {items.map((item) => {
          const isActive = item.id === activeHistoryId;
          return (
            <div
              key={item.id}
              onClick={() => onSelectHistory(item)}
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate pr-6">
                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                <span className="truncate">{item.query}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteHistory(item.id, e);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 rounded transition-opacity"
                title="Delete session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-950/90 border-r border-slate-800/50 transition-all duration-300 flex flex-col justify-between ${
        isOpen ? 'w-72' : 'w-20'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-indigo-600/15 rounded-xl shadow-[0_10px_30px_rgba(79,70,229,0.16)] flex-shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            {isOpen && (
              <div className="truncate">
                <h1 className="text-base font-bold text-white tracking-tight leading-none flex items-center gap-1.5">
                  DeepFetch <span className="text-indigo-400 font-extrabold">AI</span>
                </h1>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">SaaS Workspace</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-800/60 transition-all"
            title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary "+ New Research" Action Button */}
        <button
          onClick={onNewResearch}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] ${
            isOpen ? 'justify-start' : 'justify-center px-0'
          }`}
          title="Start New Research"
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>New Research</span>}
        </button>
      </div>

      {/* Navigation Sub-Tabs & History List (Only visible when expanded or scrollable icons) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 terminal-scrollbar">
        {isOpen ? (
          <>
            {/* Tabs for History vs Exported Workspace */}
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-4 text-xs font-medium">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>

              <button
                onClick={() => setActiveTab('exports')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'exports'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Saved Reports</span>
              </button>
            </div>

            {/* Tab 1: Research History List */}
            {activeTab === 'history' && (
              <div>
                {history.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No research history yet.</p>
                    <p className="text-[11px] mt-1 text-slate-600">Submit a query to generate sessions.</p>
                  </div>
                ) : (
                  <>
                    {renderHistoryGroup('Today', grouped.today)}
                    {renderHistoryGroup('Yesterday', grouped.yesterday)}
                    {renderHistoryGroup('Previous 7 Days', grouped.previous7Days)}
                    {renderHistoryGroup('Older', grouped.older)}
                  </>
                )}
              </div>
            )}

            {/* Tab 2: Exported Workspace */}
            {activeTab === 'exports' && (
              <div className="space-y-2">
                {reportsList.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No saved reports found.</p>
                    <p className="text-[11px] mt-1 text-slate-600">Completed reports will appear here for instant download.</p>
                  </div>
                ) : (
                  reportsList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-900/60 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 space-y-2 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{item.query}</h4>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">
                          MD
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                        <button
                          onClick={(e) => handleDownloadReport(e, item, 'md')}
                          className="flex-1 py-1 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-medium flex items-center justify-center space-x-1 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          <span>Markdown</span>
                        </button>
                        <button
                          onClick={(e) => handleDownloadReport(e, item, 'json')}
                          className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center space-x-1 transition-all"
                        >
                          <FileText className="w-3 h-3" />
                          <span>JSON</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          /* Collapsed Icon Bar */
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={() => setActiveTab('history')}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'history' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="History"
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('exports')}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'exports' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Saved Reports"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* User Profile & Account Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              {isOpen && (
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user.name || 'Pro User'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email || 'user@deepfetch.ai'}</p>
                </div>
              )}
            </div>

            {isOpen && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onOpenSettings}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Account Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
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
            className={`w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogIn className="w-4 h-4 text-indigo-400" />
            {isOpen && <span>Sign In / Register</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
