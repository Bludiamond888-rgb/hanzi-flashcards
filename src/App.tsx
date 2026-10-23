import { useEffect, useMemo, useRef, useState } from 'react';
import { BY_CHAR, CHARS, ORDER, matches, plain, short, type Char } from './data';
import { canSpeak, speak } from './speak';
import * as S from './srs';

const KEY = 'hanzi-flashcards-v1';
const load = (): S.State => { try { const r = localStorage.getItem(KEY); return r ? S.validate(JSON.parse(r)) : S.emptyState(); } catch { return S.emptyState(); } };
type Tab = 'review' | 'deck' | 'stats' | 'more';
const TABS: [Tab, string, string][] = [['review', '习', 'Review'], ['deck', '字', 'Deck'], ['stats', '绩', 'Progress'], ['more', '设', 'Settings']];
const GRADES: [S.Grade, string, string][] = [[0, 'Again', 'again'], [1, 'Hard', 'hard'], [2, 'Good', 'good'], [3, 'Easy', 'easy']];
const MODES: [S.Mode, string][] = [['hanzi', '字 → meaning'], ['meaning', 'meaning → 字'], ['pinyin', 'pīnyīn → 字'], ['mixed', 'Mixed']];

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="96 80 340 360" aria-hidden="true">
      <g transform="rotate(-9 256 270)"><rect x="132" y="104" width="232" height="300" rx="18" fill="#1b1a17" /></g>
      <g transform="rotate(6 256 270)">
        <rect x="150" y="118" width="232" height="300" rx="18" fill="#fbf8f1" stroke="#1b1a17" strokeWidth="12" />
        <path d="M196 214C232 206 290 200 338 206c6 1 6 9 0 10-46 6-102 10-140 12-10 0-12-12-2-14Z" fill="#1b1a17" />
        <path d="M262 160c8-2 12 4 11 12l-5 180c-1 14-14 16-16 2l-2-182c0-8 5-11 12-12Z" fill="#1b1a17" />
      </g>
      <g transform="rotate(-6 352 376)">
        <rect x="292" y="316" width="120" height="120" rx="12" fill="#c8372d" />
        <rect x="303" y="327" width="98" height="98" rx="7" fill="none" stroke="#fbefe0" strokeWidth="7" />
        <path d="M328 354h48M352 344v68M332 382h40M334 408h36" stroke="#fbefe0" strokeWidth="10" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export default function App() {
  const [st, setSt] = useState<S.State>(load);
  const [tab, setTab] = useState<Tab>('review');
  const [today, setToday] = useState(S.dayKey());
  const main = useRef<HTMLElement>(null);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(st)); }, [st]);
  useEffect(() => { const f = () => setToday(S.dayKey()); document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f); }, []);
  const go = (t: Tab) => { setTab(t); main.current?.scrollTo(0, 0); window.scrollTo(0, 0); };
  const strk = S.streak(st.log, today);
  const due = S.dueIds(st, today).length, fresh = S.newIds(st, ORDER, today).length;
  return (
    <>
      <header className="top">
        <div className="brand"><Logo /><div><b>Hanzi Flashcards</b><small>汉字卡 · HSK 1</small></div></div>
        <div className={'pill' + (st.log[today] ? ' lit' : '')} title="Day streak"><i className="seal-dot">日</i>{strk}</div>
      </header>
      <main ref={main} className="main">
        {tab === 'review' && <Review st={st} setSt={setSt} today={today} />}
        {tab === 'deck' && <Deck st={st} today={today} />}
        {tab === 'stats' && <Stats st={st} today={today} strk={strk} />}
        {tab === 'more' && <More st={st} setSt={setSt} />}
      </main>
      <nav className="tabs">
        {TABS.map(([k, z, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => go(k)} data-testid={'tab-' + k}>
            <span>{z}</span>{l}{k === 'review' && due + fresh > 0 && <em className="badge">{due + fresh}</em>}
          </button>
        ))}
      </nav>
    </>
  );
}

function modeFor(m: S.Mode, id: string, n: number): Exclude<S.Mode, 'mixed'> {
  if (m !== 'mixed') return m;
  return (['hanzi', 'meaning', 'pinyin'] as const)[(id.charCodeAt(0) + n) % 3];
}

