
import React, { useEffect, useMemo, useState } from 'react';
import { Cpu, Globe, FileText, Sparkles, Activity, Github, ArrowRight, Server, ChevronRight } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ResearchForm from './components/ResearchForm';
import AgentTraceViewer from './components/AgentTraceViewer';
import SourceCitationDashboard from './components/SourceCitationDashboard';
import ReportViewer from './components/ReportViewer';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';

const TOKEN_STORAGE_KEY = 'deepfetch_access_token';
const USER_STORAGE_KEY = 'deepfetch_workspace_user';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mcpDrawerOpen, setMcpDrawerOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState('report');
  const [activeTab, setActiveTab] = useState('report');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [subQueries, setSubQueries] = useState([]);
  const [scrapedSources, setScrapedSources] = useState([]);
const [activeNode, setActiveNode] = useState('planner');
  const [criticVerdict, setCriticVerdict] = useState('');
  const [report, setReport] = useState('');
  const [backendHealth, setBackendHealth] = useState('checking');
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || null);

  const isAuthenticated = !!token;

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  // Verify and fetch profile updates if token is present
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Profile request failed with HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const displayName = data.email.split('@')[0].replace(/[._-]+/g, ' ');
        setUser({
          name: displayName || 'Deep Researcher',
          email: data.email,
        });
      })
      .catch((err) => {
        console.warn('Invalid access token or profile fetch failed:', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      });
  }, [token]);

  // Fetch backend research history when authenticated
  useEffect(() => {
    if (!token) return;
    fetch('/api/v1/research/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`History request failed with HTTP ${res.status}`);
        return res.json();
      })
      .then((items) => {
        const mapped = (items || []).map((item) => ({
          id: `backend-${item.id}`,
          query: item.query,
          timestamp: new Date(item.created_at).getTime(),
          report: item.report_markdown || '',
          scrapedSources: item.sources || [],
          logs: [],
          subQueries: [],
          criticVerdict: '',
          activeNode: 'planner',
          status: 'completed',
        }));
        setHistory(mapped);
      })
      .catch((err) => {
        console.warn('Failed to load backend research history:', err);
      });
  }, [token]);

  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'healthy') setBackendHealth('online');
        else setBackendHealth('degraded');
      })
      .catch(() => setBackendHealth('offline'));
  }, []);

  const hasActiveWorkspace = useMemo(() => {
    return isStreaming || report || logs.length > 0 || scrapedSources.length > 0;
  }, [isStreaming, report, logs.length, scrapedSources.length]);

  const saveSession = (session) => {
    setHistory((prev) => [session, ...prev.filter((item) => item.id !== session.id)]);
    setActiveHistoryId(session.id);
  };

  const handleStartResearch = async (payload) => {
    const { query, files = [], searchMode = 'live' } = typeof payload === 'string' ? { query: payload } : payload;
    setCurrentQuery(query);
    setIsStreaming(true);
    setLogs([`[System] Initiated research session for query: '${query}'`]);
    setSubQueries([]);
    setScrapedSources([]);
    setActiveNode('planner');
    setCriticVerdict('');
    setReport('');
    setActiveTab('trace');
    setActiveRightTab('report');

    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      // Build FormData to include files and search mode
      const formData = new FormData();
      formData.append('query', query);
      formData.append('search_mode', searchMode);
      for (const f of files || []) formData.append('files', f);

      const response = await fetch('/api/v1/research/stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedLogs = [`[System] Initiated research session for query: '${query}'`];
      let collectedSources = [];
      let latestReport = '';
      let latestCritic = '';
      let latestNode = 'planner';
      let latestSubQueries = [];

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
              if (data.logs) {
                accumulatedLogs = [...accumulatedLogs, ...data.logs];
                setLogs((prev) => [...prev, ...data.logs]);
              }
              if (data.event === 'node_update') {
                if (data.node) {
                  setActiveNode(data.node);
                  latestNode = data.node;
                }
                if (data.sub_queries) {
                  latestSubQueries = data.sub_queries;
                  setSubQueries(data.sub_queries);
                }
                if (data.critic_verdict) {
                  latestCritic = data.critic_verdict;
                  setCriticVerdict(data.critic_verdict);
                }
              } else if (data.event === 'complete') {
                if (data.report) {
                  latestReport = data.report;
                  setReport(data.report);
                }
                if (data.scraped_data) {
                  collectedSources = data.scraped_data;
                  setScrapedSources(data.scraped_data);
                }
                if (data.execution_logs) {
                  accumulatedLogs = data.execution_logs;
                  setLogs(data.execution_logs);
                }
                setActiveTab('report');
              }
            } catch (err) {
              console.error('Error parsing SSE data chunk:', err);
            }
          }
        }
      }

      const session = {
        id: sessionId,
        query,
        timestamp: Date.now(),
        logs: accumulatedLogs,
        report: latestReport,
        scrapedSources: collectedSources,
        subQueries: latestSubQueries,
        criticVerdict: latestCritic,
        activeNode: latestNode,
        status: 'completed',
      };

      saveSession(session);
    } catch (error) {
      console.warn('SSE Stream interrupted, attempting fallback execute endpoint:', error);
      setLogs((prev) => [...prev, `[System Warning] SSE stream interrupted: ${error.message}. Invoking direct fallback execution...`]);

      try {
        const fallbackForm = new FormData();
        fallbackForm.append('query', query);
        fallbackForm.append('search_mode', searchMode);
        for (const f of files || []) fallbackForm.append('files', f);

        const fallbackRes = await fetch('/api/v1/research/execute', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: fallbackForm,
        });
        const fallbackData = await fallbackRes.json();
        const fallbackLogs = fallbackData.execution_logs || [];
        const fallbackReport = fallbackData.report || '';
        const fallbackSources = fallbackData.scraped_data || [];
        const fallbackCritic = fallbackData.critic_verdict || 'APPROVED';

        setReport(fallbackReport);
        setScrapedSources(fallbackSources);
        setLogs((prev) => [...prev, ...fallbackLogs]);
        setCriticVerdict(fallbackCritic);
        setActiveTab('report');

        saveSession({
          id: sessionId,
          query,
          timestamp: Date.now(),
          logs: [...logs, ...fallbackLogs],
          report: fallbackReport,
          scrapedSources: fallbackSources,
          subQueries,
          criticVerdict: fallbackCritic,
          activeNode,
          status: 'completed',
        });
      } catch (fbErr) {
        setLogs((prev) => [...prev, `[System Error] Execution failed: ${fbErr.message}`]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleNewResearch = () => {
    setCurrentQuery('');
    setLogs([]);
    setSubQueries([]);
    setScrapedSources([]);
    setActiveNode('planner');
    setCriticVerdict('');
    setReport('');
    setActiveTab('report');
    setActiveRightTab('report');
    setActiveHistoryId(null);
  };

  const handleLoadHistory = (item) => {
    setActiveHistoryId(item.id);
    setCurrentQuery(item.query);
    setLogs(item.logs || []);
    setSubQueries(item.subQueries || []);
    setScrapedSources(item.scrapedSources || []);
    setActiveNode(item.activeNode || 'planner');
    setCriticVerdict(item.criticVerdict || '');
    setReport(item.report || '');
    setActiveTab(item.report ? 'report' : 'trace');
    setActiveRightTab('report');
  };

  const handleDeleteHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  };

  const handleAuthSuccess = (account) => {
    setToken(account.token);
    setUser(account.user);
    setAuthOpen(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setSettingsOpen(false);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 bg-slate-radial flex items-center justify-center p-4">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onAuthenticated={handleAuthSuccess}
          fullscreen={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 bg-slate-radial">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        activeNode={activeNode}
        isStreaming={isStreaming}
        backendHealth={backendHealth}
        onOpenMcpDrawer={() => setMcpDrawerOpen(true)}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
        onNewResearch={handleNewResearch}
        history={history}
        activeHistoryId={activeHistoryId}
        onSelectHistory={handleLoadHistory}
        onDeleteHistory={handleDeleteHistory}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <main className="transition-all duration-300" style={{ marginLeft: sidebarOpen ? 288 : 80 }}>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <section className="grid grid-cols-1 xl:grid-cols-[0.78fr_0.22fr] gap-6">
            <div className="glass-panel rounded-[32px] border border-slate-800/70 p-8 shadow-2xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.35em] text-indigo-300/70">Research Workspace</p>
                  <h1 className="text-4xl font-semibold tracking-tight text-white">
                    Discover insights, synthesize reports, and manage your research flow.
                  </h1>
                  <p className="mt-4 max-w-2xl text-slate-400 leading-relaxed">
                    DeepFetch AI combines live agent execution, historical session storage, and export-ready artifacts in a professional SaaS research dashboard.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-3xl border border-slate-700/50 bg-slate-900/80 p-5 shadow-inner">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Workspace Status</span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">{isStreaming ? 'Active' : 'Idle'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="rounded-2xl bg-slate-900/80 p-4">
                      <p className="font-semibold text-slate-100">Sessions</p>
                      <p className="mt-2 text-2xl text-indigo-300">{history.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 p-4">
                      <p className="font-semibold text-slate-100">Saved Reports</p>
                      <p className="mt-2 text-2xl text-emerald-300">{history.filter((item) => item.report).length}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleNewResearch}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                    New Research Session
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] border border-slate-800/70 p-6 shadow-xl bg-slate-950/70">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">Quick Actions</p>
                  <h2 className="text-lg font-semibold text-white">Start a new research query</h2>
                </div>
                <button
                  onClick={() => setMcpDrawerOpen(true)}
                  className="rounded-2xl bg-slate-900/90 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/80 transition-all duration-200 hover:-translate-y-0.5"
                >
                  MCP Connectivity
                </button>
              </div>
              <ResearchForm onSubmit={handleStartResearch} isStreaming={isStreaming} initialQuery={currentQuery} />
            </div>
          </section>

          {!hasActiveWorkspace ? (
            <section className="glass-panel rounded-[32px] border border-slate-800/70 p-10 shadow-2xl text-center">
              <div className="mx-auto max-w-3xl">
                <div className="inline-flex items-center justify-center rounded-full bg-indigo-600/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-indigo-200 mb-6">
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-300" /> Idle Workspace
                </div>
                <h2 className="text-3xl font-semibold text-white">Your research hub is ready.</h2>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  Enter a research topic to launch a live multi-agent session. Your session history and exported artifacts are stored locally for fast recall.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {['Search planning', 'Verified source scraping', 'Fact-checked synthesis', 'Export Markdown/PDF'].map((item) => (
                    <div key={item} className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-6 text-left shadow-sm">
                      <p className="text-sm font-semibold text-slate-100">{item}</p>
                      <p className="mt-2 text-sm text-slate-400">Designed for a modern research workflow with clean provenance controls and export options.</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-6">
              <div className="glass-panel rounded-[32px] border border-slate-800/70 p-6 shadow-2xl">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">Execution Log</p>
                    <h2 className="text-2xl font-semibold text-white">Live Agent Stream</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isStreaming ? 'Streaming active' : 'Latest execution state'}
                  </div>
                </div>
                <AgentTraceViewer
                  activeNode={activeNode}
                  logs={logs}
                  subQueries={subQueries}
                  criticVerdict={criticVerdict}
                  isStreaming={isStreaming}
                />
              </div>

              <div className="glass-panel rounded-[32px] border border-slate-800/70 p-6 shadow-2xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">Research artifact</p>
                    <h2 className="text-2xl font-semibold text-white">Final outputs & sources</h2>
                  </div>
                  <div className="flex rounded-3xl bg-slate-900/80 p-1 text-sm text-slate-300">
                    <button
                      onClick={() => setActiveRightTab('report')}
                      className={`px-4 py-2 rounded-3xl transition-all ${activeRightTab === 'report' ? 'bg-indigo-500/20 text-indigo-100' : 'hover:bg-slate-800'}`}
                    >
                      Report View
                    </button>
                    <button
                      onClick={() => setActiveRightTab('sources')}
                      className={`px-4 py-2 rounded-3xl transition-all ${activeRightTab === 'sources' ? 'bg-indigo-500/20 text-indigo-100' : 'hover:bg-slate-800'}`}
                    >
                      Sources Panel
                    </button>
                  </div>
                </div>

                {activeRightTab === 'report' ? (
                  <ReportViewer report={report} query={currentQuery} />
                ) : (
                  <SourceCitationDashboard sources={scrapedSources} />
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {mcpDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch bg-slate-950/80 backdrop-blur-sm">
          <div className="ml-auto w-full max-w-md border-l border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-slate-950/40">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">MCP Connectivity</p>
                <h3 className="text-lg font-semibold text-white">Server Connectivity Status</h3>
              </div>
              <button
                onClick={() => setMcpDrawerOpen(false)}
                className="text-slate-400 hover:text-white rounded-lg p-2"
                aria-label="Close MCP drawer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 p-6 text-sm text-slate-300">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-slate-100">MCP API Gateway</p>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-300 px-2 py-1 text-[11px]">Connected</span>
                </div>
                <p className="text-slate-400">Live command channel for remote agent orchestration and model coordination.</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-slate-100">Playwright Browser Pool</p>
                  <span className="rounded-full bg-amber-400/10 text-amber-300 px-2 py-1 text-[11px]">Warm</span>
                </div>
                <p className="text-slate-400">Headless browser workers are ready to scrape live sources for the current workspace.</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-slate-100">Data Persistence</p>
                  <span className="rounded-full bg-slate-700/80 text-slate-300 px-2 py-1 text-[11px]">Local</span>
                </div>
                <p className="text-slate-400">Research sessions and exported artifacts are stored in your browser so you can reload without losing context.</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMcpDrawerOpen(false)}
            className="flex-1 bg-transparent"
            aria-label="Close overlay"
          />
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={handleAuthSuccess} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} onLogout={handleLogout} />
    </div>
  );
}
