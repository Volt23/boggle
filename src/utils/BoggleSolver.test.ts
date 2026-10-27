import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Trie, findPath, findWordsInBoggle } from './BoggleSolver';
import { DICE, NEIGHBORS, generateGrid, isValidGrid, scoreWord } from './boggleLogic';

// prettier-ignore
const BOARD = [
  'C', 'A', 'T', 'S',
  'X', 'R', 'E', 'X',
  'X', 'X', 'Qu', 'I',
  'X', 'X', 'T', 'X',
];

describe('Trie', () => {
  const trie = new Trie(['cat', 'cats', 'car', 'Dog', "it's", ''], 2);

  it('stores lowercase words and grows past its initial capacity', () => {
    expect(trie.has('cat')).toBe(true);
    expect(trie.has('cats')).toBe(true);
    expect(trie.has('car')).toBe(true);
  });

  it('rejects prefixes, unknown words and invalid entries', () => {
    expect(trie.has('ca')).toBe(false);
    expect(trie.has('')).toBe(false);
    expect(trie.has('dog')).toBe(false);
    expect(trie.has('its')).toBe(false);
  });
});

describe('findWordsInBoggle', () => {
  const trie = new Trie(['cat', 'cats', 'rat', 'tea', 'ate', 'at', 'quit', 'equit', 'react', 'cast', 'tact']);
  const solutions = findWordsInBoggle(BOARD, trie);
  const words = solutions.map((s) => s.word);

  it('finds adjacent-path words, including through the Qu tile', () => {
    expect(words).toEqual(expect.arrayContaining(['cat', 'cats', 'rat', 'tea', 'ate', 'quit']));
  });

  it('skips short words, reused tiles and non-adjacent paths', () => {
    expect(words).not.toContain('at'); // too short
    expect(words).not.toContain('tact'); // would reuse a T tile
    expect(words).not.toContain('cast'); // S is not next to A
  });

  it('sorts longest first then alphabetically, with scores and valid paths', () => {
    expect(words).toEqual([...words].sort((a, b) => b.length - a.length || a.localeCompare(b)));
    for (const { word, path, score } of solutions) {
      expect(path.map((i) => BOARD[i].toLowerCase()).join('')).toBe(word);
      expect(new Set(path).size).toBe(path.length);
      path.slice(1).forEach((cell, i) => expect(NEIGHBORS[path[i]]).toContain(cell));
      expect(score).toBe(scoreWord(word));
    }
  });

  it('solves real boards against the full dictionary quickly', () => {
    const text = readFileSync('public/dictionary.txt', 'utf8');
    const dictionary = new Trie(text.split('\n'), 1 << 18);
    const start = performance.now();
    for (let i = 0; i < 100; i++) findWordsInBoggle(generateGrid(), dictionary);
    expect((performance.now() - start) / 100).toBeLessThan(20);
    expect(findWordsInBoggle(BOARD, dictionary).map((s) => s.word)).toContain('quiet');
  });
});

describe('findPath', () => {
  it('locates words regardless of the dictionary', () => {
    expect(findPath(BOARD, 'quiet')).toEqual([10, 11, 6, 2]);
    expect(findPath(BOARD, 'quite')).toBeNull(); // no T next to the I has an E beside it
    expect(findPath(BOARD, 'requit')).toEqual([5, 6, 10, 11, 14]);
    expect(findPath(BOARD, 'CATS')).toEqual([0, 1, 2, 3]);
    expect(findPath(BOARD, 'dog')).toBeNull();
    expect(findPath(BOARD, '')).toBeNull();
  });
});

describe('generateGrid', () => {
  it('produces 16 faces taken from the dice', () => {
    const faces = new Set(DICE.flat());
    for (let i = 0; i < 50; i++) {
      const grid = generateGrid();
      expect(isValidGrid(grid)).toBe(true);
      grid.forEach((face) => expect(faces).toContain(face));
    }
  });

  it('places each die exactly once', () => {
    // Always picking face 0 makes each cell identify its die
    const grid = generateGrid(() => 0);
    expect([...grid].sort()).toEqual(DICE.map((d) => d[0]).sort());
  });
});

describe('scoreWord', () => {
  it('follows the official table', () => {
    expect(['at', 'cat', 'cats', 'house', 'houses', 'housing', 'quizzical'].map(scoreWord)).toEqual([
      0, 1, 1, 2, 3, 5, 11,
    ]);
  });
});
