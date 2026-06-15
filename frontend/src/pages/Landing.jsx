import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import CodeDemo from '../components/CodeDemo';

// ===== DATA =====

const FEATURES = [
  { icon: '🐛', title: 'Bug Detection', desc: 'Catches logical errors, unhandled edge cases, and runtime exceptions before they reach production.' },
  { icon: '🔒', title: 'Security Scanning', desc: 'Flags SQL injection, XSS vulnerabilities, insecure credential handling, and common OWASP Top 10 patterns.' },
  { icon: '⚡', title: 'Performance Hints', desc: 'Identifies O(n²) loops, redundant database calls, and memory allocation issues with specific fix suggestions.' },
  { icon: '📄', title: 'Auto Documentation', desc: 'Generates complete docstrings in the right format for your language — PEP 257, JSDoc, Javadoc, GoDoc.' },
  { icon: '⇄', title: 'Diff View', desc: 'Side-by-side Monaco editor shows exactly what the AI changed and why. Accept or reject with full context.' },
  { icon: '🕐', title: 'Review History', desc: 'Stores your last 10 sessions locally. Restore any previous analysis instantly — no account required.' },
];

const STEPS = [
  { num: '01', title: 'Paste your code', desc: 'Open the editor, paste any snippet in any of the 8 supported languages. No project setup. No file uploads. Just code.' },
  { num: '02', title: 'Run the analysis', desc: 'Click Analyze. The AI reviews your code for bugs, security issues, performance, style, and algorithm quality — simultaneously.' },
  { num: '03', title: 'Review and export', desc: 'Read the annotated review, explore the diff view to see suggested fixes, and download the full report as Markdown.' },
];

const LANGUAGES = [
  { name: 'Python', badge: 'python' }, { name: 'JavaScript', badge: 'javascript' },
  { name: 'TypeScript', badge: 'typescript' }, { name: 'Java', badge: 'java' },
  { name: 'C++', badge: 'cpp' }, { name: 'Go', badge: 'go' },
  { name: 'Rust', badge: 'rust' }, { name: 'C#', badge: 'csharp' },
];

const STATS = [
  { value: '8', label: 'Languages supported' },
  { value: '< 3s', label: 'Average analysis time' },
  { value: '5', label: 'Review categories' },
  { value: '100%', label: 'Your data — always local' },
];

const LANG_BADGE_COLORS = {
  python: { bg: '#2A2510', color: '#C9A227' }, javascript: { bg: '#1A2015', color: '#6DB33F' },
  typescript: { bg: '#101A2A', color: '#3B82F6' }, java: { bg: '#2A1410', color: '#C95B30' },
  cpp: { bg: '#1A1025', color: '#8B6AC9' }, go: { bg: '#0F1F25', color: '#29B6D1' },
  rust: { bg: '#251510', color: '#C4622D' }, csharp: { bg: '#101A10', color: '#57A64A' },
};

const HERO_LANG_PILLS = ['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust'];


// ===== FRAMER MOTION VARIANTS & COMPONENTS =====

const pageVariants = {
  initial: { opacity: 1 },
  exit: {
    opacity: 0,
    y: -24,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.0, 0, 0.2, 1] }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

