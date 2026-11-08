import { useEffect, useRef } from 'react';
import { podById, skillById } from '../data/resume';
import { NextHomeDemo } from './NextHomeDemo';
import './DescribePanel.css';

export function DescribePanel({ podId, onClose }: { podId: string | null; onClose: () => void }) {
  const pod = podId ? podById(podId) : null;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (pod) ref.current?.focus();
  }, [pod]);

  return (
    <aside
      ref={ref}
      tabIndex={-1}
      className={`panel${pod ? ' open' : ''}`}
      aria-hidden={!pod}
      aria-label={pod ? `Details for ${pod.title}` : undefined}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {pod && (
        <div className="panel-inner" key={pod.id}>
          <div className="panel-head mono">
            <span className="panel-cmd">$ kenny describe pod/{pod.id}</span>
            <button className="btn" onClick={onClose} aria-label="Close details">
              esc ✕
            </button>
          </div>

          <h2 className="panel-title">{pod.title}</h2>
          <div className="panel-org">{pod.org}</div>

          <dl className="kv mono">
            <dt>Namespace:</dt>
            <dd>{pod.namespace}</dd>
            <dt>Status:</dt>
            <dd className={pod.status === 'Running' ? 'run' : 'done'}>
              {pod.status === 'Running' ? '● ' : '✓ '}
              {pod.status}
            </dd>
            <dt>Started:</dt>
            <dd>{pod.start}</dd>
            <dt>{pod.status === 'Running' ? 'Until:' : 'Finished:'}</dt>
            <dd>{pod.end}</dd>
            {pod.location && (
              <>
                <dt>Node:</dt>
                <dd>{pod.location}</dd>
              </>
            )}
            {pod.stack && (
              <>
                <dt>Image:</dt>
                <dd>{pod.stack}</dd>
              </>
            )}
          </dl>

          {pod.metrics.length > 0 && (
            <section>
              <h3 className="mono">Metrics:</h3>
              <div className="metrics">
                {pod.metrics.map((m, i) => (
                  <div className="metric" key={m.key} title={m.hint}>
                    <Gauge fill={m.fill} delay={i * 120} />
                    <div className="metric-val mono">{m.display}</div>
                    <div className="metric-key mono">{m.key}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pod.demo === 'nexthome' && (
            <section>
              <h3 className="mono">Live demo (simulated):</h3>
              <NextHomeDemo />
            </section>
          )}

          <section>
            <h3 className="mono">Events:</h3>
            <ol className="events">
              {pod.events.map((e, i) => (
                <li key={i} style={{ animationDelay: `${150 + i * 90}ms` }}>
                  <span className="ev-type mono">Normal</span>
                  <span>{e}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="mono">Mounts:</h3>
            <div className="chips">
              {pod.skills.map((s) => (
                <span className="chip mono" key={s}>
                  {skillById(s)?.label}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}

function Gauge({ fill, delay }: { fill: number; delay: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r={r} className="g-track" />
      <circle
        cx="32"
        cy="32"
        r={r}
        className="g-fill"
        strokeDasharray={c}
        style={{ ['--off' as string]: c * (1 - fill), ['--c' as string]: c, animationDelay: `${delay}ms` }}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}