function Review({ st, setSt, today }: { st: S.State; setSt: (s: S.State) => void; today: string }) {
  const [queue, setQueue] = useState<string[] | null>(null);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);
  const due = S.dueIds(st, today), fresh = S.newIds(st, ORDER, today);
  const start = () => { setQueue([...due, ...fresh]); setShown(false); setDone(0); };
  const id = queue?.[0];
  const ch = id ? BY_CHAR[id] : undefined;
  const mode = id ? modeFor(st.settings.mode, id, st.cards[id]?.reps ?? 0) : 'hanzi';
  useEffect(() => { if (ch && st.settings.autoSpeak && (shown ? mode === 'hanzi' || mode === 'meaning' : mode === 'pinyin')) speak(ch.c); }, [id, shown]); // eslint-disable-line
  const grade = (g: S.Grade) => {
    if (!id || !queue) return;
    setSt(S.review(st, id, g, today));
    const rest = queue.slice(1);
    if (g === 0) rest.splice(Math.min(3, rest.length), 0, id);
    setQueue(rest); setShown(false); setDone(d => d + 1);
  };
  if (!queue || !ch) {
    const finished = queue && !ch;
    return (
      <section className="pad">
        <div className="hero card">
          <div className="hero-k">{finished ? '今日毕' : '今日'}</div>
          <h1>{finished ? 'All done for today' : due.length + fresh.length ? 'Ready to review' : 'Nothing due'}</h1>
          <div className="trio">
            <div><b data-testid="due-count">{due.length}</b><small>Due</small></div>
            <div><b>{fresh.length}</b><small>New</small></div>
            <div><b>{st.log[today] ?? 0}</b><small>Reviewed</small></div>
          </div>
          {due.length + fresh.length > 0
            ? <button className="btn big" onClick={start} data-testid="start">{finished ? 'Keep going' : 'Begin review'}</button>
            : <p className="fine">{finished ? `${done} cards reviewed. Come back tomorrow.` : 'Raise new cards per day in Settings to learn more today.'}</p>}
        </div>
        <p className="fine">Cards: {MODES.find(m => m[0] === st.settings.mode)![1]} · {st.settings.newPerDay} new / day</p>
        <UpNext ids={[...due, ...fresh].slice(0, 10)} />
      </section>
    );
  }
  const total = done + queue.length;
  const sp = canSpeak && <button className="say" onClick={() => speak(ch.c)} aria-label="Play pronunciation" data-testid="say">♪</button>;
  return (
    <section className="pad session">
      <div className="prog"><button className="x" onClick={() => setQueue(null)} aria-label="End session">×</button><div className="bar"><i style={{ width: `${(done / total) * 100}%` }} /></div><small>{queue.length} left</small></div>
      <div className={'flash card' + (shown ? ' shown' : '')} data-testid="flash" onClick={() => !shown && setShown(true)}>
        <div className="corner">{!st.cards[id!] ? <em className="new">新 New</em> : <em>{st.cards[id!].reps ? 'Review' : 'Relearn'}</em>}</div>
        {mode === 'hanzi' && <div className="big-han">{ch.c}</div>}
        {mode === 'meaning' && <div className="prompt-m">{short(ch.m)}</div>}
        {mode === 'pinyin' && <div className="prompt-p">{ch.p}{sp}</div>}
        {!shown && <div className="hint">{mode === 'hanzi' ? 'Recall the pīnyīn and meaning' : 'Recall the character'}</div>}
        {shown && (
          <div className="answer" data-testid="answer">
            <div className="rule" />
            {mode !== 'hanzi' && <div className="big-han sm">{ch.c}</div>}
            <div className="py">{ch.p}{mode !== 'pinyin' && sp}</div>
            {mode !== 'meaning' && <div className="mean">{short(ch.m)}</div>}
            {ch.ex !== ch.c && <div className="ex"><b>{[...ch.ex].map((x, i) => <span key={i} className={x === ch.c ? 'hl' : ''}>{x}</span>)}</b><span>{ch.exp}</span><small>{short(ch.exm)}</small></div>}
          </div>
        )}
      </div>
      {!shown
        ? <button className="btn big show" onClick={() => setShown(true)} data-testid="show">Show answer</button>
        : <div className="grades">{GRADES.map(([g, l, c]) => (
            <button key={g} className={'grade ' + c} onClick={() => grade(g)} data-testid={'grade-' + c}><b>{l}</b><small>{S.preview(st.cards[id!], g, today)}</small></button>
          ))}</div>}
    </section>
  );
}

