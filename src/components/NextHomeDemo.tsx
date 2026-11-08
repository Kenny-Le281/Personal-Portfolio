import { useEffect, useRef, useState } from 'react';

interface Scenario {
  query: string;
  intent: string;
  tool: string;
  firstTry?: string;
  error?: string;
  filters: Record<string, unknown>;
  results: { title: string; meta: string; price: string }[];
}

// Simulated walkthrough of the NextHomeAI pipeline. Listings are illustrative samples, not real data.
const SCENARIOS: Scenario[] = [
  {
    query: '3 bed condo in Ottawa under 600k near a park',
    intent: 'property_search',
    tool: 'search_listings',
    filters: { city: 'Ottawa', property_type: 'condo', min_bedrooms: 3, max_price: 600000, nearby: ['park'] },
    results: [
      { title: 'Westboro · 3 bd condo', meta: '2 ba · 1,180 sqft · 4 min to park', price: '$589,000' },
      { title: 'Centretown · 3 bd condo', meta: '2 ba · 1,050 sqft · 2 min to park', price: '$559,900' },
    ],
  },
  {
    query: 'something cheap close to uOttawa',
    intent: 'property_search',
    tool: 'search_listings',
    firstTry: '{ "near": "uOttawa", "max_price": "cheap" }',
    error: 'max_price: expected number, got string → re-prompting with schema',
    filters: { near: 'University of Ottawa', radius_km: 2, sort: 'price_asc' },
    results: [
      { title: 'Sandy Hill · 1 bd apt', meta: '1 ba · 520 sqft · 0.6 km', price: '$329,000' },
      { title: 'Lowertown · studio', meta: '1 ba · 410 sqft · 1.4 km', price: '$289,500' },
    ],
  },
  {
    query: 'what does a 20% down payment mean?',
    intent: 'general_question',
    tool: 'answer_with_llm',
    filters: {},
    results: [],
  },
];

type Step = 'idle' | 'typing' | 'intent' | 'first' | 'json' | 'valid' | 'results';
const ORDER: Step[] = ['typing', 'intent', 'first', 'json', 'valid', 'results'];

export function NextHomeDemo() {
  const [sel, setSel] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [typed, setTyped] = useState('');
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const run = (i: number) => {
    clear();
    const sc = SCENARIOS[i];
    setSel(i);
    setTyped('');
    setStep('typing');
    let t = 0;
    for (let c = 1; c <= sc.query.length; c++) {
      t += 22;
      timers.current.push(window.setTimeout(() => setTyped(sc.query.slice(0, c)), t));
    }
    const steps = ORDER.slice(1).filter((s) => s !== 'first' || sc.firstTry);
    steps.forEach((s) => {
      t += s === 'first' ? 500 : 650;
      timers.current.push(window.setTimeout(() => setStep(s), t));
    });
  };

  const sc = sel !== null ? SCENARIOS[sel] : null;
  const reached = (s: Step) => ORDER.indexOf(step) >= ORDER.indexOf(s);
  const isSearch = sc && Object.keys(sc.filters).length > 0;

  return (
    <div className="nh">
      <div className="nh-presets">
        {SCENARIOS.map((s, i) => (
          <button key={i} className={`nh-preset${sel === i ? ' active' : ''}`} onClick={() => run(i)}>
            “{s.query}”
          </button>
        ))}
      </div>

      {!sc && <div className="nh-empty mono">↑ pick a query to watch the pipeline run</div>}

      {sc && (
        <div className="nh-flow mono" aria-live="polite">
          <div className="nh-user">
            <span className="nh-tag">user</span> {typed}
            {step === 'typing' && <span className="boot-cursor">▋</span>}
          </div>
          {reached('intent') && (
            <div className="nh-line">
              <span className="nh-tag">llama3.1</span> intent=<b>{sc.intent}</b> → route to <b>{sc.tool}()</b>
            </div>
          )}
          {sc.firstTry && reached('first') && (
            <>
              <pre className="nh-json bad">{sc.firstTry}</pre>
              <div className="nh-line err">✗ {sc.error}</div>
            </>
          )}
          {reached('json') && isSearch && <pre className="nh-json">{JSON.stringify(sc.filters, null, 2)}</pre>}
          {reached('valid') && (
            <div className="nh-line ok">
              {isSearch ? '✓ schema valid → SELECT … FROM listings WHERE …' : '✓ no filters needed → answering directly'}
            </div>
          )}
          {reached('results') &&
            (sc.results.length > 0 ? (
              <div className="nh-results">
                {sc.results.map((r) => (
                  <div className="nh-card" key={r.title}>
                    <div className="nh-card-title">{r.title}</div>
                    <div className="nh-card-meta">{r.meta}</div>
                    <div className="nh-card-price">{r.price}</div>
                  </div>
                ))}
                <div className="nh-note">sample listings for illustration</div>
              </div>
            ) : (
              <div className="nh-line">
                <span className="nh-tag">bot</span> It means you pay 20% of the price upfront; in Canada that also avoids mortgage
                default insurance.
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
