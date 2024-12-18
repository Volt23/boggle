import React from 'react';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';

interface TimerProps {
  seconds: number;
  isRunning: boolean;
  onPause: () => void;
  onPlay: () => void;
}

export function Timer({ 
  seconds, 
  isRunning,
  onPause, 
  onPlay
}: TimerProps) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div className="flex items-center gap-4">
      <TimerDisplay minutes={minutes} seconds={remainingSeconds} />
      <TimerControls
        isRunning={isRunning}
        onPlay={onPlay}
        onPause={onPause}
      />
    </div>
  );
}