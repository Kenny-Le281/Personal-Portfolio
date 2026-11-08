import { useEffect, useRef, useState, type ReactNode } from 'react';
import { run, COMPLETIONS, type TermCtx } from './commands';
import './Terminal.css';

interface Entry {
  id: number;
  cmd?: string;
  out: ReactNode[];
}

const PROMPT = 'visitor@kenny-cluster:~$';

export function Terminal({
  open,
  onClose,
  ctx,
  besidePanel = false,
}: {
  open: boolean;
  besidePanel?: boolean;
  onClose: () => void;
  ctx: Omit<TermCtx, 'clear' | 'close'>;
}) {
  const [entries, setEntries] = useState<Entry[]>([
    { id: 0, out: [<span className="t-dim">Welcome to kenny-cluster. Type <b>help</b> to get started.</span>] },
  ]);
  const [value, setValue] = useState('');
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [entries]);

  const submit = (cmd: string) => {
    let cleared = false;
    const out = run(cmd, {
      ...ctx,
      clear: () => (cleared = true),
      close: onClose,
    });
    if (cmd.trim()) history.current.unshift(cmd);
    hIdx.current = -1;
    setEntries((es) => (cleared ? [] : [...es, { id: nextId.current++, cmd, out }]));
    setValue('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit(value);
    else if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIdx.current < history.current.length - 1) {
        hIdx.current++;
        setValue(history.current[hIdx.current]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx.current > 0) {
        hIdx.current--;
        setValue(history.current[hIdx.current]);
      } else {
        hIdx.current = -1;
        setValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = value.replace(/^kubectl /, 'kenny ');
      const matches = COMPLETIONS.filter((c) => c.startsWith(v) && c !== v);
      if (matches.length === 1) setValue(matches[0] + ' ');
      else if (matches.length > 1) {
        // Complete the common prefix and show options.
        let prefix = matches[0];
        for (const m of matches) while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
        setValue(prefix);
        setEntries((es) => [...es, { id: nextId.current++, cmd: value, out: [matches.join('   ')] }]);
      }
    }
  };

  const suggestions = ['help', 'whoami', 'kenny get pods', 'kenny describe nexthomeai', 'kenny logs', 'sudo hire kenny'];

  return (
    <section className={`term${open ? ' open' : ''}${besidePanel ? ' beside-panel' : ''}`} aria-hidden={!open} aria-label="Terminal">
      <div className="term-bar mono">
        <span className="term-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="term-title">kenny-cluster — zsh</span>
        <button className="btn" onClick={onClose} aria-label="Close terminal">
          ✕
        </button>
      </div>
      <div className="term-body mono" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
        {entries.map((e) => (
          <div key={e.id} className="term-entry">
            {e.cmd !== undefined && (
              <div>
                <span className="t-prompt">{PROMPT}</span> {e.cmd}
              </div>
            )}
            {e.out.map((line, i) => (
              <div key={i} className="t-line">
                {line}
              </div>
            ))}
          </div>
        ))}
        <div className="term-input-row">
          <label htmlFor="term-input" className="t-prompt">
            {PROMPT}
          </label>
          <input
            id="term-input"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            tabIndex={open ? 0 : -1}
          />
        </div>
      </div>
      <div className="term-suggest">
        {suggestions.map((s) => (
          <button key={s} className="mono" onClick={() => submit(s)} tabIndex={open ? 0 : -1}>
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