function FadeUp({ children, custom = 0, style, className }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? {} : fadeUp}
      custom={custom}
      initial={reduced ? false : 'hidden'}
      whileInView={reduced ? false : 'visible'}
      viewport={{ once: true, amount: 0.1 }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function HamburgerIcon({ isOpen }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <motion.line
        x1="2" y1="5" x2="18" y2="5"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        animate={isOpen ? { x1: 3, y1: 3, x2: 17, y2: 17 } : { x1: 2, y1: 5, x2: 18, y2: 5 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      />
      <motion.line
        x1="2" y1="10" x2="18" y2="10"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        animate={isOpen ? { opacity: 0, x1: 10, x2: 10 } : { opacity: 1, x1: 2, x2: 18 }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
      />
      <motion.line
        x1="2" y1="15" x2="18" y2="15"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        animate={isOpen ? { x1: 3, y1: 17, x2: 17, y2: 3 } : { x1: 2, y1: 15, x2: 18, y2: 15 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      />
    </svg>
  );
}


// ===== MAIN COMPONENT =====

const MotionLink = motion.create(Link);
const MotionA = motion.create('a');

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const reducedMotion = useReducedMotion();

  // Scroll transforms for navbar
  const navBg = useTransform(scrollY, [0, 80], ['rgba(14,15,17,0)', 'rgba(14,15,17,0.85)']);
  const navBorder = useTransform(scrollY, [0, 80], ['rgba(42,45,53,0)', 'rgba(42,45,53,1)']);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const smoothScroll = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };


  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      exit="exit"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', minHeight: '100vh' }}
    >
      {/* ===== S1: NAVBAR ===== */}
      <motion.header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1000,
        background: navBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: navBorder,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: 'var(--color-accent)' }}>{`</>`}</span>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-1)' }}>CodeReview AI</span>
        </div>

        {/* Center nav links (desktop) */}
        <div style={{ display: 'flex', gap: 28, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} className="landing-nav-center">
          {[{ label: 'Features', id: 'features' }, { label: 'How it works', id: 'how-it-works' }, { label: 'Languages', id: 'languages' }].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => smoothScroll(e, item.id)}
              style={{ fontSize: 14, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 80ms ease' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-text-1)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-2)'}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a
            href="https://github.com/Furqantech1/ai_code_reviewer" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 80ms ease' }}
            className="landing-nav-github"
            onMouseEnter={(e) => e.target.style.color = 'var(--color-text-1)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-2)'}
          >
            View on GitHub
          </a>
          <MotionLink
            to="/app"
            whileHover={{ scale: reducedMotion ? 1 : 1.025 }}
            whileTap={{ scale: reducedMotion ? 1 : 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{
              fontSize: 13, fontWeight: 500, color: '#fff',
              background: 'var(--color-accent)', padding: '8px 18px', borderRadius: 6,
              textDecoration: 'none', whiteSpace: 'nowrap',
              display: 'inline-block' // needed for transform scale
            }}
          >
            Start for free →
          </MotionLink>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="landing-hamburger"
            style={{
              display: 'none', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 6,
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-text-2)', cursor: 'pointer',
            }}
            aria-label="Toggle menu"
          >
            <HamburgerIcon isOpen={mobileMenuOpen} />
          </button>
        </div>
      </motion.header>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, top: 56, background: 'rgba(0, 0, 0, 0.6)', zIndex: 998 }}
            />
            <motion.nav
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.0, 0, 0.2, 1] }}
              style={{
                position: 'fixed', top: 56, right: 0, bottom: 0,
                width: 'min(300px, 85vw)', background: 'var(--color-surface)',
                borderLeft: '1px solid var(--color-border)', zIndex: 999,
                display: 'flex', flexDirection: 'column', padding: '32px 24px',
              }}
            >
              <motion.ul
                initial="hidden" animate="visible" exit="hidden"
                variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {['Features', 'How it works', 'Languages'].map((label) => (
                  <motion.li
                    key={label}
                    variants={{
                      hidden: { opacity: 0, x: 16 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } }
                    }}
                  >
                    <a
                      href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                      onClick={(e) => smoothScroll(e, label.toLowerCase().replace(/ /g, '-'))}
                      style={{
                        display: 'block', padding: '14px 0', fontSize: 17, fontWeight: 500,
                        color: 'var(--color-text-1)', borderBottom: '1px solid var(--color-border)', textDecoration: 'none',
                      }}
                    >
                      {label}
                    </a>
                  </motion.li>
                ))}
                <motion.li
                  variants={{
                    hidden: { opacity: 0, x: 16 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut', delay: 0.1 } }
                  }}
                  style={{ marginTop: 32 }}
                >
                  <Link
                    to="/app"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'block', textAlign: 'center', padding: '12px',
                      background: 'var(--color-accent)', color: '#fff', borderRadius: 7,
                      fontSize: 15, fontWeight: 500, textDecoration: 'none',
                    }}
                  >
                    Start reviewing code →
                  </Link>
                </motion.li>
              </motion.ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>


      {/* ===== S2: HERO ===== */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 64, width: '100%' }} className="landing-hero-grid">
          
          {/* Left — Text */}
          <div style={{ flex: 1, maxWidth: 520 }} className="landing-hero-text">
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: 16 }}>
              AI-POWERED · OPEN SOURCE
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-text-1)', lineHeight: 1.1, marginBottom: 20 }} className="landing-hero-headline">
              Code reviews that<br />actually ship faster.
            </h1>
            <p style={{ fontSize: 17, color: 'var(--color-text-2)', lineHeight: 1.65, maxWidth: 420, marginBottom: 32 }}>
              Paste your code. Get a detailed review covering bugs, performance, security, and style — plus auto-generated documentation. In seconds.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
              <motion.button
                whileHover={{ scale: reducedMotion ? 1 : 1.025 }}
                whileTap={{ scale: reducedMotion ? 1 : 0.97 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                onClick={() => navigate('/app')}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: 44, minWidth: 200, padding: '0 24px', fontSize: 14, fontWeight: 500,
                  color: '#fff', background: 'var(--color-accent)', borderRadius: 7, border: 'none', cursor: 'pointer'
                }}
              >
                Start reviewing code →
              </motion.button>
              <a
                href="#how-it-works" onClick={(e) => smoothScroll(e, 'how-it-works')}
                style={{ fontSize: 14, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 80ms ease' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-text-1)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-2)'}
              >
                See how it works ↓
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {HERO_LANG_PILLS.map((lang) => {
                const colors = LANG_BADGE_COLORS[lang.toLowerCase()] || { bg: 'var(--color-surface-2)', color: 'var(--color-text-2)' };
                return (
                  <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', background: colors.bg, color: colors.color }}>
                    ✓ {lang}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right — Animated code demo */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }} className="landing-hero-demo">
            <CodeDemo />
          </div>
        </div>
      </section>

      {/* ===== S3: STATS BAR ===== */}
      <motion.section 
        variants={reducedMotion ? {} : fadeIn}
        initial={reducedMotion ? false : "hidden"}
        whileInView={reducedMotion ? false : "visible"}
        viewport={{ once: true, amount: 0.5 }}
        style={{ height: 88, display: 'flex', alignItems: 'center', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div style={{ display: 'flex', width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 24px' }} className="landing-stats-grid">
          {STATS.map((stat, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: i < STATS.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <span style={{ fontSize: 32, fontWeight: 600, color: 'var(--color-text-1)' }}>{stat.value}</span>
              <span style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 2 }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ===== S4: FEATURES ===== */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', textAlign: 'center', marginBottom: 12 }}>WHAT YOU GET</div>
        <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-1)', textAlign: 'center', marginBottom: 48 }} className="landing-section-title">Everything a code review should cover</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="landing-features-grid">
          {FEATURES.map((feat, i) => (
            <FadeUp key={i} custom={i}>
              <div
                style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 24,
                  transition: 'border-color 150ms ease', cursor: 'default', height: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-2)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{ width: 32, height: 32, background: 'var(--color-surface-2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {feat.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-1)', marginTop: 16 }}>{feat.title}</div>
                <div style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.6, marginTop: 6 }}>{feat.desc}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ===== S5: HOW IT WORKS ===== */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', textAlign: 'center', marginBottom: 12 }}>THE PROCESS</div>
        <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-1)', textAlign: 'center', marginBottom: 56 }} className="landing-section-title">From code to reviewed in three steps</h2>

        <div style={{ display: 'flex', gap: 32, position: 'relative' }} className="landing-steps-grid">
          {STEPS.map((step, i) => (
            <FadeUp key={i} custom={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {i < STEPS.length - 1 && (
                <div className="landing-step-connector" style={{ position: 'absolute', top: 28, right: -16, width: 32, borderTop: '1px dashed var(--color-border)' }} />
              )}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 700, color: 'var(--color-border-2)', lineHeight: 1, marginBottom: 16 }}>{step.num}</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 8 }}>{step.title}</span>
              <span style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.6 }}>{step.desc}</span>
            </FadeUp>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <motion.button
            whileHover={{ scale: reducedMotion ? 1 : 1.015 }}
            whileTap={{ scale: reducedMotion ? 1 : 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            onClick={() => navigate('/app')}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 42, padding: '0 24px',
              fontSize: 14, fontWeight: 500, color: 'var(--color-text-1)', background: 'transparent',
              border: '1px solid var(--color-border-2)', borderRadius: 6, cursor: 'pointer', transition: 'background 100ms ease, border-color 100ms ease'
            }}
            onMouseEnter={(e) => { e.target.style.background = 'var(--color-surface-2)'; e.target.style.borderColor = 'var(--color-text-3)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'var(--color-border-2)'; }}
          >
            Try it now — no sign-up needed →
          </motion.button>
        </div>
      </section>

      {/* ===== S6: LANGUAGES ===== */}
      <section id="languages" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', textAlign: 'center', marginBottom: 12 }}>SUPPORTED LANGUAGES</div>
        <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-1)', textAlign: 'center', marginBottom: 48 }} className="landing-section-title">Works with the languages you already use</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="landing-languages-grid">
          {LANGUAGES.map((lang, i) => {
            const colors = LANG_BADGE_COLORS[lang.badge];
            return (
              <FadeUp key={lang.badge} custom={i}>
                <div
                  style={{
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 16px',
                    textAlign: 'center', transition: 'border-color 150ms ease', cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-1)', marginBottom: 8 }}>{lang.name}</div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', background: colors.bg, color: colors.color, marginBottom: 8 }}>
                    {lang.name}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>Review · Docstrings · Diff</div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* ===== S7: DIFF VIEW CALLOUT ===== */}
      <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '80px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 56, maxWidth: 1200, margin: '0 auto' }} className="landing-diff-grid">
          
          <FadeUp custom={0} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: 12 }}>COMPARE & FIX</div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 16 }}>See exactly what changed, and why</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 20 }}>
              The built-in diff view shows your original code beside the AI's suggested fix. Not just a description of what to change — the actual corrected code, line by line.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Powered by Monaco — the same editor as VS Code', 'Original on the left, AI fix on the right', 'Scroll in sync — never lose your place', 'Toggle on or off — you stay in control'].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ color: 'var(--color-accent)', fontSize: 12 }}>▸</span>{item}
                </li>
              ))}
            </ul>
            <Link to="/app" style={{ fontSize: 14, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500, transition: 'color 80ms ease' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-accent-hover)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-accent)'}>
              Open the diff view →
            </Link>
          </FadeUp>

          <FadeUp custom={1} style={{ flex: 1, background: 'var(--color-code-bg)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }} className="landing-diff-panel">
            <div style={{ display: 'flex', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ flex: 1, padding: '8px 12px', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 500, borderRight: '1px solid var(--color-border)' }}>Original</div>
              <div style={{ flex: 1, padding: '8px 12px', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 500 }}>AI Suggested</div>
            </div>
            <div style={{ display: 'flex', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8 }}>
              <div style={{ flex: 1, padding: '12px 12px', borderRight: '1px solid var(--color-border)' }}>
                <div style={{ background: 'rgba(201, 74, 74, 0.12)', padding: '2px 6px', borderRadius: 3, marginBottom: 2 }}>
                  <span style={{ color: 'var(--color-danger)', marginRight: 6 }}>−</span><span style={{ color: 'var(--color-text-2)' }}>user = db.query(f"SELECT *</span>
                </div>
                <div style={{ background: 'rgba(201, 74, 74, 0.12)', padding: '2px 6px', borderRadius: 3 }}>
                  <span style={{ color: 'var(--color-danger)', marginRight: 6 }}>−</span><span style={{ color: 'var(--color-text-2)' }}>{`  WHERE username='{username}'")`}</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: '12px 12px' }}>
                <div style={{ background: 'rgba(61, 153, 112, 0.12)', padding: '2px 6px', borderRadius: 3, marginBottom: 2 }}>
                  <span style={{ color: 'var(--color-success)', marginRight: 6 }}>+</span><span style={{ color: 'var(--color-text-2)' }}>user = db.query(</span>
                </div>
                <div style={{ background: 'rgba(61, 153, 112, 0.12)', padding: '2px 6px', borderRadius: 3, marginBottom: 2 }}>
                  <span style={{ color: 'var(--color-success)', marginRight: 6 }}>+</span><span style={{ color: 'var(--color-text-2)' }}>{`  "SELECT * FROM users WHERE username=?",`}</span>
                </div>
                <div style={{ background: 'rgba(61, 153, 112, 0.12)', padding: '2px 6px', borderRadius: 3 }}>
                  <span style={{ color: 'var(--color-success)', marginRight: 6 }}>+</span><span style={{ color: 'var(--color-text-2)' }}>{`  [username])`}</span>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ===== S8: CTA BANNER ===== */}
      <motion.section 
        variants={reducedMotion ? {} : fadeIn}
        initial={reducedMotion ? false : "hidden"}
        whileInView={reducedMotion ? false : "visible"}
        viewport={{ once: true, amount: 0.5 }}
        style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '72px 24px', textAlign: 'center' }}
      >
        <h2 style={{ fontSize: 32, fontWeight: 600, color: 'var(--color-text-1)', letterSpacing: '-0.02em', marginBottom: 12 }}>Your code is waiting for a review.</h2>
        <p style={{ fontSize: 16, color: 'var(--color-text-2)', marginBottom: 28 }}>No account. No credit card. No setup. Just paste and go.</p>
        <motion.button
          whileHover={{ scale: reducedMotion ? 1 : 1.025 }}
          whileTap={{ scale: reducedMotion ? 1 : 0.97 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          onClick={() => navigate('/app')}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 48, padding: '0 32px',
            fontSize: 14, fontWeight: 500, color: '#fff', background: 'var(--color-accent)', borderRadius: 7, border: 'none', cursor: 'pointer'
          }}
        >
          Start reviewing code →
        </motion.button>
        <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 14 }}>Works in your browser. History stored locally.</p>
      </motion.section>

      {/* ===== S9: FOOTER ===== */}
      <footer style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', padding: '48px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 48, maxWidth: 1200, margin: '0 auto', paddingBottom: 32, borderBottom: '1px solid var(--color-border)' }} className="landing-footer-grid">
          <div style={{ flex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: 'var(--color-accent)' }}>{`</>`}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-1)' }}>CodeReview AI</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)', lineHeight: 1.5, marginBottom: 6 }}>AI-powered code review and documentation.</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Powered by Google Gemini</p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-3)', marginBottom: 14 }}>Product</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ label: 'Features', href: '#features', scroll: true }, { label: 'How it works', href: '#how-it-works', scroll: true }, { label: 'Languages', href: '#languages', scroll: true }, { label: 'Open App', to: '/app' }].map((item, i) =>
                item.to ? (
                  <Link key={i} to={item.to} style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 80ms ease' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-text-1)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-2)'}>
                    {item.label}
                  </Link>
                ) : (
                  <a key={i} href={item.href} onClick={item.scroll ? (e) => smoothScroll(e, item.href.slice(1)) : undefined}
                    style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 80ms ease' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-text-1)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-2)'}>
                    {item.label}
                  </a>
                )
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-3)', marginBottom: 14 }}>Resources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['GitHub', 'API Docs', 'Report a bug'].map((label, i) => (
                <a key={i} href="#" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 80ms ease' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--color-text-1)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-2)'}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto', paddingTop: 20, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>© 2025 CodeReview AI. MIT License.</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Made for developers, by developers.</span>
        </div>
      </footer>

      {/* ===== RESPONSIVE STYLES ===== */}
      <style>{`
        @media (max-width: 767px) {
          .landing-nav-center { display: none !important; }
          .landing-nav-github { display: none !important; }
          .landing-hamburger { display: flex !important; }
          .landing-hero-grid { flex-direction: column !important; text-align: center !important; }
          .landing-hero-text { align-items: center; display: flex; flex-direction: column; }
          .landing-hero-headline { font-size: 36px !important; }
          .landing-hero-demo { justify-content: center !important; }
          .landing-features-grid { grid-template-columns: 1fr !important; }
          .landing-steps-grid { flex-direction: column !important; }
          .landing-step-connector { display: none !important; }
          .landing-languages-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-diff-grid { flex-direction: column !important; }
          .landing-diff-panel { order: -1; }
          .landing-footer-grid { flex-direction: column !important; gap: 32px !important; }
          .landing-stats-grid { flex-wrap: wrap; }
          .landing-stats-grid > div { min-width: 50%; border-right: none !important; padding: 8px 0; }
          .landing-section-title { font-size: 22px !important; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .landing-hamburger { display: none !important; }
          .landing-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-hero-headline { font-size: 44px !important; }
        }
        @media (min-width: 1280px) {
          .landing-hamburger { display: none !important; }
        }
      `}</style>
    </motion.div>
  );
}
