import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Editor, { DiffEditor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { analyzeCode, checkHealth } from './services/api';
import './App.css';

// ===== FRAMER MOTION VARIANTS =====
const appVariants = {
  initial: { opacity: 0, y: 32 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.0, 0, 0.2, 1] }
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] }
  }
};

// ===== CONSTANTS =====

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  padding: { top: 12 },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontLigatures: true,
  wordWrap: 'on',
  scrollbar: {
    alwaysConsumeMouseWheel: false,
    vertical: 'visible',
  }
};

const DIFF_EDITOR_OPTIONS = {
  renderSideBySide: true,
  fontSize: 14,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  scrollbar: {
    alwaysConsumeMouseWheel: false,
    vertical: 'visible',
  }
};

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'csharp', label: 'C#' },
];

// ===== HELPERS =====

function getRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString();
}

function getLangBadgeClass(lang) {
  const map = {
    python: 'lang-badge--python',
    javascript: 'lang-badge--javascript',
    typescript: 'lang-badge--typescript',
    java: 'lang-badge--java',
    cpp: 'lang-badge--cpp',
    go: 'lang-badge--go',
    rust: 'lang-badge--rust',
    csharp: 'lang-badge--csharp',
  };
  return map[lang] || '';
}

// ===== MAIN APP =====

