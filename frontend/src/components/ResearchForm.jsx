import React, { useEffect, useState } from 'react';
import { Paperclip, ArrowUp, X } from 'lucide-react';

export default function ResearchForm({ onSubmit, isStreaming, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    setQuery(initialQuery || '');
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;
    onSubmit({ query: query.trim(), files, searchMode: 'live' });
    setQuery('');
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !isStreaming) {
        onSubmit({ query: query.trim(), files, searchMode: 'live' });
        setQuery('');
        setFiles([]);
      }
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a1f2b] px-3 py-2 shadow-lg shadow-slate-900/5 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-colors duration-200"
      >
        {/* Upload attachment */}
        <input
          id="gemini-file-input"
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
          htmlFor="gemini-file-input"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors duration-200"
          title="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </label>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask DeepFetch anything..."
          disabled={isStreaming}
          className="flex-1 bg-transparent text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none py-1.5"
          autoFocus
        />

        {files.length > 0 && (
          <div className="flex items-center gap-1">
            {files.map((f, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] text-slate-700 dark:text-slate-300">
                {f.name}
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Send button */}
        <button
          type="submit"
          disabled={!query.trim() || isStreaming}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            !query.trim() || isStreaming
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
          }`}
          title={isStreaming ? 'Researching...' : 'Send'}
          aria-label="Send"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
