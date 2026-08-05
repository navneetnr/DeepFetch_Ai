import React, { useState } from 'react';
import { marked } from 'marked';
import { FileText, Copy, Check, Download, Share2, Sparkles, BookOpen, MoreVertical } from 'lucide-react';

export default function ReportViewer({ report, query }) {
  const [copied, setCopied] = useState(false);

  if (!report) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-4 text-slate-600 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-300">No Final Report Generated Yet</h3>
        <p className="text-sm mt-1">Submit a research query to start the multi-agent synthesis pipeline.</p>
      </div>
    );
  }

  const parsedHtml = marked.parse(report);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([report], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `DeepFetch_Report_${query ? query.slice(0, 20).replace(/\s+/g, '_') : 'Research'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="glass-panel rounded-2xl p-8 shadow-2xl space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Citation-Backed Research Report</h2>
            <p className="text-xs text-indigo-400 font-mono">Zero-Hallucination Multi-Agent Synthesis</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-900/70 border border-slate-800 p-1.5">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all duration-200"
            title="Copy markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all duration-200"
            title="Download markdown report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent transition-all duration-200"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-all duration-200"
            title="More options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rendered Markdown Body */}
      <div className="bg-slate-950/60 rounded-xl p-6 border border-slate-800/80">
        <div
          className="markdown-body text-slate-200 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      </div>

      {/* Footer Provenance Stamp */}
      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center">
          <BookOpen className="w-4 h-4 mr-1 text-indigo-400" /> Verified by DeepFetch AI Critic & Verifier Loop
        </span>
        <span>Output: Markdown (.md)</span>
      </div>
    </div>
  );
}
