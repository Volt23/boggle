import { MIN_WORD_LENGTH, NEIGHBORS, scoreWord } from './boggleLogic';

const CHAR_A = 97;

/**
 * Prefix tree over lowercase a–z words, stored in typed arrays as a
 * first-child / next-sibling tree (~10 bytes per node). Node 0 is the root;
 * index 0 doubles as "none" since the root is never a child or sibling.
 */
export class Trie {
  private letter: Uint8Array;
  private firstChild: Int32Array;
  private nextSibling: Int32Array;
  private terminal: Uint8Array;
  private nodeCount = 1;

  constructor(words: Iterable<string>, capacity = 1 << 16) {
    this.letter = new Uint8Array(capacity);
    this.firstChild = new Int32Array(capacity);
    this.nextSibling = new Int32Array(capacity);
    this.terminal = new Uint8Array(capacity);
    for (const word of words) this.insert(word);
  }

  insert(word: string): void {
    if (!/^[a-z]+$/.test(word)) return;
    let node = 0;
    for (let i = 0; i < word.length; i++) {
      const letter = word.charCodeAt(i) - CHAR_A;
      let child = this.child(node, letter);
      if (child < 0) {
        child = this.allocate();
        this.letter[child] = letter;
        this.nextSibling[child] = this.firstChild[node];
        this.firstChild[node] = child;
      }
      node = child;
    }
    this.terminal[node] = 1;
  }

  has(word: string): boolean {
    const node = this.walk(0, word);
    return node > 0 && this.terminal[node] === 1;
  }

  /** Follows `fragment` from `node`; returns the node reached, or -1. */
  walk(node: number, fragment: string): number {
    for (let i = 0; i < fragment.length && node >= 0; i++) {
      node = this.child(node, fragment.charCodeAt(i) - CHAR_A);
    }
    return node;
  }

  isWord(node: number): boolean {
    return this.terminal[node] === 1;
  }

  private child(node: number, letter: number): number {
    for (let c = this.firstChild[node]; c !== 0; c = this.nextSibling[c]) {
      if (this.letter[c] === letter) return c;
    }
    return -1;
  }

  private allocate(): number {
    if (this.nodeCount === this.terminal.length) {
      const grow = <T extends Uint8Array | Int32Array>(a: T): T => {
        const bigger = new (a.constructor as new (n: number) => T)(a.length * 2);
        bigger.set(a);
        return bigger;
      };
      this.letter = grow(this.letter);
      this.firstChild = grow(this.firstChild);
      this.nextSibling = grow(this.nextSibling);
      this.terminal = grow(this.terminal);
    }
    return this.nodeCount++;
  }
}

export interface Solution {
  word: string;
  score: number;
  /** Cell indices spelling the word, in order. */
  path: number[];
}

/** Sorts longest first, then alphabetically. */
export function compareSolutions(a: Solution, b: Solution): number {
  return b.word.length - a.word.length || a.word.localeCompare(b.word);
}

/** Finds every dictionary word on the board, pruning paths that are no word's prefix. */
export function findWordsInBoggle(letters: string[], dictionary: Trie): Solution[] {
  const fragments = letters.map((l) => l.toLowerCase());
  const found = new Map<string, Solution>();
  const path: number[] = [];

  function dfs(cell: number, node: number, word: string, visited: number) {
    node = dictionary.walk(node, fragments[cell]);
    if (node < 0) return;

    word += fragments[cell];
    visited |= 1 << cell;
    path.push(cell);

    if (word.length >= MIN_WORD_LENGTH && dictionary.isWord(node) && !found.has(word)) {
      found.set(word, { word, score: scoreWord(word), path: [...path] });
    }
    for (const next of NEIGHBORS[cell]) {
      if (!(visited & (1 << next))) dfs(next, node, word, visited);
    }

    path.pop();
  }

  for (let cell = 0; cell < letters.length; cell++) dfs(cell, 0, '', 0);

  return [...found.values()].sort(compareSolutions);
}

/** Returns a path spelling `word` on the board (dictionary not consulted), or null. */
export function findPath(letters: string[], word: string): number[] | null {
  const target = word.toLowerCase();
  const fragments = letters.map((l) => l.toLowerCase());
  const path: number[] = [];

  function dfs(cell: number, offset: number, visited: number): boolean {
    const fragment = fragments[cell];
    if (!target.startsWith(fragment, offset)) return false;
    offset += fragment.length;
    path.push(cell);
    if (offset === target.length) return true;
    visited |= 1 << cell;
    for (const next of NEIGHBORS[cell]) {
      if (!(visited & (1 << next)) && dfs(next, offset, visited)) return true;
    }
    path.pop();
    return false;
  }

  if (!target) return null;
  for (let cell = 0; cell < letters.length; cell++) {
    if (dfs(cell, 0, 0)) return path;
  }
  return null;
}
