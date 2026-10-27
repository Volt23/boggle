import { memo, useMemo } from 'react';
import type { Solution } from '../utils/BoggleSolver';

interface SolutionsListProps {
  solutions: Solution[];
  selected: string | null;
  onSelect: (word: string | null) => void;
}

export const SolutionsList = memo(function SolutionsList({ solutions, selected, onSelect }: SolutionsListProps) {
  // Solutions arrive sorted longest first, so groups keep that order
  const groups = useMemo(() => {
    const byLength = new Map<number, Solution[]>();
    for (const s of solutions) {
      const group = byLength.get(s.word.length);
      if (group) group.push(s);
      else byLength.set(s.word.length, [s]);
    }
    return [...byLength];
  }, [solutions]);

  if (solutions.length === 0) {
    return <p className="py-6 text-center text-white/60">No words on this board. Unlucky roll!</p>;
  }

  return (
    <div className="space-y-5">
      {groups.map(([length, words]) => (
        <section key={length}>
          <h3 className="mb-2 flex items-baseline justify-between text-sm font-medium text-white/60">
            <span>
              {length} letters <span className="text-white/40">· {words.length}</span>
            </span>
            <span className="text-white/40">
              {words[0].score} {words[0].score === 1 ? 'pt' : 'pts'} each
            </span>
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {words.map(({ word }) => (
              <li key={word}>
                <button
                  type="button"
                  onClick={() => onSelect(word === selected ? null : word)}
                  aria-pressed={word === selected}
                  className={`rounded-lg px-2.5 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                    word === selected
                      ? 'bg-emerald-300 text-emerald-950'
                      : 'bg-white/10 text-white/90 hover:bg-white/20'
                  }`}
                >
                  {word}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
});
