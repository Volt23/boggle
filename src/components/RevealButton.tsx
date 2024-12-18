import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface RevealButtonProps {
  isHidden: boolean;
  onToggle: () => void;
}

export function RevealButton({ isHidden, onToggle }: RevealButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
    >
      {isHidden ? (
        <>
          <Eye size={20} />
          Show Letters
        </>
      ) : (
        <>
          <EyeOff size={20} />
          Hide Letters
        </>
      )}
    </button>
  );
}