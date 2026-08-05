import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ResearchForm from './components/ResearchForm';
import ReportViewer from './components/ReportViewer';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import LogoutConfirmationModal from './components/LogoutConfirmationModal';

const TOKEN_STORAGE_KEY = 'deepfetch_access_token';
const USER_STORAGE_KEY = 'deepfetch_workspace_user';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [scrapedSources, setScrapedSources] = useState([]);
  const [report, setReport] = useState('');
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
  const refreshHistory = useCallback(() => {
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
    refreshHistory();
  }, [token, refreshHistory]);

  const hasActiveWorkspace = useMemo(() => {
    return isStreaming || report;
  }, [isStreaming, report]);

  const saveSession = (session) => {
    setHistory((prev) => [session, ...prev.filter((item) => item.id !== session.id)]);
    setActiveHistoryId(session.id);
  };

  const handleStartResearch = async (payload) => {
    const { query, files = [], searchMode = 'live' } = typeof payload === 'string' ? { query: payload } : payload;
    setCurrentQuery(query);
    setIsStreaming(true);
    setLogs([`[System] Initiated research session for query: '${query}'`]);
    setScrapedSources([]);
    setReport('');

    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
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
              if (data.event === 'complete') {
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
        subQueries: [],
        criticVerdict: '',
        activeNode: 'planner',
        status: 'completed',
      };

      saveSession(session);
      refreshHistory();
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

        setReport(fallbackReport);
        setScrapedSources(fallbackSources);
        setLogs((prev) => [...prev, ...fallbackLogs]);

        saveSession({
          id: sessionId,
          query,
          timestamp: Date.now(),
          logs: [...logs, ...fallbackLogs],
          report: fallbackReport,
          scrapedSources: fallbackSources,
          subQueries: [],
          criticVerdict: '',
          activeNode: 'planner',
          status: 'completed',
        });
        refreshHistory();
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
    setScrapedSources([]);
    setReport('');
    setActiveHistoryId(null);
  };

  const handleLoadHistory = (item) => {
    setActiveHistoryId(item.id);
    setCurrentQuery(item.query);
    setLogs(item.logs || []);
    setScrapedSources(item.scrapedSources || []);
    setReport(item.report || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setSettingsOpen(false);
    setConfirmLogoutOpen(true);
  };

  const handleConfirmLogout = () => {
    setToken(null);
    setUser(null);
    setConfirmLogoutOpen(false);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0e1117] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-200">
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
    <div className="min-h-screen bg-white dark:bg-[#0e1117] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
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

      {/* Main content area */}
      <main className="transition-all duration-300" style={{ marginLeft: sidebarOpen ? 288 : 80 }}>
        <div className="relative min-h-[calc(100vh-64px)] flex flex-col">
          {/* Empty state: centered greeting + input */}
          {!hasActiveWorkspace ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-40">
              <h1 className="text-3xl md:text-4xl font-medium text-slate-900 dark:text-white text-center tracking-tight">
                Where would you like to begin?
              </h1>
              <p className="mt-3 text-slate-500 dark:text-slate-400 text-center max-w-md">
                Ask a research question and DeepFetch AI will plan, search, and synthesize a verified report.
              </p>
            </div>
          ) : (
            /* Active: full-width clean reading canvas */
            <div className="flex-1 px-6 py-8 pb-40">
              {isStreaming && !report && (
                <div className="flex items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">DeepFetch is researching "{currentQuery}"...</span>
                </div>
              )}
              <ReportViewer report={report} query={currentQuery} />
            </div>
          )}

          {/* Gemini-style floating input bar (fixed near bottom) */}
          <div
            className="fixed left-0 right-0 bottom-0 z-30 px-4 pb-6"
            style={{ paddingLeft: sidebarOpen ? 288 : 80 }}
          >
            <div className="max-w-2xl mx-auto">
              <ResearchForm onSubmit={handleStartResearch} isStreaming={isStreaming} initialQuery={currentQuery} />
              <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-600">
                DeepFetch AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={handleAuthSuccess} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} onLogout={handleLogout} />
      <LogoutConfirmationModal
        isOpen={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