function App() {
  const [code, setCode] = useState('# Paste your code here...\ndef example_function(x):\n    return x * 2');
  const [language, setLanguage] = useState('python');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);

  // UI & Feature States
  const [showDiff, setShowDiff] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('review');

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  // 1. Load History from LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('code_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 2. Apply Theme Class to HTML Root
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme === 'dark' ? 'dark' : 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 3. Check Server Health on Load & Periodically
  useEffect(() => {
    const fetchStatus = () => {
      checkHealth()
        .then(data => setServerStatus(data))
        .catch(() => setServerStatus({ status: 'offline' }));
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 10000); // Poll every 10s

    return () => clearInterval(intervalId);
  }, []);

  // ===== HANDLER FUNCTIONS =====

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const extractCodeFromReview = (markdownText) => {
    if (!markdownText) return '';
    const match = markdownText.match(/```[\w]*\n([\s\S]*?)```/);
    return match ? match[1].trim() : code;
  };

  const addToHistory = (code, lang, resultData) => {
    const newEntry = {
      id: Date.now(),
      code,
      language: lang,
      result: resultData,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('code_history', JSON.stringify(updatedHistory));
  };

  const handleRestore = (entry) => {
    setCode(entry.code);
    setLanguage(entry.language);
    setResults(entry.result);
    setShowDrawer(false);
    setShowDiff(false);
    setActiveTab('review');
    showToast('History item restored', 'info');
  };

  const handleDeleteHistory = (e, id) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('code_history', JSON.stringify(updatedHistory));
  };

  const handleDownload = () => {
    if (!results) return;
    const content = `# CodeReview — AI Analysis Report
Generated on: ${new Date().toLocaleString()}
Language: ${language}

## Original Code
\`\`\`${language}
${code}
\`\`\`

---

## Code Review
${results.review}

---

## Documentation
${results.docstring}

---
*Generated by CodeReview (Gemini 2.5 Flash)*
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Report downloaded', 'success');
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      showToast('Please enter some code to analyze', 'error');
      return;
    }
    setLoading(true);
    setResults(null);
    setShowDiff(false);
    setActiveTab('review');

    try {
      const data = await analyzeCode(code, language);
      setResults(data);
      addToHistory(code, language, data);
      setServerStatus({ status: 'healthy' }); // Mark online on successful analysis
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
      if (err.message && err.message.includes('server')) {
        setServerStatus({ status: 'offline' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setResults(null);
    setShowDiff(false);
    setActiveTab('review');
    showToast('Editor cleared', 'info');
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  // ===== STATUS HELPERS =====

  const getStatusLabel = () => {
    if (!serverStatus) return 'Checking…';
    return serverStatus.status === 'healthy' ? 'Connected' : 'Offline';
  };

  const getStatusDotClass = () => {
    if (!serverStatus) return 'status-dot status-dot--checking';
    return serverStatus.status === 'healthy'
      ? 'status-dot status-dot--online'
      : 'status-dot status-dot--offline';
  };

  // Determine Monaco theme
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';

  // ===== RENDER HISTORY PANEL CONTENT (shared between sidebar and drawer) =====

  const renderHistoryContent = () => (
    <>
      <div className="left-panel-section">
        <label className="left-panel-label" htmlFor="lang-select">Language</label>
        <select
          id="lang-select"
          className="left-panel-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="history-header">
        <span className="history-title">Recent</span>
        {history.length > 0 && (
          <span className="history-count">{history.length}/10</span>
        )}
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">
            No history yet. Run your first analysis.
          </div>
        ) : (
          history.map(item => (
            <div
              key={item.id}
              className="history-item"
              onClick={() => handleRestore(item)}
            >
              <div className="history-item-top">
                <span className={`lang-badge ${getLangBadgeClass(item.language)}`}>
                  {item.language}
                </span>
                <span className="history-item-time">
                  {getRelativeTime(item.timestamp)}
                </span>
              </div>
              <div className="history-item-code">
                {item.code.slice(0, 60)}
              </div>
              <button
                className="history-item-delete"
                onClick={(e) => handleDeleteHistory(e, item.id)}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );

  // ===== RENDER =====

  return (
    <motion.div 
      className="app-shell"
      variants={appVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >

      {/* ===== Toast ===== */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ===== Mobile/Tablet Drawer ===== */}
      <div
        className={`drawer-backdrop ${showDrawer ? 'open' : ''}`}
        onClick={() => setShowDrawer(false)}
      />
      <div className={`drawer-panel ${showDrawer ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-header-title">CodeReview</span>
          <button className="drawer-close" onClick={() => setShowDrawer(false)}>✕</button>
        </div>
        {renderHistoryContent()}
      </div>

      {/* ===== Header ===== */}
      <header className="app-header">
        <div className="app-header-logo">
          <button
            className="drawer-toggle"
            onClick={() => setShowDrawer(true)}
            title="Open menu"
          >
            ☰
          </button>
          <Link
            to="/"
            style={{
              fontSize: 12,
              color: 'var(--color-text-3)',
              textDecoration: 'none',
              transition: 'color 80ms ease',
              marginRight: 8,
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--color-text-2)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-3)'}
          >
            ← Back to home
          </Link>
          <span className="app-header-logo-icon">&lt;/&gt;</span>
          <span className="app-header-logo-text">CodeReview</span>
        </div>

        <div className="app-header-actions">
          <div className="status-pill">
            <span className={getStatusDotClass()} />
            <span>{getStatusLabel()}</span>
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {/* ===== Main Body ===== */}
      <div className="app-body">

        {/* --- Left Panel (desktop) --- */}
        <aside className="left-panel">
          {renderHistoryContent()}
        </aside>

        {/* --- Center Panel --- */}
        <main className="center-panel">
          <div className="editor-wrapper">
            {showDiff && results ? (
              <>
                <div className="diff-labels">
                  <span className="diff-label">Original</span>
                  <span className="diff-label">AI Suggested</span>
                </div>
                <DiffEditor
                  height="100%"
                  language={language}
                  original={code}
                  modified={extractCodeFromReview(results.review)}
                  theme={monacoTheme}
                  options={DIFF_EDITOR_OPTIONS}
                />
              </>
            ) : (
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme={monacoTheme}
                options={EDITOR_OPTIONS}
              />
            )}
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="toolbar-group">
              <button
                className="btn btn--primary"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Analyzing…
                  </>
                ) : (
                  'Analyze'
                )}
              </button>

              <button
                className={`btn btn--secondary ${showDiff ? 'active' : ''}`}
                onClick={() => setShowDiff(!showDiff)}
                disabled={!results}
                title={!results ? 'Run analysis first' : 'Toggle diff view'}
              >
                ⇄ Compare Fix
              </button>
            </div>

            <div className="toolbar-group">
              <button
                className="btn btn--outline"
                onClick={handleDownload}
                disabled={!results}
              >
                ↓ Download Report
              </button>
              <button
                className="btn btn--ghost"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          </div>
        </main>

        {/* --- Right Panel --- */}
        <aside className="right-panel">
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              Code Review
            </button>
            <button
              className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              Documentation
            </button>
          </div>

          <div className="results-content">
            {loading ? (
              <SkeletonLoader />
            ) : results ? (
              <div className="prose-custom">
                {activeTab === 'review' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                      <button
                        className="btn btn--outline"
                        style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                        onClick={() => handleCopy(results.review, 'Review')}
                      >
                        Copy
                      </button>
                    </div>
                    <TypewriterMarkdown content={results.review} />
                  </>
                )}
                {activeTab === 'docs' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                      <button
                        className="btn btn--outline"
                        style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                        onClick={() => handleCopy(results.docstring, 'Documentation')}
                      >
                        Copy
                      </button>
                    </div>
                    <TypewriterMarkdown content={results.docstring} />
                  </>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">{`{ }`}</div>
                <div className="empty-state-text">
                  Paste your code and click Analyze to get started.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

// ===== SUB-COMPONENTS =====

// 1. Typewriter Effect Component
const TypewriterMarkdown = ({ content }) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    setDisplayedContent('');
    let index = 0;
    const intervalId = setInterval(() => {
      index += 3; // Speed: 3 chars per 10ms
      if (index >= content.length) {
        setDisplayedContent(content);
        clearInterval(intervalId);
      } else {
        setDisplayedContent(content.slice(0, index));
      }
    }, 10);
    return () => clearInterval(intervalId);
  }, [content]);

  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

// 2. Toast Component
const Toast = ({ message, type, onClose }) => {
  return (
    <div className={`toast toast--${type}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
};

// 3. Skeleton Loader Component
const SkeletonLoader = () => {
  return (
    <div className="skeleton-container">
      <span className="skeleton-label">Analyzing your code…</span>
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
  );
};

export default App;