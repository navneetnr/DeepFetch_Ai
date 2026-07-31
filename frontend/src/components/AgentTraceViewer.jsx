import React, { useEffect, useRef } from 'react';
import { Cpu, CheckCircle2, Loader2, AlertCircle, Terminal, Layers, Search, ShieldCheck, FileText } from 'lucide-react';

const NODES = [
  { id: 'planner', label: 'Planner Node', icon: Layers, desc: 'Decomposes query into sub-queries' },
  { id: 'researcher', label: 'Researcher Node', icon: Search, desc: 'Playwright live browser scraper' },
  { id: 'critic', label: 'Critic Node', icon: ShieldCheck, desc: 'Verifies data accuracy & completeness' },
  { id: 'synthesizer', label: 'Synthesizer Node', icon: FileText, desc: 'Generates zero-hallucination report' },
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
    <div className="w-full glass-panel rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Live Agent Execution Trace</h3>
            <p className="text-xs text-slate-400">LangGraph State Machine Real-time SSE Workflow</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          <span className="text-xs font-mono text-slate-300">
            {isStreaming ? 'SSE Connected & Streaming' : 'Workflow Idle / Ready'}
          </span>
        </div>
      </div>

      {/* Workflow Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {NODES.map((node) => {
          const state = getNodeState(node.id);
          const Icon = node.icon;
          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                state === 'active'
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                  : state === 'completed'
                  ? 'bg-slate-900/60 border-emerald-500/30'
                  : 'bg-slate-900/30 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${state === 'active' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {state === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {state === 'active' && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
              </div>
              <h4 className="text-sm font-semibold text-slate-200">{node.label}</h4>
              <p className="text-xs text-slate-400 mt-1">{node.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Sub-queries Section */}
      {subQueries.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-indigo-500/20">
          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center">
            <Layers className="w-4 h-4 mr-1.5" /> Planner Decomposed Sub-Queries:
          </h4>
          <div className="flex flex-wrap gap-2">
            {subQueries.map((sq, i) => (
              <span key={i} className="text-xs bg-indigo-950/80 text-indigo-200 border border-indigo-700/50 px-3 py-1.5 rounded-lg">
                {i + 1}. {sq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Log Terminal */}
      <div className="glass-card rounded-xl p-4 border border-slate-700/50 bg-slate-950/70">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Agent Execution Log Stream</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            {logs.length} events
          </span>
        </div>

        <div className="h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 pr-2 terminal-scrollbar">
          {logs.length === 0 ? (
            <p className="text-slate-500 italic">Waiting for search request invocation...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-indigo-400 font-bold select-none">&gt;</span>
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
