import { useEffect, useState } from 'react';
import { pods, skills } from '../data/resume';
import './Boot.css';

const LINES: { text: string; cls?: string }[] = [
  { text: '$ kubectl apply -f kenny.yaml', cls: 'cmd' },
  { text: 'namespace/experience created' },
  { text: 'namespace/projects created' },
  { text: 'namespace/education created' },
  ...pods.map((p) => ({ text: `pod/${p.id} created` })),
  { text: `service/skills configured (${skills.length} endpoints)` },
  { text: 'node/kenny-le condition met: Ready', cls: 'ok' },
];

export function Boot({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (shown < LINES.length) {
      const t = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 350 : 140);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setLeaving(true), 450);
    return () => window.clearTimeout(t);
  }, [shown]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(onDone, 400);
    return () => window.clearTimeout(t);
  }, [leaving, onDone]);

  useEffect(() => {
    const skip = () => setLeaving(true);
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, []);

  return (
    <div className={`boot${leaving ? ' leaving' : ''}`} onClick={() => setLeaving(true)} role="status" aria-live="polite">
      <div className="boot-log mono">
        {LINES.slice(0, shown).map((l, i) => (
          <div key={i} className={l.cls}>
            {l.text}
          </div>
        ))}
        <span className="boot-cursor">▋</span>
      </div>
      <button className="boot-skip mono" onClick={() => setLeaving(true)}>
        skip ›
      </button>
    </div>
  );
}
