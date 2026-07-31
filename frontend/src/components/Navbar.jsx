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
  Sparkles
} from 'lucide-react';

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
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 font-mono text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Workspace Ready</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-[#080c14]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 transition-all">
      <div className="flex items-center justify-between">
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
            <span className="text-slate-500">DeepFetch Workspace</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Autonomous Engine
            </span>
          </div>
        </div>

        {/* Center: Active Execution Status */}
        <div className="hidden md:flex items-center space-x-3">
          {getNodeBadge()}
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            <Activity className={`w-3.5 h-3.5 ${backendHealth === 'online' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-400">API:</span>
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
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium transition-all"
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
            className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Profile / Auth Quick Badge */}
          {user ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 p-1.5 pl-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 transition-all"
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
