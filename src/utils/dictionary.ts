export async function loadDictionary(): Promise<Set<string>> {
  const response = await fetch('/dictionary.json');
  const words: string[] = await response.json();
  return new Set(words);
}