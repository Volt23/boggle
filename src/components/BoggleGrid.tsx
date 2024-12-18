import React from 'react';

interface BoggleGridProps {
  letters: string[];
  isHidden: boolean;
}

export function BoggleGrid({ letters, isHidden }: BoggleGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-2 bg-white rounded-lg shadow-lg max-w-md w-full aspect-square">
      {letters.map((letter, index) => (
        <div
          key={index}
          className={`flex items-center justify-center ${
            isHidden ? 'bg-gray-200' : 'bg-blue-50'
          } rounded-lg text-3xl sm:text-4xl font-bold aspect-square shadow-sm transition-colors duration-300`}
        >
          {!isHidden && letter}
        </div>
      ))}
    </div>
  );
}