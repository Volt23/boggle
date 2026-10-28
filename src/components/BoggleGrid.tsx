import { memo } from 'react';
import { Hourglass, Pause, Sparkles } from 'lucide-react';
import { GRID_SIZE } from '../utils/boggleLogic';

export type BoardMode = 'idle' | 'ready' | 'visible' | 'paused' | 'hidden';

interface BoggleGridProps {
  letters: string[];
  mode: BoardMode;
  /** Board code; a new code re-runs the roll animation. */
  code: string;
  /** Cells to highlight, in order. */
  path?: number[] | null;
}

export const BoggleGrid = memo(function BoggleGrid({ letters, mode, code, path }: BoggleGridProps) {
  const showLetters = mode === 'visible' || mode === 'paused';
  const order = new Map(path?.map((cell, i) => [cell, i]));

  return (
    <div className="relative mx-auto w-full max-w-[26rem]">
      <div
        className="relative grid grid-cols-4 gap-2.5 rounded-3xl bg-gradient-to-b from-indigo-900 to-indigo-950 p-3 shadow-2xl shadow-black/40 ring-1 ring-white/10"
        role="grid"
        aria-label={showLetters ? `Board: ${letters.join(' ')}` : 'Board hidden'}
      >
        {letters.map((letter, i) => {
          const step = order.get(i);
          const highlighted = step !== undefined && mode === 'visible';
          return (
            <div
              key={`${code}-${showLetters}-${i}`} // roll in whenever the letters appear
              role="gridcell"
              style={{ animationDelay: `${i * 25}ms` }}
              className={`relative flex aspect-square select-none items-center justify-center rounded-2xl font-display font-semibold leading-none transition-[background-color,color,box-shadow,transform] duration-200 motion-safe:animate-roll ${
                !showLetters
                  ? 'bg-indigo-800/70 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)]'
                  : highlighted
                    ? 'scale-[1.04] bg-gradient-to-b from-emerald-200 to-emerald-300 text-emerald-950 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15),0_6px_14px_rgba(16,185,129,0.35)]'
                    : 'bg-gradient-to-b from-amber-50 to-amber-100 text-slate-800 shadow-[inset_0_-4px_0_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.3)]'
              }`}
            >
              {showLetters && (
                <span
                  className={`text-[clamp(1.75rem,10vw,3.25rem)] transition-[filter,opacity] duration-300 ${
                    mode === 'paused' ? 'opacity-60 blur-md' : ''
                  }`}
                >
                  {letter === 'Qu' ? (
                    <>
                      Q<span className="text-[0.6em]">u</span>
                    </>
                  ) : (
                    letter
                  )}
                </span>
              )}
              {highlighted && (
                <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 font-sans text-[0.65rem] font-bold text-white">
                  {step + 1}
                </span>
              )}
            </div>
          );
        })}

        {path && path.length > 1 && mode === 'visible' && (
          // Cells (with half a gap around each) are exactly 1×1 in this viewBox
          <svg
            className="pointer-events-none absolute inset-[7px]"
            viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              points={path.map((c) => `${(c % GRID_SIZE) + 0.5},${Math.floor(c / GRID_SIZE) + 0.5}`).join(' ')}
              fill="none"
              stroke="rgb(4 120 87 / 0.35)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {(mode === 'idle' || mode === 'ready' || mode === 'paused') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-slate-950/80 px-5 py-2.5 text-sm font-medium text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
            {mode === 'paused' ? (
              <>
                <Pause size={16} /> Paused
              </>
            ) : mode === 'ready' ? (
              <>
                <Hourglass size={16} className="text-amber-300" /> Board {code} is dealt. Start when ready
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-amber-300" /> Start a round to roll the dice
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
