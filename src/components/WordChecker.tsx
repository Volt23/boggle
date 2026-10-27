import { useState } from 'react';
import { CheckCircle2, HelpCircle, Search, XCircle } from 'lucide-react';
import { MIN_WORD_LENGTH, scoreWord } from '../utils/boggleLogic';
import { findPath, type Trie } from '../utils/BoggleSolver';

interface WordCheckerProps {
  letters: string[];
  dictionary: Trie;
  /** Highlights the word's path on the board (null clears it). */
  onHighlight: (path: number[] | null) => void;
}

type Verdict =
  | { kind: 'valid'; word: string; score: number }
  | { kind: 'unknown'; word: string }
  | { kind: 'short'; word: string }
  | { kind: 'absent'; word: string };

/** Lets players check the words they wrote on paper. */
export function WordChecker({ letters, dictionary, onHighlight }: WordCheckerProps) {
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const word = input.trim().toLowerCase();
    if (!word) return;
    const path = /^[a-z]+$/.test(word) ? findPath(letters, word) : null;
    onHighlight(path);
    if (!path) setVerdict({ kind: 'absent', word });
    else if (word.length < MIN_WORD_LENGTH) setVerdict({ kind: 'short', word });
    else if (!dictionary.has(word)) setVerdict({ kind: 'unknown', word });
    else setVerdict({ kind: 'valid', word, score: scoreWord(word) });
  };

  return (
    <div>
      <form onSubmit={check} className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Check a word</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (verdict) setVerdict(null);
            }}
            placeholder="Check a word from your list…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="w-full rounded-xl bg-white/10 py-2.5 pl-10 pr-3 text-white placeholder:text-white/40 ring-1 ring-white/10 transition focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-white/10 px-4 font-medium text-white ring-1 ring-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Check
        </button>
      </form>

      {verdict && (
        <p className="mt-2 flex items-center gap-2 text-sm" role="status">
          {verdict.kind === 'valid' ? (
            <>
              <CheckCircle2 size={18} className="shrink-0 text-emerald-300" />
              <span>
                <strong className="text-white">{verdict.word}</strong>{' '}
                <span className="text-white/70">
                  is valid: {verdict.score} {verdict.score === 1 ? 'point' : 'points'}
                </span>
              </span>
            </>
          ) : verdict.kind === 'unknown' ? (
            <>
              <HelpCircle size={18} className="shrink-0 text-amber-300" />
              <span className="text-white/70">
                <strong className="text-white">{verdict.word}</strong> is on the board but not in the dictionary
              </span>
            </>
          ) : (
            <>
              <XCircle size={18} className="shrink-0 text-rose-400" />
              <span className="text-white/70">
                <strong className="text-white">{verdict.word}</strong>{' '}
                {verdict.kind === 'short' ? `is shorter than ${MIN_WORD_LENGTH} letters` : "can't be made on this board"}
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
}
