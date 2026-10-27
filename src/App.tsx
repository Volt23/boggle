import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dices, Eye, EyeOff, Loader2, RotateCcw, Users, WifiOff } from 'lucide-react';
import { BoggleGrid, type BoardMode } from './components/BoggleGrid';
import { SolutionsList } from './components/SolutionsList';
import { Timer } from './components/Timer';
import { WordChecker } from './components/WordChecker';
import { useDictionary, useSolutions, useStoredNumber, useWakeLock } from './game/hooks';
import { DURATIONS_MIN } from './game/state';
import { useBoggleGame, type Connection } from './game/useBoggleGame';

const CONFIRM_WINDOW_MS = 3000;

interface View {
  roundId: string;
  /** Board shown after the round ended. */
  revealed: boolean;
  /** Solution highlighted on the board. */
  selected: string | null;
  /** Path of the word last checked with the word checker. */
  checked: number[] | null;
}

const freshView = (roundId: string): View => ({ roundId, revealed: false, selected: null, checked: null });

function App() {
  const [durationMin, setDurationMin] = useStoredNumber('boggle.durationMin', 3, (n) => DURATIONS_MIN.includes(n));
  const { state, remainingMs, connection, players, newRound, pause, resume } = useBoggleGame(durationMin * 60_000);
  const { status, letters, roundId } = state;
  const { dictionary, error: dictionaryError, retry: retryDictionary } = useDictionary();
  const solutions = useSolutions(letters, status === 'finished', dictionary);

  // Per-round view state, reset whenever a new round starts
  const [view, setView] = useState(() => freshView(roundId));
  const current = view.roundId === roundId ? view : freshView(roundId);
  const updateView = useCallback(
    (patch: Partial<View>) => setView((v) => ({ ...(v.roundId === roundId ? v : freshView(roundId)), ...patch })),
    [roundId],
  );
  const selectWord = useCallback((selected: string | null) => updateView({ selected, checked: null }), [updateView]);
  const showChecked = useCallback((checked: number[] | null) => updateView({ checked, selected: null }), [updateView]);

  const selectedPath = useMemo(
    () => (current.selected ? solutions?.find((s) => s.word === current.selected)?.path : null) ?? current.checked,
    [current.selected, current.checked, solutions],
  );

  const boardMode: BoardMode =
    status === 'idle'
      ? 'idle'
      : status === 'paused'
        ? 'paused'
        : status === 'finished' && !current.revealed && !selectedPath
          ? 'hidden'
          : 'visible';

  useWakeLock(status === 'running');

  // Starting over mid-round affects everyone, so it takes a second tap
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
    newRound();
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
    };
    // Buttons activate on Space keyup, so swallow that too
    const onKeyUp = (e: KeyboardEvent) => isSpace(e) && e.preventDefault();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [status, pause, resume]);

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
          <ConnectionBadge connection={connection} players={players} />
        </header>

        <Timer
          remainingMs={remainingMs}
          durationMs={state.durationMs}
          status={status}
          onPause={pause}
          onResume={resume}
        />

        <BoggleGrid letters={letters} mode={boardMode} roundId={roundId} path={boardMode === 'visible' ? selectedPath : null} />

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
            {confirming ? <RotateCcw size={20} /> : <Dices size={20} />}
            {confirming ? 'Tap again to reshuffle for everyone' : status === 'idle' ? 'Shuffle & start' : 'New round'}
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
                  key={roundId}
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

        <p className="text-center text-sm text-white/40">
          Write your words on paper, then compare when the timer ends.
          <span className="hidden sm:inline"> Press Space to pause.</span>
        </p>
      </div>
    </div>
  );
}

function ConnectionBadge({ connection, players }: { connection: Connection; players: number }) {
  if (connection === 'live') {
    return (
      <span className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <Users size={14} />
        {players} {players === 1 ? 'player' : 'players'}
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 ring-1 ring-white/10"
      title={connection === 'offline' ? 'Not synced with other players; the game still works on this device' : undefined}
    >
      {connection === 'connecting' ? <Loader2 size={14} className="animate-spin" /> : <WifiOff size={14} />}
      {connection === 'connecting' ? 'Connecting…' : 'Offline'}
    </span>
  );
}

export default App;
