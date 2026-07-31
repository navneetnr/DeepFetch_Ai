import React, { useEffect, useState } from 'react';
import { Search, Sparkles, Zap, Globe, ArrowRight } from 'lucide-react';

const PRESET_QUERIES = [
  'Latest developments in Quantum Computing commercialization 2026',
  'NVIDIA vs AMD AI GPU roadmap and market share analysis',
  'CRISPR gene editing therapy FDA approvals and clinical trials',
  'Global Renewable Energy grid storage breakthroughs 2026',
];

export default function ResearchForm({ onSubmit, isStreaming, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery || '');
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;
    onSubmit(query.trim());
  };

  const handleSelectPreset = (preset) => {
    setQuery(preset);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20 transition duration-500"></div>
        <div className="relative glass-panel rounded-[28px] p-4 md:p-5 shadow-2xl border border-slate-800/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3 md:w-1/3">
              <div className="p-3 rounded-3xl bg-indigo-500/10 text-indigo-300">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Deep research query</p>
                <p className="text-xs text-slate-400">Enter your objective to begin the live synthesis workflow.</p>
              </div>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any complex research query for live multi-agent synthesis..."
                disabled={isStreaming}
                className="w-full rounded-[24px] border border-slate-800/80 bg-slate-950/70 px-4 py-4 text-lg text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isStreaming}
              className={`inline-flex items-center justify-center gap-2 rounded-[24px] px-6 py-4 text-sm font-semibold transition-all shadow-lg ${
                !query.trim() || isStreaming
                  ? 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:scale-[1.01]'
              }`}
            >
              {isStreaming ? (
                <>
                  <Zap className="w-5 h-5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>DeepFetch</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-2 text-xs uppercase tracking-widest text-slate-400">
          <Globe className="w-3.5 h-3.5 text-indigo-400" /> Suggestions
        </span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(preset)}
            disabled={isStreaming}
            className="rounded-full border border-slate-800/70 bg-slate-900/80 px-4 py-2 text-xs text-slate-300 transition hover:border-indigo-500/60 hover:text-indigo-200"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
