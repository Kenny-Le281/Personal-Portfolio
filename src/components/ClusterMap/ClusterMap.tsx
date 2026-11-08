import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { pods, skills, profile, podById, type Pod } from '../../data/resume';
import {
  WORLD,
  headerRect,
  namespaces,
  podRects,
  skillRects,
  categoryHeaders,
  timelineY,
} from '../../data/layout';
import { usePanZoom } from '../../hooks/usePanZoom';
import './ClusterMap.css';

export interface ClusterMapHandle {
  focusPod: (id: string) => void;
  fit: () => void;
}

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
  panelOpen: boolean;
}

/** Greedy word wrap by approximate character count. */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if ((cur + ' ' + word).trim().length > max && cur) {
      lines.push(cur);
      cur = word;
    } else cur = (cur + ' ' + word).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

const edgePath = (podId: string, skillId: string) => {
  const p = podRects[podId];
  const s = skillRects[skillId];
  const sx = p.x + p.w / 2;
  const sy = p.y + p.h;
  const tx = s.x + s.w / 2;
  const ty = s.y;
  const my = (sy + ty) / 2;
  return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
};

export const ClusterMap = forwardRef<ClusterMapHandle, Props>(function ClusterMap({ selected, onSelect, panelOpen }, ref) {
  const padding = useMemo(() => ({ top: 20, right: panelOpen ? 460 : 20, bottom: 20, left: 20 }), [panelOpen]);
  const pz = usePanZoom(WORLD, padding);
  const [hoverPod, setHoverPod] = useState<string | null>(null);
  const [hoverSkill, setHoverSkill] = useState<string | null>(null);
  const [pinnedSkill, setPinnedSkill] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    focusPod: (id: string) => {
      // Frame the pod together with every skill it uses.
      const rects = [podRects[id], ...(podById(id)?.skills ?? []).map((s) => skillRects[s])].filter(Boolean);
      if (!rects.length) return;
      const x0 = Math.min(...rects.map((r) => r.x)) - 40;
      const y0 = Math.min(...rects.map((r) => r.y)) - 40;
      const x1 = Math.max(...rects.map((r) => r.x + r.w)) + 40;
      const y1 = Math.max(...rects.map((r) => r.y + r.h)) + 40;
      pz.fitRect({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, true, 1.3);
    },
    fit: () => pz.fit(),
  }));

  // What's "lit": hover beats pin beats selection.
  const focusSkill = hoverSkill ?? (hoverPod ? null : pinnedSkill);
  const focusPod = hoverPod ?? (focusSkill ? null : selected);
  const litPods = new Set<string>();
  const litSkills = new Set<string>();
  if (focusPod) {
    litPods.add(focusPod);
    podById(focusPod)?.skills.forEach((s) => litSkills.add(s));
  } else if (focusSkill) {
    litSkills.add(focusSkill);
    pods.filter((p) => p.skills.includes(focusSkill)).forEach((p) => litPods.add(p.id));
  }
  const anyFocus = litPods.size > 0 || litSkills.size > 0;
  const edges = pods.flatMap((p) => p.skills.map((s) => ({ pod: p.id, skill: s, d: edgePath(p.id, s) })));
  const usage = (skillId: string) => pods.filter((p) => p.skills.includes(skillId)).length;

  const click = (fn: () => void) => () => {
    if (!pz.wasDrag()) fn();
  };

  const { view } = pz;

  return (
    <div className="map" ref={pz.ref} {...pz.handlers} onClick={click(() => setPinnedSkill(null))}>
      <svg className="map-svg" width="100%" height="100%" role="img" aria-label="Interactive cluster map of Kenny's experience, projects and skills">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="var(--bg-grid)" strokeWidth="1" />
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transition: pz.animating ? 'transform 0.6s cubic-bezier(.2,.8,.2,1)' : 'none',
          }}
        >
          <rect x={-4000} y={-4000} width={WORLD.w + 8000} height={WORLD.h + 8000} fill="url(#grid)" />

          <IdentityHeader />

          {namespaces.map((ns) => (
            <g key={ns.id} className="ns">
              <rect x={ns.rect.x} y={ns.rect.y} width={ns.rect.w} height={ns.rect.h} rx={18} />
              <text x={ns.rect.x + 20} y={ns.rect.y + 30} className="ns-label">
                {ns.label}
              </text>
              <text x={ns.rect.x + ns.rect.w - 20} y={ns.rect.y + 30} className="ns-meta" textAnchor="end">
                {ns.id === 'skills'
                  ? `${skills.length} services`
                  : `${pods.filter((p) => p.namespace === ns.id).length} pod${pods.filter((p) => p.namespace === ns.id).length > 1 ? 's' : ''}`}
              </text>
            </g>
          ))}

          <Timeline />

          {categoryHeaders.map((c) => (
            <text key={c.label} x={c.x} y={c.y} className="cat-label">
              {c.label}
            </text>
          ))}

          {/* Edges ("services") below everything interactive */}
          <g className="edges">
            {edges.map((e) => {
              const lit = litPods.has(e.pod) && litSkills.has(e.skill);
              return (
                <path key={`${e.pod}-${e.skill}`} d={e.d} className={`edge${lit ? ' lit' : ''}${anyFocus && !lit ? ' dim' : ''}`} />
              );
            })}
            {edges.map((e, i) => {
              const lit = litPods.has(e.pod) && litSkills.has(e.skill);
              if (anyFocus && !lit) return null;
              return (
                // Hidden until its motion begins, otherwise it sits at the origin.
                <circle
                  key={`pk-${e.pod}-${e.skill}-${lit ? 'lit' : 'idle'}`}
                  r={lit ? 3.2 : 2}
                  className={`packet${lit ? ' lit' : ''}`}
                  visibility="hidden"
                >
                  <set attributeName="visibility" to="visible" begin={lit ? '0s' : `${((i * 1.37) % 9).toFixed(2)}s`} />
                  <animateMotion
                    dur={lit ? '1.6s' : `${7 + (i % 5) * 1.7}s`}
                    begin={lit ? '0s' : `${((i * 1.37) % 9).toFixed(2)}s`}
                    repeatCount="indefinite"
                    path={e.d}
                  />
                </circle>
              );
            })}
          </g>

          {pods.map((p) => (
            <PodCard
              key={p.id}
              pod={p}
              lit={litPods.has(p.id)}
              dim={anyFocus && !litPods.has(p.id)}
              selected={selected === p.id}
              onEnter={() => setHoverPod(p.id)}
              onLeave={() => setHoverPod(null)}
              onClick={click(() => onSelect(p.id))}
            />
          ))}

          {skills.map((s) => {
            const r = skillRects[s.id];
            const n = usage(s.id);
            const lit = litSkills.has(s.id);
            return (
              <g
                key={s.id}
                className={`skill${lit ? ' lit' : ''}${anyFocus && !lit ? ' dim' : ''}${pinnedSkill === s.id ? ' pinned' : ''}`}
                tabIndex={0}
                role="button"
                aria-label={`${s.label}: used in ${n} ${n === 1 ? 'role or project' : 'roles or projects'}`}
                aria-pressed={pinnedSkill === s.id}
                onMouseEnter={() => setHoverSkill(s.id)}
                onMouseLeave={() => setHoverSkill(null)}
                onFocus={() => setHoverSkill(s.id)}
                onBlur={() => setHoverSkill(null)}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (!pz.wasDrag()) setPinnedSkill((cur) => (cur === s.id ? null : s.id));
                }}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    setPinnedSkill((cur) => (cur === s.id ? null : s.id));
                  }
                }}
              >
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={r.h / 2} />
                <circle cx={r.x + 15} cy={r.y + r.h / 2} r={3.5} className={n > 0 ? 'used' : 'unused'} />
                <text x={r.x + 25} y={r.y + r.h / 2 + 4.5}>
                  {s.label}
                </text>
                {n > 1 && (
                  <text x={r.x + r.w - 4} y={r.y - 3} className="skill-count" textAnchor="end">
                    ×{n}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="map-controls" onPointerDown={(e) => e.stopPropagation()}>
        <button className="btn" onClick={() => pz.zoomBy(1.25)} aria-label="Zoom in">
          +
        </button>
        <button className="btn" onClick={() => pz.zoomBy(0.8)} aria-label="Zoom out">
          −
        </button>
        <button className="btn" onClick={() => pz.fit()} aria-label="Fit cluster to screen">
          fit
        </button>
      </div>
      <div className="map-hint mono hide-sm">
        drag to pan · scroll to zoom · click a pod · click a skill to pin · <kbd>`</kbd> terminal
      </div>
    </div>
  );
});

function IdentityHeader() {
  const r = headerRect;
  const links = [
    { label: 'github', href: profile.github },
    { label: 'linkedin', href: profile.linkedin },
    { label: 'email', href: `mailto:${profile.email}` },
    { label: 'resume.pdf', href: profile.resume },
  ];
  const labels = ['role=platform-engineer', 'school=uottawa', 'cgpa=9.40', 'location=ottawa'];
  let lx = r.x + r.w - 24;
  return (
    <g className="identity">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={18} className="identity-box" />
      <circle cx={r.x + 30} cy={r.y + 28} r={5} className="identity-dot" />
      <text x={r.x + 44} y={r.y + 32} className="identity-kind">
        node/kenny-le · control-plane · Ready
      </text>
      <text x={r.x + 24} y={r.y + 78} className="identity-name">
        {profile.name}
      </text>
      <text x={r.x + 24} y={r.y + 106} className="identity-tag">
        {profile.tagline}
      </text>
      {/* right-aligned label chips */}
      {[...labels].reverse().map((l) => {
        const w = l.length * 7.3 + 20;
        lx -= w;
        const x = lx;
        lx -= 8;
        return (
          <g key={l} className="identity-label">
            <rect x={x} y={r.y + 16} width={w} height={24} rx={6} />
            <text x={x + 10} y={r.y + 32}>
              {l}
            </text>
          </g>
        );
      })}
      {(() => {
        let x = r.x + r.w - 24;
        return [...links].reverse().map((l) => {
          const w = l.label.length * 8 + 30;
          x -= w;
          const cx = x;
          x -= 10;
          return (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith('http') || l.label.endsWith('.pdf') ? '_blank' : undefined}
              rel="noreferrer"
              className="identity-link"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <rect x={cx} y={r.y + 64} width={w} height={34} rx={9} />
              <text x={cx + w / 2} y={r.y + 86} textAnchor="middle">
                {l.label} ↗
              </text>
            </a>
          );
        });
      })()}
    </g>
  );
}

function Timeline() {
  const exp = pods.filter((p) => p.namespace === 'experience');
  const ns = namespaces.find((n) => n.id === 'experience')!.rect;
  const y = timelineY + 40;
  return (
    <g className="timeline">
      <line x1={ns.x + 30} x2={ns.x + ns.w - 30} y1={y} y2={y} />
      <path d={`M${ns.x + ns.w - 38},${y - 6} L${ns.x + ns.w - 30},${y} L${ns.x + ns.w - 38},${y + 6}`} />
      {exp.map((p) => {
        const r = podRects[p.id];
        const cx = r.x + r.w / 2;
        return (
          <g key={p.id}>
            <circle cx={cx} cy={y} r={5} className={p.status === 'Running' ? 'run' : ''} />
            <text x={cx} y={y + 24} textAnchor="middle">
              {p.start} → {p.end}
            </text>
          </g>
        );
      })}
      <text x={ns.x + 30} y={y - 12} className="timeline-label">
        kubectl rollout history
      </text>
    </g>
  );
}

interface PodCardProps {
  pod: Pod;
  lit: boolean;
  dim: boolean;
  selected: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function PodCard({ pod, lit, dim, selected, onEnter, onLeave, onClick }: PodCardProps) {
  const r = podRects[pod.id];
  const lines = wrap(pod.title, 25).slice(0, 2);
  const running = pod.status === 'Running';
  return (
    <g
      className={`pod${lit ? ' lit' : ''}${dim ? ' dim' : ''}${selected ? ' selected' : ''}`}
      tabIndex={0}
      role="button"
      aria-label={`${pod.title} at ${pod.org}, ${pod.start} to ${pod.end}. Open details.`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {running && <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={12} className="pod-ring" />}
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={12} className="pod-box" />
      <text x={r.x + 14} y={r.y + 22} className="pod-id">
        pod/{pod.id}
      </text>
      <circle cx={r.x + r.w - (running ? 70 : 82)} cy={r.y + 18} r={3.5} className={running ? 'st-run' : 'st-done'} />
      <text x={r.x + r.w - 12} y={r.y + 22} className={`pod-status ${running ? 'run' : 'done'}`} textAnchor="end">
        {pod.status}
      </text>
      <line x1={r.x + 14} x2={r.x + r.w - 14} y1={r.y + 32} y2={r.y + 32} className="pod-sep" />
      {lines.map((l, i) => (
        <text key={i} x={r.x + 14} y={r.y + 52 + i * 17} className="pod-title">
          {l}
        </text>
      ))}
      <text x={r.x + 14} y={r.y + (lines.length > 1 ? 90 : 73)} className="pod-org">
        {pod.org}
      </text>
      <text x={r.x + 14} y={r.y + r.h - 12} className="pod-dates">
        {pod.start} – {pod.end}
      </text>
      <text x={r.x + r.w - 12} y={r.y + r.h - 12} className="pod-open" textAnchor="end">
        describe ›
      </text>
    </g>
  );
}
