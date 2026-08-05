import React from 'react';
import {
  PanelLeft,
  Server,
  Github,
  Activity,
  Cpu,
  RefreshCw,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar({
  sidebarOpen,
  onToggleSidebar,
  activeNode,
  isStreaming,
  backendHealth,
  onOpenMcpDrawer,
  user,
  onOpenAuth,
  onOpenSettings
}) {
  const { theme, toggleTheme } = useTheme();
  const getNodeBadge = () => {
    if (isStreaming) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 font-mono text-xs animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span className="font-semibold uppercase tracking-wider">Node: {activeNode}</span>
        </div>
      );
    }
return (
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs transition-colors duration-200">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Workspace Ready</span>
      </div>
    );
  };

return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0f1420]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Collapse Toggle & Breadcrumb */}
        <div className="flex items-center space-x-4">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all"
              title="Open Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

<div className="flex items-center space-x-2 text-xs font-mono">
            <img
              src="/logo.png"
              alt="DeepFetch AI Logo"
              className="w-6 h-6 object-contain rounded-md"
            />
            <span className="text-slate-500">DeepFetch Workspace</span>
            <span className="text-slate-600 dark:text-slate-600">/</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Autonomous Engine
            </span>
          </div>
        </div>

        {/* Center: Active Execution Status */}
<div className="hidden md:flex items-center space-x-3">
          {getNodeBadge()}
          <div className="flex items-center space-x-2 text-xs font-mono bg-gray-100 dark:bg-slate-900/80 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-800 transition-colors duration-200">
            <Activity className={`w-3.5 h-3.5 ${backendHealth === 'online' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-500 dark:text-slate-400">API:</span>
            <span className={backendHealth === 'online' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {backendHealth.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right Side: MCP Drawer, GitHub Link & Profile Quick Action */}
        <div className="flex items-center space-x-3">
          {/* MCP Server Connectivity Button */}
          <button
            onClick={onOpenMcpDrawer}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 dark:bg-slate-900/90 dark:hover:bg-indigo-950/60 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border border-gray-200 hover:border-indigo-500/40 dark:border-slate-800 dark:hover:border-indigo-500/40 text-xs font-medium transition-colors duration-200"
            title="MCP Server Connectivity Status"
          >
            <Server className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">MCP Servers</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

{/* GitHub Repository Link */}
          <a
            href="https://github.com/navneetnr/DeepFetch_Ai.git"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-800 transition-colors duration-200"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Theme Toggle (Day / Night) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-800 transition-colors duration-200"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Profile / Auth Quick Badge */}
{user ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 p-1.5 pl-2.5 rounded-xl bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-indigo-500/40 text-xs text-slate-700 dark:text-slate-200 transition-colors duration-200"
            >
              <span className="font-medium hidden sm:inline">{user.name.split(' ')[0]}</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
