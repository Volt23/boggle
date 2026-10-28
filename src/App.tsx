import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dices, Eye, EyeOff, Loader2, Play, RotateCcw } from 'lucide-react';
import { BoggleGrid, type BoardMode } from './components/BoggleGrid';
import { PlayTogether } from './components/PlayTogether';
import { SolutionsList } from './components/SolutionsList';
import { Timer } from './components/Timer';
import { WordChecker } from './components/WordChecker';
import { useDictionary, useSolutions, useStoredNumber, useWakeLock } from './game/hooks';
import { DURATIONS_MIN } from './game/state';
import { useBoggleGame } from './game/useBoggleGame';

const CONFIRM_WINDOW_MS = 3000;

interface View {
  code: string;
  /** Board shown after the round ended. */
  revealed: boolean;
  /** Solution highlighted on the board. */
  selected: string | null;
  /** Path of the word last checked with the word checker. */
  checked: number[] | null;
}

const freshView = (code: string): View => ({ code, revealed: false, selected: null, checked: null });

function App() {
  const [durationMin, setDurationMin] = useStoredNumber('boggle.durationMin', 3, (n) => DURATIONS_MIN.includes(n));
  const { state, remainingMs, load, start, newRound, pause, resume } = useBoggleGame(durationMin * 60_000);
  const { status, letters, code } = state;
  const { dictionary, error: dictionaryError, retry: retryDictionary } = useDictionary();
  const solutions = useSolutions(letters, status === 'finished', dictionary);

  // Per-board view state, reset whenever the board changes
  const [view, setView] = useState(() => freshView(code));
  const current = view.code === code ? view : freshView(code);
  const updateView = useCallback(
    (patch: Partial<View>) => setView((v) => ({ ...(v.code === code ? v : freshView(code)), ...patch })),
    [code],
  );
  const selectWord = useCallback((selected: string | null) => updateView({ selected, checked: null }), [updateView]);
  const showChecked = useCallback((checked: number[] | null) => updateView({ checked, selected: null }), [updateView]);

  const selectedPath = useMemo(
    () => (current.selected ? solutions?.find((s) => s.word === current.selected)?.path : null) ?? current.checked,
    [current.selected, current.checked, solutions],
  );

  const boardMode: BoardMode =
    status === 'idle' || status === 'ready'
      ? status
      : status === 'paused'
        ? 'paused'
        : status === 'finished' && !current.revealed && !selectedPath
          ? 'hidden'
          : 'visible';

  useWakeLock(status === 'running');

  // Starting over mid-round throws the round away, so it takes a second tap
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<number>();
  const handleNewRound = () => {
    if (status === 'running' && !confirming) {
      setConfirming(true);
      confirmTimer.current = window.setTimeout(() => setConfirming(false), CONFIRM_WINDOW_MS);
      return;
    }
    window.clearTimeout(confirmTimer.current);
    setConfirming(false);
    if (status === 'ready') start();
    else newRound();
  };
  useEffect(() => () => window.clearTimeout(confirmTimer.current), []);

  // Space toggles the timer anywhere but in text fields (overriding a focused button's own Space)
  useEffect(() => {
    const isSpace = (e: KeyboardEvent) =>
      e.code === 'Space' && !(e.target as HTMLElement).closest('input, textarea, select, [contenteditable]');
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isSpace(e)) return;
      e.preventDefault();
      if (e.repeat) return;
      if (status === 'running') pause();
      else if (status === 'paused') resume();
      else if (status === 'ready') start();
    };
    // Buttons activate on Space keyup, so swallow that too
    const onKeyUp = (e: KeyboardEvent) => isSpace(e) && e.preventDefault();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [status, pause, resume, start]);

  const totalScore = useMemo(() => solutions?.reduce((sum, s) => sum + s.score, 0) ?? 0, [solutions]);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_60%)] text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-12 pt-6 sm:pt-10">
        <header className="flex items-center justify-between">
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-slate-900 shadow-lg shadow-amber-300/20">
              <Dices size={24} />
            </span>
            Boggle
          </h1>
          {code && (
            <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 ring-1 ring-white/10">
              Board <span className="font-mono text-sm font-semibold tracking-widest text-white">{code}</span>
            </span>
          )}
        </header>

        <Timer
          remainingMs={remainingMs}
          durationMs={status === 'idle' || status === 'ready' ? durationMin * 60_000 : state.durationMs}
          status={status}
          onPause={pause}
          onResume={status === 'ready' ? start : resume}
        />

        <BoggleGrid letters={letters} mode={boardMode} code={code} path={boardMode === 'visible' ? selectedPath : null} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleNewRound}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-semibold shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.98] ${
              confirming
                ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-400'
                : 'bg-amber-300 text-slate-900 shadow-amber-300/20 hover:bg-amber-200'
            }`}
          >
            {confirming ? <RotateCcw size={20} /> : status === 'ready' ? <Play size={20} /> : <Dices size={20} />}
            {confirming
              ? 'Tap again to start over'
              : status === 'idle'
                ? 'Shuffle & start'
                : status === 'ready'
                  ? 'Start round'
                  : 'New round'}
          </button>

          <div className="flex items-center justify-center gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10" role="radiogroup" aria-label="Round length">
            {DURATIONS_MIN.map((min) => (
              <button
                key={min}
                type="button"
                role="radio"
                aria-checked={min === durationMin}
                onClick={() => setDurationMin(min)}
                title={`${min}-minute rounds`}
                className={`h-10 min-w-10 rounded-xl px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                  min === durationMin ? 'bg-white text-slate-900' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
        </div>

        {status === 'finished' && (
          <section className="space-y-5 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-6" aria-labelledby="results-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="results-title" className="font-display text-2xl font-semibold">
                  Time&rsquo;s up!
                </h2>
                <p className="text-sm text-white/60">
                  {solutions
                    ? `${solutions.length} words to find · ${totalScore} points possible`
                    : 'Compare your lists while we find every word…'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateView({ revealed: boardMode === 'hidden', selected: null, checked: null })}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {boardMode === 'hidden' ? <Eye size={18} /> : <EyeOff size={18} />}
                {boardMode === 'hidden' ? 'Show board' : 'Hide board'}
              </button>
            </div>

            {dictionaryError ? (
              <p className="text-sm text-rose-300">
                Couldn&rsquo;t load the dictionary.{' '}
                <button type="button" onClick={retryDictionary} className="font-semibold underline underline-offset-2">
                  Try again
                </button>
              </p>
            ) : dictionary && solutions ? (
              <>
                <WordChecker
                  key={code}
                  letters={letters}
                  dictionary={dictionary}
                  onHighlight={showChecked}
                />
                <SolutionsList
                  solutions={solutions}
                  selected={current.selected}
                  onSelect={selectWord}
                />
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Loader2 size={16} className="animate-spin" /> Loading dictionary…
              </div>
            )}
          </section>
        )}

        {status !== 'running' && status !== 'paused' && <PlayTogether code={code} onJoin={load} />}

        <p className="text-center text-sm text-white/40">
          Write your words on paper, then compare when the timer ends.
          <span className="hidden sm:inline"> Press Space to pause.</span>
        </p>
      </div>
    </div>
  );
}

export default App;
