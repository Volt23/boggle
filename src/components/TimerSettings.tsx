import React from 'react';
import { Clock } from 'lucide-react';

interface TimerSettingsProps {
  duration: number;
  isRunning: boolean;
  onDurationChange: (duration: number) => void;
}

export function TimerSettings({ duration, isRunning, onDurationChange }: TimerSettingsProps) {
  if (isRunning) return null;

  const minutes = Math.floor(duration / 60);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = parseInt(event.target.value, 10);
    onDurationChange(newMinutes * 60);
  };

  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Clock size={20} />
      <select
        value={minutes}
        onChange={handleChange}
        className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="1">1 minute</option>
        <option value="2">2 minutes</option>
        <option value="3">3 minutes</option>
        <option value="4">4 minutes</option>
        <option value="5">5 minutes</option>
      </select>
    </div>
  );
}