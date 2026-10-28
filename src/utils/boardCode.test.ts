import { describe, expect, it } from 'vitest';
import { CODE_LENGTH, boardForCode, normalizeCode, randomCode } from './boardCode';
import { isValidGrid } from './boggleLogic';

describe('board codes', () => {
  it('generates valid codes', () => {
    for (let i = 0; i < 100; i++) {
      const code = randomCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(normalizeCode(code)).toBe(code);
    }
  });

  it('normalizes input and rejects ambiguous or malformed codes', () => {
    expect(normalizeCode(' k7qf2 ')).toBe('K7QF2');
    expect(normalizeCode('K7QF')).toBeNull();
    expect(normalizeCode('K7QF22')).toBeNull();
    expect(normalizeCode('K0QF2')).toBeNull(); // 0 is not in the alphabet
    expect(normalizeCode('K-QF2')).toBeNull();
  });

  it('deals the same board for the same code, on any device', () => {
    expect(boardForCode('K7QF2')).toEqual(boardForCode('K7QF2'));
    expect(isValidGrid(boardForCode('K7QF2'))).toBe(true);
    // Pinned so a change to the generator can't silently split players onto different boards
    expect(boardForCode('ABCDE').join('')).toMatchInlineSnapshot(`"IINEAVSMLCOEDGAI"`);
  });

  it('deals different boards for different codes', () => {
    const boards = new Set(Array.from({ length: 200 }, () => boardForCode(randomCode()).join('')));
    expect(boards.size).toBeGreaterThan(195);
  });
});
