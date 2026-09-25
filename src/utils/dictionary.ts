export const MIN_WORD_LENGTH = 4;

export interface Dictionary {
  words: Set<string>;
  prefixes: Set<string>;
}

let dictionaryPromise: Promise<Dictionary> | null = null;

// The word list is ~3 MB, so it is code-split into its own chunk and only
// fetched the first time a round ends. The result is cached for later rounds.
export function loadDictionary(): Promise<Dictionary> {
  if (!dictionaryPromise) {
    dictionaryPromise = import('an-array-of-english-words')
      .then(({ default: list }) => {
        const words = new Set<string>();
        const prefixes = new Set<string>();
        for (const word of list as string[]) {
          if (word.length < MIN_WORD_LENGTH || word.length > 16 || !/^[a-z]+$/.test(word)) continue;
          words.add(word);
          for (let i = 1; i < word.length; i++) {
            prefixes.add(word.slice(0, i));
          }
        }
        return { words, prefixes };
      })
      .catch((error) => {
        // Allow a retry on the next round instead of caching the failure.
        dictionaryPromise = null;
        throw error;
      });
  }
  return dictionaryPromise;
}
