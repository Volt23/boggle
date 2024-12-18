import React from 'react';

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
}

export function TimerDisplay({ minutes, seconds }: TimerDisplayProps) {
  return (
    <div className="text-2xl font-mono w-20 text-center">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}