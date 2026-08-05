import React from 'react';
import { PanelLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar({
  sidebarOpen,
  onToggleSidebar,
  user,
  onOpenAuth,
  onOpenSettings
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0f1420]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Logo & Title */}
        <div className="flex items-center space-x-3">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-all"
              title="Open Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-2.5">
            <img
              src="/logo.png"
              alt="DeepFetch AI Logo"
              className="w-8 h-8 object-contain rounded-md"
            />
            <span className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              DeepFetch <span className="text-indigo-600 dark:text-indigo-400 font-bold">AI</span>
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle & Profile */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors duration-200"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {user ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 p-1.5 pl-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 text-xs text-slate-700 dark:text-slate-200 transition-colors duration-200"
              title="Account Settings"
            >
              <span className="font-medium hidden sm:inline">{user.name.split(' ')[0]}</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