function UpNext({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return <div className="upnext"><h3>Up next</h3><div className="chips">{ids.map(i => <span key={i} className="chip">{i}</span>)}</div></div>;
}

function status(st: S.State, id: string, today: string): ['new' | 'due' | 'learning' | 'known', string] {
  const c = st.cards[id];
  if (!c) return ['new', 'New'];
  if (c.due <= today) return ['due', 'Due'];
  if (c.ivl >= 21) return ['known', `${c.ivl}d`];
  return ['learning', `in ${Math.round((Date.parse(c.due) - Date.parse(today)) / 864e5)}d`];
}

function Deck({ st, today }: { st: S.State; today: string }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState<'all' | 'new' | 'due' | 'learning' | 'known'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => {
    const t = plain(q.trim()).replace(/\s/g, '');
    const rank = (c: Char) => !t ? 0 : c.c === q.trim() ? -2 : plain(c.p).replace(/\s/g, '').startsWith(t) ? -1 : 0;
    return CHARS.filter(c => matches(c, q) && (f === 'all' || status(st, c.c, today)[0] === f)).sort((a, b) => rank(a) - rank(b));
  }, [q, f, st, today]);
  return (
    <section className="pad">
      <input className="search" placeholder="Search 字, pinyin (ni / nǐ) or meaning" value={q} onChange={e => setQ(e.target.value)} data-testid="search" type="search" />
      <div className="seg small">{(['all', 'new', 'due', 'learning', 'known'] as const).map(k => <button key={k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{k === 'known' ? 'Mature' : k[0].toUpperCase() + k.slice(1)}</button>)}</div>
      <p className="fine left">{list.length} of {CHARS.length} characters</p>
      <ul className="deck">
        {list.map(c => { const [k, l] = status(st, c.c, today); return (
          <li key={c.c} className={open === c.c ? 'open' : ''}>
            <button className="row-btn" onClick={() => setOpen(open === c.c ? null : c.c)}>
              <span className="tile">{c.c}</span>
              <span className="meta"><b>{c.p}</b><small>{short(c.m)}</small></span>
              <span className={'st ' + k}>{l}</span>
            </button>
            {open === c.c && <Detail c={c} />}
          </li>); })}
      </ul>
    </section>
  );
}
function Detail({ c }: { c: Char }) {
  return (
    <div className="detail">
      {short(c.m) !== c.m && <p>{c.m}</p>}
      {c.ex !== c.c && <p className="ex-line"><b>{c.ex}</b> {c.exp} — {short(c.exm)}</p>}
      <div className="row">{canSpeak && <button className="btn ghost small" onClick={() => speak(c.ex !== c.c ? `${c.c}，${c.ex}` : c.c)}>♪ Listen</button>}
        <span className="fine">{c.n} strokes</span></div>
    </div>
  );
}

function Stats({ st, today, strk }: { st: S.State; today: string; strk: number }) {
  const cards = Object.values(st.cards);
  const learned = cards.filter(c => c.reps > 0).length, mature = cards.filter(c => c.ivl >= 21).length;
  const due = S.dueIds(st, today).length;
  const total = Object.values(st.log).reduce((a, b) => a + b, 0);
  const weeks = 15, [yy, mm, dd] = today.split('-').map(Number), dow = (new Date(yy, mm - 1, dd).getDay() + 6) % 7;
  const start = S.addDays(today, -(weeks - 1) * 7 - dow);
  const days = Array.from({ length: weeks * 7 }, (_, i) => S.addDays(start, i));
  const max = Math.max(1, ...days.map(d => st.log[d] ?? 0));
  const tomorrow = Object.values(st.cards).filter(c => c.due === S.addDays(today, 1)).length;
  const N = CHARS.length;
  return (
    <section className="pad">
      <div className="grid4">
        <Stat k="Due today" v={due} z="今" /><Stat k="Learned" v={learned} z="学" sub={`of ${N}`} />
        <Stat k="Day streak" v={strk} z="日" red /><Stat k="Mature" v={mature} z="熟" sub="21d+" />
      </div>
      <div className="card">
        <h3>Deck</h3>
        <div className="stack"><i className="k" style={{ width: `${mature / N * 100}%` }} /><i className="l" style={{ width: `${(learned - mature) / N * 100}%` }} /></div>
        <div className="legend"><span><i className="k" />Mature {mature}</span><span><i className="l" />Learning {learned - mature}</span><span><i />Unseen {N - cards.length}</span></div>
      </div>
      <div className="card">
        <h3>Reviews <small>{total} total · {st.log[today] ?? 0} today · {tomorrow} due tomorrow</small></h3>
        <div className="heat" data-testid="heat">{days.map(d => { const n = st.log[d] ?? 0; return <i key={d} title={`${d}: ${n}`} className={d === today ? 'today' : ''} style={{ opacity: d > today ? 0 : 1, background: n ? `rgba(27,26,23,${0.25 + 0.75 * n / max})` : undefined }} />; })}</div>
      </div>
    </section>
  );
}
const Stat = ({ k, v, z, sub, red }: { k: string; v: number; z: string; sub?: string; red?: boolean }) =>
  <div className={'stat card' + (red ? ' red' : '')}><span className="z">{z}</span><b>{v}</b><small>{k}{sub && <em> {sub}</em>}</small></div>;

function More({ st, setSt }: { st: S.State; setSt: (s: S.State) => void }) {
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const set = (p: Partial<S.Settings>) => setSt({ ...st, settings: { ...st.settings, ...p } });
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hanzi-flashcards-${S.dayKey()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); setMsg('Backup saved.');
  };
  const importJson = async (f?: File) => {
    if (!f) return;
    try { const s = S.validate(JSON.parse(await f.text())); if (confirm(`Replace current progress with this backup (${Object.keys(s.cards).length} cards)?`)) { setSt(s); setMsg('Backup restored.'); } }
    catch (e) { setMsg((e as Error).message || 'Could not read that file.'); }
    if (file.current) file.current.value = '';
  };
  return (
    <section className="pad">
      <div className="card">
        <h3>New cards per day</h3>
        <div className="stepper"><button onClick={() => set({ newPerDay: Math.max(0, st.settings.newPerDay - 5) })} aria-label="Fewer">−</button><b data-testid="npd">{st.settings.newPerDay}</b><button onClick={() => set({ newPerDay: Math.min(50, st.settings.newPerDay + 5) })} aria-label="More">+</button></div>
        <p className="fine left">178 characters ÷ {st.settings.newPerDay || '—'} a day ≈ {st.settings.newPerDay ? Math.ceil(178 / st.settings.newPerDay) : '∞'} days to see them all.</p>
      </div>
      <div className="card">
        <h3>Card direction</h3>
        <div className="seg col2">{MODES.map(([m, l]) => <button key={m} className={st.settings.mode === m ? 'on' : ''} onClick={() => set({ mode: m })}>{l}</button>)}</div>
      </div>
      <div className="card">
        <h3>Pronunciation</h3>
        <label className="toggle"><span>Play audio automatically</span><input type="checkbox" checked={st.settings.autoSpeak} disabled={!canSpeak} onChange={e => set({ autoSpeak: e.target.checked })} /></label>
        <p className="fine left">{canSpeak ? 'Uses your device’s Chinese (zh-CN) voice. On iPhone, add one in Settings › Accessibility › Spoken Content › Voices if it sounds wrong.' : 'Speech is not available in this browser.'}</p>
      </div>
      <div className="card">
        <h3>Backup</h3>
        <p className="fine left">Progress lives only on this device. Save a backup now and then.</p>
        <div className="row"><button className="btn small" onClick={exportJson}>Save backup</button><button className="btn ghost small" onClick={() => file.current?.click()}>Restore…</button></div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => importJson(e.target.files?.[0])} />
        {msg && <p className="fine left ok">{msg}</p>}
        <button className="link danger" onClick={() => { if (confirm('Erase all flashcard progress on this device?')) { setSt({ ...S.emptyState(), settings: st.settings }); setMsg('Progress reset.'); } }}>Reset progress</button>
      </div>
      <div className="card about">
        <Logo size={44} />
        <div><b>Hanzi Flashcards</b><p>Companion to <a href="https://bludiamond888-rgb.github.io/hanzi-path/" target="_blank" rel="noreferrer">Hanzi Path</a> — practise writing there, remember here. Same 178 HSK 1 characters. Scheduling uses SM-2.</p><small>v1.0.0</small></div>
      </div>
    </section>
  );
}
