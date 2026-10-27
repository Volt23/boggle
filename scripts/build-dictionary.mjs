// Generates public/dictionary.txt from the SCOWL word lists in `wordlist-english`.
// Run with `npm run build:dictionary`.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

// SCOWL frequency levels up to 60 (the size recommended for spell checkers):
// common and moderately rare words, without the very obscure ones.
const LEVELS = [10, 20, 35, 40, 50, 55, 60];
const VARIANTS = ['english', 'american', 'british'];

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve('wordlist-english/package.json'));

const words = new Set();
for (const variant of VARIANTS) {
  for (const level of LEVELS) {
    const list = JSON.parse(readFileSync(join(pkgDir, `${variant}-words-${level}.json`), 'utf8'));
    for (const word of list) {
      // Lowercase letters only (drops proper nouns, abbreviations and apostrophes);
      // 3 letters minimum and at most 17 (16 tiles, one of them "Qu").
      if (/^[a-z]{3,17}$/.test(word)) words.add(word);
    }
  }
}

const sorted = [...words].sort();
writeFileSync('public/dictionary.txt', sorted.join('\n') + '\n');
copyFileSync(join(pkgDir, 'Copyright'), 'public/dictionary-LICENSE.txt');
console.log(`Wrote ${sorted.length} words to public/dictionary.txt`);
