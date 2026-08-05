import React, { useState } from 'react';
import { marked } from 'marked';
import { Copy, Check, Download } from 'lucide-react';

export default function ReportViewer({ report, query }) {
  const [copied, setCopied] = useState(false);

  if (!report) {
    return null;
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
    <div className="w-full max-w-3xl mx-auto">
      {/* Minimal action bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{query}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
            title="Copy markdown"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
            title="Download markdown report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reading canvas */}
      <div
        className="markdown-body text-slate-800 dark:text-slate-200 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />
    </div>
  );
}
