import { useState } from 'react';
import { pods, skills, profile, categoryLabels, skillById, podsUsingSkill, type SkillCategory, type Pod } from '../data/resume';
import { NextHomeDemo } from './NextHomeDemo';
import './ListView.css';

export function ListView() {
  const experience = pods.filter((p) => p.namespace === 'experience');
  const projects = pods.filter((p) => p.namespace === 'projects');
  const education = pods.filter((p) => p.namespace === 'education');
  const [skill, setSkill] = useState<string | null>(null);
  const usedBy = skill ? new Set(podsUsingSkill(skill).map((p) => p.id)) : null;

  return (
    <main className="list">
      <header className="lv-hero">
        <div className="lv-kind mono">
          <span className="brand-dot" /> node/kenny-le · Ready
        </div>
        <h1>{profile.name}</h1>
        <p className="lv-sub">
          {profile.title} · {profile.role}
        </p>
        <p className="lv-tag">{profile.tagline}</p>
        <div className="lv-links">
          <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
            github ↗
          </a>
          <a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer">
            linkedin ↗
          </a>
          <a className="btn" href={`mailto:${profile.email}`}>
            email ↗
          </a>
          <a className="btn active" href={profile.resume} target="_blank" rel="noreferrer">
            resume.pdf ↗
          </a>
        </div>
      </header>

      <Section title="experience" count={experience.length}>
        <ol className="lv-timeline">
          {experience.map((p) => (
            <Card key={p.id} pod={p} faded={!!usedBy && !usedBy.has(p.id)} />
          ))}
        </ol>
      </Section>

      <Section title="projects" count={projects.length}>
        <ul className="lv-plain">
          {projects.map((p) => (
            <Card key={p.id} pod={p} faded={!!usedBy && !usedBy.has(p.id)} />
          ))}
        </ul>
      </Section>

      <Section title="education" count={education.length}>
        <ul className="lv-plain">
          {education.map((p) => (
            <Card key={p.id} pod={p} faded={!!usedBy && !usedBy.has(p.id)} />
          ))}
        </ul>
      </Section>

      <Section title="skills" count={skills.length}>
        <p className="lv-hint">Tap a skill to highlight where it was used.</p>
        {(Object.keys(categoryLabels) as SkillCategory[]).map((cat) => (
          <div key={cat} className="lv-skillgroup">
            <h3 className="mono">{categoryLabels[cat]}</h3>
            <div className="chips">
              {skills
                .filter((s) => s.category === cat)
                .map((s) => (
                  <button
                    key={s.id}
                    className={`chip mono${skill === s.id ? ' on' : ''}`}
                    aria-pressed={skill === s.id}
                    onClick={() => setSkill((c) => (c === s.id ? null : s.id))}
                  >
                    {s.label}
                    {podsUsingSkill(s.id).length > 0 && <span className="chip-n">×{podsUsingSkill(s.id).length}</span>}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </Section>

      <footer className="lv-foot mono">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </footer>
    </main>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="lv-section">
      <h2 className="mono">
        ns/{title} <span>{count}</span>
      </h2>
      {children}
    </section>
  );
}

function Card({ pod, faded }: { pod: Pod; faded: boolean }) {
  const running = pod.status === 'Running';
  return (
    <li id={`pod-${pod.id}`} className={`lv-card${faded ? ' faded' : ''}${running ? ' running' : ''}`}>
      <div className="lv-card-top mono">
        <span className="lv-id">pod/{pod.id}</span>
        <span className={running ? 'run' : 'done'}>
          {running ? '● ' : '✓ '}
          {pod.status}
        </span>
      </div>
      <h3>{pod.title}</h3>
      <div className="lv-meta">
        {pod.org}
        {pod.location ? ` · ${pod.location}` : ''} · <span className="mono">{pod.start} – {pod.end}</span>
      </div>
      {pod.metrics.length > 0 && (
        <div className="lv-metrics">
          {pod.metrics.map((m) => (
            <span key={m.key} className="mono">
              <b>{m.display}</b> {m.key}
            </span>
          ))}
        </div>
      )}
      <ul>
        {pod.events.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
      {pod.demo === 'nexthome' && (
        <details className="lv-demo">
          <summary className="mono">try the pipeline demo</summary>
          <NextHomeDemo />
        </details>
      )}
      <div className="chips">
        {pod.skills.map((s) => (
          <span className="chip mono" key={s}>
            {skillById(s)?.label}
          </span>
        ))}
      </div>
    </li>
  );
}
