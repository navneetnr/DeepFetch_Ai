import React, { useEffect, useState } from 'react';
import { Search, Sparkles, Zap, Globe, ArrowRight, FileText } from 'lucide-react';

const PRESET_QUERIES = [
  'Latest developments in Quantum Computing commercialization 2026',
  'NVIDIA vs AMD AI GPU roadmap and market share analysis',
  'CRISPR gene editing therapy FDA approvals and clinical trials',
  'Global Renewable Energy grid storage breakthroughs 2026',
];

export default function ResearchForm({ onSubmit, isStreaming, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [files, setFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [searchMode, setSearchMode] = useState('live'); // 'live' | 'document' | 'hybrid'

  useEffect(() => {
    setQuery(initialQuery || '');
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;
    onSubmit({ query: query.trim(), files, searchMode });
  };

  const handleSelectPreset = (preset) => {
    setQuery(preset);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-slate-700/30 rounded-3xl blur opacity-60 transition duration-500"></div>
        <div className="relative glass-panel rounded-[28px] p-4 md:p-5 shadow-xl border border-slate-800/50">
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
              <div
                className={`w-full rounded-[16px] border-2 ${isDragActive ? 'border-indigo-500 bg-slate-900/60' : 'border-slate-800/60 bg-slate-950/80'} px-4 py-3 transition`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  const dropped = Array.from(e.dataTransfer.files || []);
                  if (dropped.length) setFiles((prev) => [...prev, ...dropped].slice(0, 6));
                }}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask any complex research query for live multi-agent synthesis..."
                  disabled={isStreaming}
                  className="w-full rounded-md bg-transparent text-lg text-slate-100 placeholder-slate-500 outline-none"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-400">Files:</label>
                    <div className="flex gap-2 flex-wrap">
                      {files.map((f, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-indigo-300" />
                          {f.name}
                          <button
                            type="button"
                            onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="ml-2 text-slate-500 hover:text-slate-300"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      onChange={(e) => {
                        const picked = Array.from(e.target.files || []);
                        if (picked.length) setFiles((prev) => [...prev, ...picked].slice(0, 6));
                        e.target.value = null;
                      }}
                      className="hidden"
                    />
                    <label htmlFor="file-input" className="rounded-md bg-slate-800/60 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 cursor-pointer">
                      Upload
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isStreaming}
              className={`inline-flex items-center justify-center gap-2 rounded-[24px] px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                !query.trim() || isStreaming
                  ? 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20'
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

      <div className="mt-3 flex items-center gap-3 text-sm">
        <div className="inline-flex items-center gap-2">
          <label className="text-xs text-slate-400">Search Mode</label>
          <div className="inline-flex rounded-xl bg-slate-900/50 p-1">
            {['live', 'document', 'hybrid'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSearchMode(mode)}
                disabled={isStreaming}
                className={`px-3 py-1 text-xs rounded-lg ${searchMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

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
