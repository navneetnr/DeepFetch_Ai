import React, { useState, useEffect } from 'react';
import { Cpu, Globe, FileText, Sparkles, Activity, Github, RefreshCw } from 'lucide-react';
import ResearchForm from './components/ResearchForm';
import AgentTraceViewer from './components/AgentTraceViewer';
import SourceCitationDashboard from './components/SourceCitationDashboard';
import ReportViewer from './components/ReportViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState('trace');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [subQueries, setSubQueries] = useState([]);
  const [scrapedSources, setScrapedSources] = useState([]);
  const [activeNode, setActiveNode] = useState('planner');
  const [criticVerdict, setCriticVerdict] = useState('');
  const [report, setReport] = useState('');
  const [backendHealth, setBackendHealth] = useState('checking');

  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'healthy') setBackendHealth('online');
        else setBackendHealth('degraded');
      })
      .catch(() => setBackendHealth('offline'));
  }, []);

  const handleStartResearch = async (query) => {
    setCurrentQuery(query);
    setIsStreaming(true);
    setLogs([`[System] Initiated research session for query: '${query}'`]);
    setSubQueries([]);
    setScrapedSources([]);
    setActiveNode('planner');
    setCriticVerdict('');
    setReport('');
    setActiveTab('trace');

    try {
      const response = await fetch('/api/v1/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.event === 'node_update') {
                if (data.node) setActiveNode(data.node);
                if (data.logs) setLogs((prev) => [...new Set([...prev, ...data.logs])]);
                if (data.sub_queries && data.sub_queries.length > 0) {
                  setSubQueries(data.sub_queries);
                }
                if (data.critic_verdict) setCriticVerdict(data.critic_verdict);
              } else if (data.event === 'complete') {
                if (data.report) setReport(data.report);
                if (data.scraped_data) setScrapedSources(data.scraped_data);
                if (data.execution_logs) setLogs(data.execution_logs);
                setActiveTab('report');
              }
            } catch (err) {
              console.error("Error parsing SSE data chunk:", err);
            }
          }
        }
      }
    } catch (error) {
      console.warn("SSE Stream interrupted, attempting fallback execute endpoint:", error);
      setLogs((prev) => [...prev, `[System Warning] SSE stream interrupted: ${error.message}. Invoking direct fallback execution...`]);
      
      try {
        const fallbackRes = await fetch('/api/v1/research/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const fallbackData = await fallbackRes.json();
        setReport(fallbackData.report || '');
        setScrapedSources(fallbackData.scraped_data || []);
        setLogs(fallbackData.execution_logs || []);
        setCriticVerdict(fallbackData.critic_verdict || 'APPROVED');
        setActiveTab('report');
      } catch (fbErr) {
        setLogs((prev) => [...prev, `[System Error] Execution failed: ${fbErr.message}`]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg animate-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                DeepFetch AI
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  v1.0 Autonomous
                </span>
              </h1>
              <p className="text-xs text-slate-400">Live Multi-Agent Research & Data Synthesis Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <Activity className={`w-3.5 h-3.5 ${backendHealth === 'online' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-slate-300">Backend:</span>
              <span className={backendHealth === 'online' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {backendHealth.toUpperCase()}
              </span>
            </div>

            <a
              href="https://github.com/navneetnr/DeepFetch_Ai.git"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all"
              title="View GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-grow space-y-8">
        {/* Search Query Input */}
        <ResearchForm onSubmit={handleStartResearch} isStreaming={isStreaming} />

        {/* Navigation Tabs */}
        {(logs.length > 0 || isStreaming) && (
          <div className="space-y-6">
            <div className="flex justify-center border-b border-slate-800/80 pb-px">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('trace')}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2 ${
                    activeTab === 'trace'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>Agent Trace</span>
                  {isStreaming && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400 ml-1" />}
                </button>

                <button
                  onClick={() => setActiveTab('sources')}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2 ${
                    activeTab === 'sources'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Scraped Sources ({scrapedSources.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2 ${
                    activeTab === 'report'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Final Report</span>
                  {report && <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />}
                </button>
              </nav>
            </div>

            {/* Tab Views */}
            <div>
              {activeTab === 'trace' && (
                <AgentTraceViewer
                  activeNode={activeNode}
                  logs={logs}
                  subQueries={subQueries}
                  criticVerdict={criticVerdict}
                  isStreaming={isStreaming}
                />
              )}

              {activeTab === 'sources' && (
                <SourceCitationDashboard sources={scrapedSources} />
              )}

              {activeTab === 'report' && (
                <ReportViewer report={report} query={currentQuery} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        <p>DeepFetch AI — Powered by LangGraph, Playwright Async, Model Context Protocol & FastAPI</p>
      </footer>
    </div>
  );
}
