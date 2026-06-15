import { useState, useEffect, useRef, useCallback } from 'react';

// ===== CODE CONTENT =====
const CODE_LINES = [
  { text: 'def authenticate_user(username, password):', indent: 0 },
  { text: '    user = db.query(f"SELECT * FROM users', indent: 0 },
  { text: "                    WHERE username='{username}'\")", indent: 0 },
  { text: '    if user and user.password == password:', indent: 0 },
  { text: '        return generate_token(user.id)', indent: 0 },
  { text: '    return None', indent: 0 },
];

const FULL_CODE = CODE_LINES.map(l => l.text).join('\n');

const ANNOTATIONS = [
  {
    icon: '⚠',
    title: 'SQL Injection vulnerability on line 2',
    detail: 'Use parameterized queries: db.query("SELECT * FROM users WHERE username = ?", [username])',
    color: 'var(--color-danger)',
  },
  {
    icon: '⚠',
    title: 'Plain-text password comparison — hash passwords with bcrypt',
    detail: null,
    color: 'var(--color-warning)',
  },
];

// ===== SYNTAX HIGHLIGHTING (simple, no external dependency) =====
function highlightPython(code) {
  const keywords = /\b(def|return|if|and|None|True|False|from|import|class|for|in|while|else|elif|not|or|try|except|finally|with|as|pass|break|continue|raise|yield)\b/g;
  const strings = /(f?"[^"]*"|f?'[^']*')/g;
  const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
  const comments = /(#.*$)/gm;

  // We need to tokenize carefully to avoid overlapping replacements
  const tokens = [];
  let remaining = code;
  let offset = 0;

  // Find all matches and sort by position
  const allMatches = [];

  for (const match of code.matchAll(strings)) {
    allMatches.push({ start: match.index, end: match.index + match[0].length, text: match[0], type: 'string' });
  }
  for (const match of code.matchAll(keywords)) {
    allMatches.push({ start: match.index, end: match.index + match[0].length, text: match[0], type: 'keyword' });
  }
  for (const match of code.matchAll(functions)) {
    allMatches.push({ start: match.index, end: match.index + match[1].length, text: match[1], type: 'function' });
  }
  for (const match of code.matchAll(comments)) {
    allMatches.push({ start: match.index, end: match.index + match[0].length, text: match[0], type: 'comment' });
  }

  // Sort by start position
  allMatches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep first)
  const filtered = [];
  let lastEnd = 0;
  for (const m of allMatches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // Build result
  const parts = [];
  let pos = 0;
  for (const m of filtered) {
    if (m.start > pos) {
      parts.push(<span key={`t-${pos}`}>{code.slice(pos, m.start)}</span>);
    }
    const colorMap = {
      keyword: '#C98A2A',
      string: '#3D9970',
      function: '#4F7EFF',
      comment: '#555869',
    };
    parts.push(
      <span key={`m-${m.start}`} style={{ color: colorMap[m.type] }}>
        {m.text}
      </span>
    );
    pos = m.end;
  }
  if (pos < code.length) {
    parts.push(<span key={`t-${pos}`}>{code.slice(pos)}</span>);
  }

  return parts;
}

// ===== MAIN COMPONENT =====
export default function CodeDemo() {
  const [phase, setPhase] = useState('idle'); // idle | typing | pause1 | annotate1 | pause2 | annotate2 | complete
  const [typedLength, setTypedLength] = useState(0);
  const [showAnnotation1, setShowAnnotation1] = useState(false);
  const [showAnnotation2, setShowAnnotation2] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const startAnimation = useCallback(() => {
    cleanup();
    setTypedLength(0);
    setShowAnnotation1(false);
    setShowAnnotation2(false);
    setShowReplay(false);

    if (prefersReducedMotion.current) {
      // Skip animation, show everything immediately
      setTypedLength(FULL_CODE.length);
      setShowAnnotation1(true);
      setShowAnnotation2(true);
      setShowReplay(true);
      setPhase('complete');
      return;
    }

    setPhase('typing');
    let charIndex = 0;
    let lastTime = 0;
    const CHAR_DELAY = 18;

    const typeStep = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      if (timestamp - lastTime >= CHAR_DELAY) {
        charIndex++;
        setTypedLength(charIndex);
        lastTime = timestamp;
      }
      if (charIndex < FULL_CODE.length) {
        rafRef.current = requestAnimationFrame(typeStep);
      } else {
        // Typing done → pause, then annotations
        setPhase('pause1');
        timerRef.current = setTimeout(() => {
          setShowAnnotation1(true);
          setPhase('annotate1');
          timerRef.current = setTimeout(() => {
            setShowAnnotation2(true);
            setPhase('annotate2');
            timerRef.current = setTimeout(() => {
              setShowReplay(true);
              setPhase('complete');
            }, 500);
          }, 1500);
        }, 800);
      }
    };
    rafRef.current = requestAnimationFrame(typeStep);
  }, [cleanup]);

  useEffect(() => {
    startAnimation();
    return cleanup;
  }, [startAnimation, cleanup]);

  const displayedCode = FULL_CODE.slice(0, typedLength);
  const cursor = phase === 'typing' || phase === 'idle';

  // ===== STYLES =====
  const styles = {
    panel: {
      background: 'var(--color-code-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 540,
      position: 'relative',
    },
    chrome: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
    },
    dot: (color) => ({
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: color,
    }),
    tab: {
      marginLeft: 'auto',
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: 'var(--color-text-3)',
      background: 'var(--color-surface-2)',
      padding: '3px 10px',
      borderRadius: 4,
    },
    codeArea: {
      padding: '16px 16px 12px',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.7,
      color: 'var(--color-text-1)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      minHeight: 160,
    },
    cursorChar: {
      display: 'inline-block',
      width: 2,
      height: 16,
      background: 'var(--color-accent)',
      marginLeft: 1,
      animation: 'cursorBlink 1s step-end infinite',
      verticalAlign: 'text-bottom',
    },
    annotation: (show, color) => ({
      display: 'flex',
      gap: 10,
      padding: '10px 16px',
      borderTop: `1px solid var(--color-border)`,
      borderLeft: `3px solid ${color}`,
      background: 'var(--color-surface)',
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 300ms ease-out, transform 300ms ease-out',
      maxHeight: show ? 120 : 0,
      overflow: 'hidden',
    }),
    annotationIcon: {
      fontSize: 14,
      lineHeight: '20px',
      flexShrink: 0,
    },
    annotationTitle: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--color-text-1)',
      fontFamily: "'Inter', sans-serif",
      lineHeight: 1.5,
    },
    annotationDetail: {
      fontSize: 12,
      color: 'var(--color-text-2)',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      marginTop: 4,
      lineHeight: 1.5,
    },
    replay: {
      position: 'absolute',
      bottom: 8,
      right: 12,
      fontSize: 12,
      color: 'var(--color-text-3)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: "'Inter', sans-serif",
      opacity: showReplay ? 1 : 0,
      transition: 'opacity 300ms ease, color 150ms ease',
      padding: '4px 0',
    },
  };

  return (
    <div style={styles.panel}>
      {/* Cursor blink keyframe (injected once) */}
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Window chrome */}
      <div style={styles.chrome}>
        <span style={styles.dot('var(--color-danger)')} />
        <span style={styles.dot('var(--color-warning)')} />
        <span style={styles.dot('var(--color-success)')} />
        <span style={styles.tab}>auth.py</span>
      </div>

      {/* Code area */}
      <div style={styles.codeArea}>
        {highlightPython(displayedCode)}
        {cursor && <span style={styles.cursorChar} />}
      </div>

      {/* Annotation 1 */}
      <div style={styles.annotation(showAnnotation1, ANNOTATIONS[0].color)}>
        <span style={styles.annotationIcon}>{ANNOTATIONS[0].icon}</span>
        <div>
          <div style={styles.annotationTitle}>{ANNOTATIONS[0].title}</div>
          {ANNOTATIONS[0].detail && (
            <div style={styles.annotationDetail}>{ANNOTATIONS[0].detail}</div>
          )}
        </div>
      </div>

      {/* Annotation 2 */}
      <div style={styles.annotation(showAnnotation2, ANNOTATIONS[1].color)}>
        <span style={styles.annotationIcon}>{ANNOTATIONS[1].icon}</span>
        <div>
          <div style={styles.annotationTitle}>{ANNOTATIONS[1].title}</div>
        </div>
      </div>

      {/* Replay button */}
      <button
        style={styles.replay}
        onClick={startAnimation}
        onMouseEnter={(e) => e.target.style.color = 'var(--color-text-1)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--color-text-3)'}
      >
        Replay demo →
      </button>
    </div>
  );
}
