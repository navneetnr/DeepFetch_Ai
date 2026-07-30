import React, { useState } from 'react';
import { Search, Sparkles, Zap, Globe, ArrowRight } from 'lucide-react';

const PRESET_QUERIES = [
  "Latest developments in Quantum Computing commercialization 2026",
  "NVIDIA vs AMD AI GPU roadmap and market share analysis",
  "CRISPR gene editing therapy FDA approvals and clinical trials",
  "Global Renewable Energy grid storage breakthroughs 2026",
];

export default function ResearchForm({ onSubmit, isStreaming }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;
    onSubmit(query.trim());
  };

  const handleSelectPreset = (preset) => {
    setQuery(preset);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative glass-panel rounded-2xl p-3 flex items-center space-x-3 shadow-2xl">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Search className="w-6 h-6 animate-pulse-slow" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask any complex research query for live multi-agent synthesis..."
            disabled={isStreaming}
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-lg focus:outline-none focus:ring-0 border-none px-2"
          />
          <button
            type="submit"
            disabled={!query.trim() || isStreaming}
            className={`flex items-center space-x-2 px-6 py-3.5 rounded-xl font-medium text-white transition-all shadow-lg ${
              !query.trim() || isStreaming
                ? 'bg-slate-700/50 cursor-not-allowed text-slate-400'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] active:scale-[0.98]'
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
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Suggestion Pills */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center mr-1">
          <Globe className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Live Scrapes:
        </span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(preset)}
            disabled={isStreaming}
            className="text-xs bg-slate-800/60 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 border border-slate-700/50 hover:border-indigo-500/50 px-3 py-1.5 rounded-full transition-all"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
