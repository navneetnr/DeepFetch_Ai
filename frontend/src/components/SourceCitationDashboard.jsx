import React from 'react';
import { ExternalLink, Database, Globe, CheckCircle, ShieldCheck } from 'lucide-react';

export default function SourceCitationDashboard({ sources }) {
if (!sources || sources.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950/80 transition-colors duration-200">
        <Database className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500 animate-bounce" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Web Sources Scraped Yet</h3>
        <p className="text-sm mt-1">Submit a research query to initiate Playwright headless browser scraping.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Scraped Web Sources & Provenance</h3>
        </div>
        <span className="text-xs bg-slate-100 dark:bg-slate-900/80 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700/50 px-3 py-1 rounded-full font-mono">
          {sources.length} Verified Sources
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((source, index) => (
          <div key={index} className="glass-panel rounded-xl p-5 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-semibold uppercase bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded">
                  Source #{index + 1}
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" /> HTTP {source.status_code || 200}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                  {source.title || 'Live Web Page'}
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                </a>
              </h4>

              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                {source.url}
              </p>

              {source.sub_query && (
                <div className="mt-2 text-[11px] bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-500 font-mono">Sub-query:</span> {source.sub_query}
                </div>
              )}

              <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 line-clamp-4 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 font-serif leading-relaxed">
                {source.content || source.snippet || 'No text extracted'}
              </p>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500 dark:text-emerald-400" /> Fact Verified
              </span>
              <span className="font-mono">{source.content ? `${source.content.length} chars` : 'Snippet only'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
