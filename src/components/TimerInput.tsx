import React from 'react';

interface TimerInputProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label: string;
  disabled?: boolean;
}

export function TimerInput({ value, onChange, max, label, disabled = false }: TimerInputProps) {
  return (
    <div className="flex flex-col items-center">
      <input
        type="number"
        min="0"
        max={max}
        value={value}
        onChange={(e) => {
          const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), max);
          onChange(val);
        }}
        disabled={disabled}
        className={`w-16 text-center p-2 border rounded-lg text-xl font-mono ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
      />
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}