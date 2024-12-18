import React from 'react';

interface SolutionsListProps {
  solutions: string[];
  isVisible: boolean;
}

export function SolutionsList({ solutions, isVisible }: SolutionsListProps) {
  if (!isVisible) return null;

  const wordsByLength = solutions.reduce((acc, word) => {
    const length = word.length;
    if (!acc[length]) acc[length] = [];
    acc[length].push(word);
    return acc;
  }, {} as Record<number, string[]>);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Solutions ({solutions.length} words)</h2>
      {Object.entries(wordsByLength).map(([length, words]) => (
        <div key={length} className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {length} Letters ({words.length} words)
          </h3>
          <div className="flex flex-wrap gap-2">
            {words.map(word => (
              <span
                key={word}
                className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}