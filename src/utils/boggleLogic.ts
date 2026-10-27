export const GRID_SIZE = 4;
export const TILE_COUNT = GRID_SIZE * GRID_SIZE;
export const MIN_WORD_LENGTH = 3;

// The 16 dice of classic Boggle with their faces
export const DICE = [
  ['A', 'A', 'E', 'I', 'O', 'T'],
  ['A', 'B', 'I', 'L', 'R', 'T'],
  ['A', 'B', 'M', 'O', 'O', 'Qu'],
  ['A', 'C', 'D', 'E', 'M', 'P'],
  ['A', 'C', 'E', 'L', 'R', 'S'],
  ['A', 'C', 'F', 'I', 'O', 'R'],
  ['A', 'D', 'E', 'N', 'V', 'Z'],
  ['A', 'I', 'M', 'O', 'R', 'S'],
  ['C', 'E', 'N', 'O', 'T', 'U'],
  ['D', 'E', 'N', 'O', 'S', 'T'],
  ['E', 'E', 'F', 'H', 'I', 'S'],
  ['E', 'G', 'I', 'N', 'T', 'V'],
  ['E', 'G', 'L', 'N', 'O', 'U'],
  ['E', 'H', 'I', 'N', 'R', 'S'],
  ['E', 'I', 'L', 'O', 'R', 'U'],
  ['E', 'L', 'P', 'S', 'T', 'U'],
];

/** Shakes the dice: every die lands in a random cell showing a random face. */
export function generateGrid(random: () => number = Math.random): string[] {
  const dice = [...DICE];
  // Fisher–Yates shuffle (sorting with a random comparator is biased)
  for (let i = dice.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [dice[i], dice[j]] = [dice[j], dice[i]];
  }
  return dice.map((die) => die[Math.floor(random() * die.length)]);
}

/** For each cell, the indices of its (up to 8) neighbours. */
export const NEIGHBORS: readonly number[][] = Array.from({ length: TILE_COUNT }, (_, i) => {
  const row = Math.floor(i / GRID_SIZE);
  const col = i % GRID_SIZE;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr;
      const c = col + dc;
      if ((dr || dc) && r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        result.push(r * GRID_SIZE + c);
      }
    }
  }
  return result;
});

/** Official Boggle scoring. "Qu" counts as two letters. */
export function scoreWord(word: string): number {
  const length = word.length;
  if (length < MIN_WORD_LENGTH) return 0;
  if (length <= 4) return 1;
  if (length === 5) return 2;
  if (length === 6) return 3;
  if (length === 7) return 5;
  return 11;
}

export function isValidGrid(letters: unknown): letters is string[] {
  return (
    Array.isArray(letters) &&
    letters.length === TILE_COUNT &&
    letters.every((l) => typeof l === 'string' && /^(?:[A-Z]|Qu)$/.test(l))
  );
}
