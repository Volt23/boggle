import type { Dictionary } from './dictionary';

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function findWordsInBoggle(grid: string[][], { words, prefixes }: Dictionary): string[] {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const visited = grid.map(row => row.map(() => false));
  const foundWords = new Set<string>();

  function dfs(word: string, x: number, y: number) {
    if (x < 0 || x >= rows || y < 0 || y >= cols || visited[x][y]) {
      return;
    }

    const letter = grid[x][y].toLowerCase();
    if (!letter) return;

    const newWord = word + letter;
    if (words.has(newWord)) {
      foundWords.add(newWord);
    }
    // Stop exploring paths that cannot lead to any dictionary word.
    if (!prefixes.has(newWord)) return;

    visited[x][y] = true;
    for (const [dx, dy] of DIRECTIONS) {
      dfs(newWord, x + dx, y + dy);
    }
    visited[x][y] = false;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs('', r, c);
    }
  }

  return Array.from(foundWords).sort((a, b) => a.length - b.length || a.localeCompare(b));
}
