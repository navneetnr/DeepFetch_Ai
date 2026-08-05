import React, { useEffect, useRef, useState } from 'react';
import { Search, Sparkles, Zap, ArrowRight, FileText, Settings, Send } from 'lucide-react';

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
  const justSubmittedRef = useRef(false);

  useEffect(() => {
    // Only populate from initialQuery when not the moment right after a submit,
    // so the input stays cleared after submission.
    if (justSubmittedRef.current) {
      justSubmittedRef.current = false;
      return;
    }
    setQuery(initialQuery || '');
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;
    onSubmit({ query: query.trim(), files, searchMode });
    setQuery('');
    justSubmittedRef.current = true;
  };

  const handleSelectPreset = (preset) => {
    setQuery(preset);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-indigo-500/40 rounded-[28px] blur-lg opacity-50 transition duration-500"></div>
        <div className="relative flex items-center gap-2 glass-panel rounded-[28px] px-4 py-3 shadow-xl border border-slate-700/50 bg-slate-900/70">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-300 flex-shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask DeepFetch anything..."
            disabled={isStreaming}
            className="flex-1 min-w-0 rounded-xl bg-transparent text-base text-slate-100 placeholder-slate-500 outline-none py-2"
          />

          <button
            type="submit"
            disabled={!query.trim() || isStreaming}
            className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
              !query.trim() || isStreaming
                ? 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
            }`}
            aria-label="Submit research"
          >
            {isStreaming ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>DeepFetch</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Search mode + file toggle row */}
        <div className="mt-2 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Search Mode</span>
            <div className="inline-flex rounded-full bg-slate-900/60 border border-slate-800/70 p-0.5">
              {['live', 'document', 'hybrid'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSearchMode(mode)}
                  disabled={isStreaming}
                  className={`px-3 py-1 text-[11px] rounded-full transition-all ${
                    searchMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <label
              htmlFor="file-input"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 border border-slate-800/70 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800 cursor-pointer transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Attach files'}
            </label>
          </div>
        </div>

        {/* Selected files chips */}
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 px-1">
            {files.map((f, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300 border border-slate-800">
                <FileText className="w-3.5 h-3.5 text-indigo-300" />
                {f.name}
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="ml-1 text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggestion chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1.5 text-[11px] uppercase tracking-widest text-slate-400">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Suggestions
          </span>
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              disabled={isStreaming}
              className="rounded-full border border-slate-800/70 bg-slate-900/80 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-indigo-500/60 hover:text-indigo-200"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
