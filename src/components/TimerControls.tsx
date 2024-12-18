import React from 'react';
import { Play, Pause } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  onPlay: () => void;
  onPause: () => void;
}

export function TimerControls({ isRunning, onPlay, onPause }: TimerControlsProps) {
  return (
    <button
      onClick={isRunning ? onPause : onPlay}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label={isRunning ? 'Pause' : 'Play'}
    >
      {isRunning ? <Pause size={24} /> : <Play size={24} />}
    </button>
  );
}