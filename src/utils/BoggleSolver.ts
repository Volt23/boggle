export function findWordsInBoggle(grid: string[][], dictionary: Set<string>): string[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const foundWords = new Set<string>();

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  function dfs(word: string, x: number, y: number, visited: Set<string>) {
    if (x < 0 || x >= rows || y < 0 || y >= cols || visited.has(`${x},${y}`)) {
      return;
    }

    let letter = grid[x][y];
    const newWord = word + (letter.toLowerCase() === 'qu' ? 'qu' : letter.toLowerCase());

    if (newWord.length > 3 && dictionary.has(newWord)) {
      foundWords.add(newWord);
    }

    visited.add(`${x},${y}`);

    for (const [dx, dy] of directions) {
      dfs(newWord, x + dx, y + dy, visited);
    }

    visited.delete(`${x},${y}`);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs('', r, c, new Set());
    }
  }

  return Array.from(foundWords).sort((a, b) => a.length - b.length);
}