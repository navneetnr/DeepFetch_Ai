import React, { useEffect, useRef } from 'react';
import { Cpu, CheckCircle2, Loader2, Terminal, Layers, Search, ShieldCheck, FileText } from 'lucide-react';

const NODES = [
  { id: 'planner', label: 'Planner', icon: Layers, desc: 'Decomposes query' },
  { id: 'researcher', label: 'Researcher', icon: Search, desc: 'Live scraper' },
  { id: 'critic', label: 'Critic', icon: ShieldCheck, desc: 'Verifies data' },
  { id: 'synthesizer', label: 'Synthesizer', icon: FileText, desc: 'Builds report' },
];

export default function AgentTraceViewer({ activeNode, logs, subQueries, criticVerdict, isStreaming }) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getNodeState = (nodeId) => {
    if (!isStreaming && logs.length > 0 && activeNode === 'synthesizer') {
      return 'completed';
    }
    if (activeNode === nodeId) {
      return 'active';
    }
    const nodeOrder = ['planner', 'researcher', 'critic', 'synthesizer'];
    const activeIndex = nodeOrder.indexOf(activeNode);
    const currentIndex = nodeOrder.indexOf(nodeId);

    if (activeIndex > currentIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Live Agent Execution Trace</h3>
            <p className="text-[10px] text-slate-500">LangGraph Real-time SSE Workflow</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          <span className="text-[10px] font-mono text-slate-400">
            {isStreaming ? 'Streaming' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Workflow Step Grid */}
      <div className="grid grid-cols-4 gap-2">
        {NODES.map((node) => {
          const state = getNodeState(node.id);
          const Icon = node.icon;
          return (
            <div
              key={node.id}
              className={`p-2 rounded-lg border transition-all duration-300 ${
                state === 'active'
                  ? 'bg-indigo-950/40 border-indigo-500/60'
                  : state === 'completed'
                  ? 'bg-slate-900/60 border-emerald-500/30'
                  : 'bg-slate-900/30 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`p-1.5 rounded-md ${state === 'active' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {state === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {state === 'active' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
              </div>
              <h4 className="text-[11px] font-semibold text-slate-200 truncate">{node.label}</h4>
            </div>
          );
        })}
      </div>

      {/* Sub-queries Section */}
      {subQueries.length > 0 && (
        <div className="rounded-lg p-3 border border-indigo-500/20 bg-slate-950/40">
          <h4 className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center">
            <Layers className="w-3 h-3 mr-1" /> Sub-Queries
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {subQueries.map((sq, i) => (
              <span key={i} className="text-[10px] bg-indigo-950/80 text-indigo-200 border border-indigo-700/50 px-2 py-1 rounded-md">
                {i + 1}. {sq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Log Terminal */}
      <div className="rounded-lg p-3 border border-slate-700/50 bg-slate-950/70">
        <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-1.5">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Execution Log</span>
          </div>
          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {logs.length} events
          </span>
        </div>

        <div className="h-40 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 pr-1 terminal-scrollbar">
          {logs.length === 0 ? (
            <p className="text-slate-500 italic">Waiting for search request invocation...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-1.5 leading-relaxed">
<span className="text-indigo-400 font-bold select-none">{'>'}</span>
                <span className={log.includes('APPROVED') ? 'text-emerald-400 font-semibold' : log.includes('REJECTED') ? 'text-amber-400' : ''}>
                  {log}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
