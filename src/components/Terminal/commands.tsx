import type { ReactNode } from 'react';
import { pods, skills, profile, podById, categoryLabels, podsUsingSkill, type SkillCategory } from '../../data/resume';

export interface TermCtx {
  openPod: (id: string) => void;
  setView: (v: 'map' | 'list') => void;
  toggleTheme: () => void;
  clear: () => void;
  close: () => void;
}

export type Output = ReactNode[];

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length));

const HELP: [string, string][] = [
  ['whoami', 'who is kenny?'],
  ['kenny get pods', 'list experience, projects & education'],
  ['kenny get skills', 'list skills and where they were used'],
  ['kenny get ns', 'list namespaces'],
  ['kenny describe <pod>', 'open a pod (try: kenny describe nexthomeai)'],
  ['kenny logs', 'career timeline'],
  ['contact', 'ways to reach me'],
  ['resume', 'open my resume (PDF)'],
  ['view map|list', 'switch views'],
  ['theme', 'toggle light/dark'],
  ['clear', 'clear the screen'],
  ['exit', 'close the terminal'],
];

export const COMPLETIONS = [
  ...HELP.map(([c]) => c.replace(/ <pod>| map\|list/, '')),
  ...pods.map((p) => `kenny describe ${p.id}`),
  'view map',
  'view list',
  'sudo hire kenny',
];

const link = (href: string, text: string) => (
  <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
    {text}
  </a>
);

export function run(raw: string, ctx: TermCtx): Output {
  const input = raw.trim().replace(/\s+/g, ' ');
  if (!input) return [];
  // Accept both `kenny ...` and `kubectl ...`.
  const norm = input.replace(/^kubectl /, 'kenny ');
  const [cmd, ...args] = norm.split(' ');

  switch (cmd) {
    case 'help':
    case '?':
      return [
        'Available commands:',
        ...HELP.map(([c, d]) => (
          <span key={c}>
            <span className="t-accent">{pad(c, 24)}</span>
            <span className="t-dim">{d}</span>
          </span>
        )),
        <span className="t-dim">Tab to autocomplete · ↑/↓ for history</span>,
      ];
    case 'whoami':
      return [
        <b>{profile.name}</b>,
        `${profile.title} · ${profile.role}`,
        profile.tagline,
        <span className="t-dim">CGPA 9.40/10 · Dean's Honour List 2024–2026 · {profile.location}</span>,
      ];
    case 'ls':
      return [pods.map((p) => p.id).join('  ')];
    case 'contact':
      return [
        <span>email     {link(`mailto:${profile.email}`, profile.email)}</span>,
        <span>github    {link(profile.github, profile.github.replace('https://', ''))}</span>,
        <span>linkedin  {link(profile.linkedin, profile.linkedin.replace('https://www.', ''))}</span>,
      ];
    case 'resume':
      window.open(profile.resume, '_blank', 'noopener');
      return [<span>Opening {link(profile.resume, 'Kenny_Resume.pdf')} …</span>];
    case 'theme':
      ctx.toggleTheme();
      return ['theme toggled.'];
    case 'view':
      if (args[0] === 'map' || args[0] === 'list') {
        ctx.setView(args[0]);
        return [`switched to ${args[0]} view.`];
      }
      return [<span className="t-err">usage: view map|list</span>];
    case 'clear':
    case 'cls':
      ctx.clear();
      return [];
    case 'exit':
    case 'quit':
      ctx.close();
      return [];
    case 'sudo':
      if (args.join(' ') === 'hire kenny')
        return [
          <span className="t-ok">[sudo] permission granted. Excellent decision.</span>,
          <span>Next step: {link(`mailto:${profile.email}?subject=Let's%20talk`, profile.email)}</span>,
        ];
      return [<span className="t-err">kenny is not in the sudoers file. This incident will be reported.</span>];
    case 'rm':
      return [<span className="t-err">rm: refusing to remove '{args.join(' ') || '/'}': portfolio is immutable</span>];
    case 'kenny':
      return kenny(args, ctx);
    default:
      return [<span className="t-err">command not found: {cmd}. Type 'help'.</span>];
  }
}

function kenny(args: string[], ctx: TermCtx): Output {
  const [verb, ...rest] = args;
  const noun = (rest[0] ?? '').replace(/^pods?\//, '');

  if (verb === 'get') {
    if (['pods', 'pod', 'po', 'all'].includes(rest[0] ?? '')) {
      return [
        <span className="t-dim">{pad('NAME', 15) + pad('NAMESPACE', 13) + pad('STATUS', 12) + 'SINCE'}</span>,
        ...pods.map((p) => (
          <span key={p.id}>
            <button className="t-link" onClick={() => ctx.openPod(p.id)}>
              {p.id}
            </button>
            {' '.repeat(15 - p.id.length) + pad(p.namespace, 13)}
            <span className={p.status === 'Running' ? 't-ok' : 't-dim'}>{pad(p.status, 12)}</span>
            {p.start}
          </span>
        )),
      ];
    }
    if (['skills', 'skill', 'svc', 'services'].includes(rest[0] ?? '')) {
      return (Object.keys(categoryLabels) as SkillCategory[]).flatMap((cat) => [
        <span className="t-accent">{categoryLabels[cat]}</span>,
        ...skills
          .filter((s) => s.category === cat)
          .map((s) => {
            const used = podsUsingSkill(s.id).map((p) => p.id);
            return (
              <span key={s.id}>
                {'  ' + pad(s.label, 16)}
                <span className="t-dim">{used.length ? used.join(', ') : '—'}</span>
              </span>
            );
          }),
      ]);
    }
    if (['ns', 'namespaces', 'namespace'].includes(rest[0] ?? '')) {
      return [
        <span className="t-dim">{pad('NAME', 14) + 'PODS'}</span>,
        ...['experience', 'projects', 'education'].map((n) => pad(n, 14) + pods.filter((p) => p.namespace === n).length),
        pad('skills', 14) + `${skills.length} services`,
      ];
    }
    return [<span className="t-err">usage: kenny get pods|skills|ns</span>];
  }

  if (verb === 'describe') {
    const pod = podById(noun);
    if (!pod)
      return [
        <span className="t-err">
          Error from server (NotFound): pods "{noun || '?'}" not found. Try: {pods.map((p) => p.id).join(', ')}
        </span>,
      ];
    ctx.openPod(pod.id);
    return [
      <span>
        <span className="t-ok">→</span> opened pod/{pod.id}: {pod.title} @ {pod.org}
      </span>,
    ];
  }

  if (verb === 'logs') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const when = (s: string) => {
      const [m, y] = s.split(' ');
      return Number(y) * 12 + months.indexOf(m);
    };
    const sorted = [...pods].sort((a, b) => when(a.start) - when(b.start));
    return sorted.map((p) => (
      <span key={p.id}>
        <span className="t-dim">[{pad(p.start, 8)}]</span> <span className="t-accent">{pad(p.id, 13)}</span> {p.title}
      </span>
    ));
  }

  if (verb === 'delete') {
    return [
      <span className="t-err">
        Error from server (Forbidden): pods "{noun || 'kenny'}" is forbidden: this pod has a PodDisruptionBudget of
        minAvailable=1
      </span>,
    ];
  }

  return [<span className="t-err">unknown subcommand '{verb ?? ''}'. Try: get, describe, logs</span>];
}
