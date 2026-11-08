import { useCallback, useEffect, useRef, useState } from 'react';
import { Boot } from './components/Boot';
import { ClusterMap, type ClusterMapHandle } from './components/ClusterMap/ClusterMap';
import { DescribePanel } from './components/DescribePanel';
import { ListView } from './components/ListView';
import { Terminal } from './components/Terminal/Terminal';
import { profile } from './data/resume';
import { useMediaQuery } from './hooks/useMediaQuery';

type ViewMode = 'map' | 'list';

const store = {
  get: (k: string, s: Storage = localStorage) => {
    try {
      return s.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string, s: Storage = localStorage) => {
    try {
      s.setItem(k, v);
    } catch {
      /* storage unavailable */
    }
  },
};

export default function App() {
  const small = useMediaQuery('(max-width: 767px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [booted, setBooted] = useState(() => reducedMotion || store.get('booted', sessionStorage) === '1');
  const [view, setView] = useState<ViewMode>(() => (store.get('view') as ViewMode) ?? (small ? 'list' : 'map'));
  const [selected, setSelected] = useState<string | null>(null);
  const [termOpen, setTermOpen] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') ?? 'dark');
  const mapRef = useRef<ClusterMapHandle>(null);

  // Small screens always get the list view unless the visitor explicitly picked the map.
  useEffect(() => {
    if (small && !store.get('view')) setView('list');
  }, [small]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    store.set('theme', theme);
  }, [theme]);

  const finishBoot = useCallback(() => {
    store.set('booted', '1', sessionStorage);
    setBooted(true);
  }, []);

  const chooseView = (v: ViewMode) => {
    setView(v);
    store.set('view', v);
    if (v === 'list') setSelected(null);
  };

  const openPod = useCallback(
    (id: string) => {
      if (view === 'map') {
        setSelected(id);
        // Wait a frame so the map has re-rendered with the panel's padding.
        window.setTimeout(() => mapRef.current?.focusPod(id), 30);
        if (window.innerWidth < 900) setTermOpen(false);
      } else {
        const el = document.getElementById(`pod-${id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el?.classList.add('flash');
        window.setTimeout(() => el?.classList.remove('flash'), 1600);
        setTermOpen(false);
      }
    },
    [view],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setTermOpen((o) => !o);
        return;
      }
      const typing = (e.target as HTMLElement).closest('input, textarea');
      if (e.key === 'Escape' && !typing) {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {!booted && <Boot onDone={finishBoot} />}

      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" aria-hidden />
          <span className="brand-name">{profile.name}</span>
          <span className="brand-ctx hide-sm">context: kenny-cluster</span>
        </div>
        <div className="topbar-actions">
          <div className="seg" role="group" aria-label="View mode">
            <button aria-pressed={view === 'map'} onClick={() => chooseView('map')}>
              map
            </button>
            <button aria-pressed={view === 'list'} onClick={() => chooseView('list')}>
              list
            </button>
          </div>
          <button className={`btn${termOpen ? ' active' : ''}`} onClick={() => setTermOpen((o) => !o)} aria-label="Toggle terminal">
            &gt;_ <span className="hide-sm">terminal</span> <kbd className="hide-sm">`</kbd>
          </button>
          <button
            className="btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {view === 'map' ? (
        <>
          <ClusterMap ref={mapRef} selected={selected} onSelect={openPod} panelOpen={!!selected} />
          <DescribePanel podId={selected} onClose={() => setSelected(null)} />
        </>
      ) : (
        <ListView />
      )}

      <Terminal
        open={termOpen}
        besidePanel={view === 'map' && !!selected}
        onClose={() => setTermOpen(false)}
        ctx={{
          openPod,
          setView: chooseView,
          toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
        }}
      />
    </>
  );
}
