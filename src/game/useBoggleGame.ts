import { useCallback, useEffect, useReducer, useState } from 'react';
import { boardForCode, normalizeCode, randomCode } from '../utils/boardCode';
import { playTimerEndSound, unlockAudio } from '../utils/sound';
import { gameReducer, initialState, remainingAt } from './state';

const TICK_MS = 200;

function codeFromHash(): string | null {
  return normalizeCode(decodeURIComponent(window.location.hash.slice(1)));
}

/** Puts the code in the URL so the page link shares the board. */
function setHash(code: string) {
  if (codeFromHash() !== code) window.location.replace(`#${code}`);
}

export function useBoggleGame(durationMs: number) {
  const [state, dispatch] = useReducer(gameReducer, initialState, (init) => {
    const code = codeFromHash();
    return code ? gameReducer(init, { type: 'load', code, letters: boardForCode(code) }) : init;
  });

  // Countdown: derived from a deadline, so it never drifts and survives background tabs
  const [tick, setTick] = useState({ state, ms: 0 });
  useEffect(() => {
    if (state.status !== 'running') return;
    let done = false;
    const update = () => {
      if (done) return;
      const left = remainingAt(state, performance.now());
      // Only re-render when the displayed second changes
      setTick((prev) =>
        prev.state === state && Math.ceil(prev.ms / 1000) === Math.ceil(left / 1000) ? prev : { state, ms: left },
      );
      if (left <= 0) {
        done = true;
        playTimerEndSound();
        dispatch({ type: 'finish' });
      }
    };
    update();
    const interval = window.setInterval(update, TICK_MS);
    return () => {
      done = true;
      window.clearInterval(interval);
    };
  }, [state]);

  const remainingMs =
    state.status === 'running'
      ? tick.state === state
        ? tick.ms
        : remainingAt(state, performance.now()) // first render of a new run, before the first tick
      : state.status === 'idle' || state.status === 'ready'
        ? durationMs
        : state.remainingMs;

  /** Deals the board for `code`, covered until the round starts. */
  const load = useCallback((code: string) => {
    dispatch({ type: 'load', code, letters: boardForCode(code) });
    setHash(code);
  }, []);

  // A board link pasted into this tab (our own hash updates carry the current code and are ignored)
  useEffect(() => {
    const onHashChange = () => {
      const code = codeFromHash();
      if (code) dispatch({ type: 'load', code, letters: boardForCode(code), onlyIfNew: true });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const start = useCallback(() => {
    unlockAudio();
    dispatch({ type: 'start', durationMs, now: performance.now() });
  }, [durationMs]);

  const newRound = useCallback(() => {
    load(randomCode());
    start();
  }, [load, start]);

  const pause = useCallback(() => dispatch({ type: 'pause', now: performance.now() }), []);

  const resume = useCallback(() => {
    unlockAudio();
    dispatch({ type: 'resume', now: performance.now() });
  }, []);

  return { state, remainingMs, load, start, newRound, pause, resume };
}
