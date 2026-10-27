import { Trie } from './BoggleSolver';

let dictionary: Promise<Trie> | null = null;

/** Downloads and indexes the word list once; later calls share the same result. */
export function loadDictionary(): Promise<Trie> {
  if (!dictionary) {
    dictionary = fetch(`${import.meta.env.BASE_URL}dictionary.txt`)
      .then((response) => {
        if (!response.ok) throw new Error(`Dictionary request failed: ${response.status}`);
        return response.text();
      })
      .then((text) => new Trie(text.split('\n'), 1 << 18))
      .catch((error) => {
        dictionary = null; // allow a retry
        throw error;
      });
  }
  return dictionary;
}
