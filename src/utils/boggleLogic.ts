// Define the 16 dice with their faces
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
  ['E', 'L', 'P', 'S', 'T', 'U']
];

export function generateGrid(): string[] {
  const shuffledDice = [...DICE].sort(() => Math.random() - 0.5);
  return shuffledDice.map(die => die[Math.floor(Math.random() * die.length)]);
}