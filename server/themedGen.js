import { shortestPath } from './wordGraph.js';

const DATAMUSE_BASE = 'https://api.datamuse.com/words';
const MAX_PATH = 5;

async function fetchAntonyms(word) {
  try {
    const res = await fetch(`${DATAMUSE_BASE}?rel_ant=${encodeURIComponent(word)}&max=20`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(d => d.word.toLowerCase());
  } catch {
    return [];
  }
}

// Build a themed puzzle pool by fetching antonyms for each endpoint word and
// keeping pairs that are also (a) in the endpoint set and (b) solvable in
// MAX_PATH letter changes. Runs asynchronously after server startup so it
// doesn't block boot.
export async function buildAntonymPool(graph, endpointSet, endpointList, log = console.log) {
  const pool = [];
  const seen = new Set();
  const concurrency = 8;
  let idx = 0;

  async function worker() {
    while (idx < endpointList.length) {
      const i = idx++;
      const word = endpointList[i];
      const antonyms = await fetchAntonyms(word);
      for (const ant of antonyms) {
        if (!endpointSet.has(ant)) continue;
        const key = [word, ant].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        const path = shortestPath(graph, word, ant);
        if (!path || path.length - 1 > MAX_PATH) continue;
        pool.push({ start: word, target: ant, distance: path.length - 1, theme: 'antonym' });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  log(`[pivot] antonym pool ready: ${pool.length} pairs`);
  return pool;
}
