import { Pause, Play } from 'lucide-react';
import type { Status } from '../game/state';

interface TimerProps {
  remainingMs: number;
  durationMs: number;
  status: Status;
  onPause: () => void;
  onResume: () => void;
}

const LOW_TIME_S = 10;

export function Timer({ remainingMs, durationMs, status, onPause, onResume }: TimerProps) {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const progress = durationMs > 0 ? Math.min(1, remainingMs / durationMs) : 0;
  const low = status === 'running' && totalSeconds <= LOW_TIME_S;
  const canToggle = status === 'running' || status === 'paused' || status === 'ready';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <div
          className={`font-display text-6xl font-semibold tabular-nums tracking-tight transition-colors sm:text-7xl ${
            low ? 'text-rose-400 motion-safe:animate-pulse' : status === 'finished' ? 'text-white/40' : 'text-white'
          }`}
          role="timer"
          aria-live={low ? 'polite' : 'off'}
        >
          {minutes}:{String(seconds).padStart(2, '0')}
        </div>
        {canToggle && (
          <button
            type="button"
            onClick={status === 'running' ? onPause : onResume}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95"
            aria-label={status === 'running' ? 'Pause timer' : status === 'ready' ? 'Start round' : 'Resume timer'}
            title={status === 'running' ? 'Pause (Space)' : status === 'ready' ? 'Start (Space)' : 'Resume (Space)'}
          >
            {status === 'running' ? <Pause size={22} /> : <Play size={22} className="translate-x-0.5" />}
          </button>
        )}
      </div>
      <div className="h-1.5 w-full max-w-[26rem] overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${low ? 'bg-rose-400' : 'bg-amber-300'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
