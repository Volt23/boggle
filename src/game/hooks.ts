import { useEffect, useMemo, useState } from 'react';
import { findWordsInBoggle, type Solution, type Trie } from '../utils/BoggleSolver';
import { loadDictionary } from '../utils/dictionary';

/** The dictionary, loaded in the background so results are instant when a round ends. */
export function useDictionary() {
  const [dictionary, setDictionary] = useState<Trie | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    loadDictionary().then(
      (trie) => active && setDictionary(trie),
      (err) => {
        console.error('Could not load the dictionary:', err);
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  return { dictionary, error, retry: () => setAttempt((n) => n + 1) };
}

export function useSolutions(letters: string[], enabled: boolean, dictionary: Trie | null): Solution[] | null {
  // Solving takes well under a millisecond once the dictionary is loaded
  return useMemo(
    () => (enabled && dictionary ? findWordsInBoggle(letters, dictionary) : null),
    [enabled, dictionary, letters],
  );
}

/** Keeps the screen on (where supported) while `active`. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let released = false;
    const request = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock.request('screen').then(
        (sentinel) => {
          if (released) sentinel.release().catch(() => {});
          else lock = sentinel;
        },
        () => {}, // denied, e.g. battery saver
      );
    };
    request();
    // The lock is dropped whenever the page is hidden
    document.addEventListener('visibilitychange', request);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', request);
      lock?.release().catch(() => {});
    };
  }, [active]);
}

export function useStoredNumber(key: string, fallback: number, isValid: (n: number) => boolean) {
  const [value, setValue] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(key));
      return isValid(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Storage unavailable (private mode): keep the value for this visit only
    }
  }, [key, value]);

  return [value, setValue] as const;
}
