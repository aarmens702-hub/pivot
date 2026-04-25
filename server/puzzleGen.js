import { bfsDistances } from './wordGraph.js';

const MIN_DIST = 3;
const MAX_DIST = 5;
const POOL_SIZE = 500;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOnePuzzle(graph, endpointList, endpointSet, opts = {}) {
  const minDist = opts.minDist ?? MIN_DIST;
  const maxDist = opts.maxDist ?? MAX_DIST;
  for (let attempt = 0; attempt < 50; attempt++) {
    const start = pickRandom(endpointList);
    if ((graph.get(start)?.size ?? 0) < 2) continue;

    const dist = bfsDistances(graph, start);
    const candidates = [];
    for (const [word, d] of dist) {
      if (d < minDist || d > maxDist) continue;
      if (!endpointSet.has(word)) continue;
      candidates.push({ word, d });
    }
    if (candidates.length === 0) continue;

    const chosen = pickRandom(candidates);
    return { start, target: chosen.word, distance: chosen.d };
  }
  return null;
}

export function buildPuzzlePool(graph, endpointList, endpointSet, size = POOL_SIZE, opts = {}) {
  const pool = [];
  let failures = 0;
  while (pool.length < size && failures < size * 3) {
    const puzzle = generateOnePuzzle(graph, endpointList, endpointSet, opts);
    if (puzzle) pool.push(puzzle);
    else failures++;
  }
  return pool;
}

// Deterministic puzzle picker for daily mode. Hashes the date string and uses
// it both to pick a start word and to pick a target from BFS-reachable
// endpoints at distance 3-5. Same dictionary + same dateKey → same puzzle.
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateDailyPuzzle(graph, endpointList, endpointSet, dateKey) {
  const seed = hash32(dateKey);
  // Try a sequence of starts derived from the seed until one yields a target.
  for (let i = 0; i < endpointList.length; i++) {
    const start = endpointList[(seed + i) % endpointList.length];
    if ((graph.get(start)?.size ?? 0) < 2) continue;

    const dist = bfsDistances(graph, start);
    const candidates = [];
    for (const [word, d] of dist) {
      if (d < MIN_DIST || d > MAX_DIST) continue;
      if (!endpointSet.has(word)) continue;
      candidates.push({ word, d });
    }
    if (candidates.length === 0) continue;
    candidates.sort((a, b) => a.word.localeCompare(b.word));
    const chosen = candidates[(seed >>> 8) % candidates.length];
    return { start, target: chosen.word, distance: chosen.d, dateKey };
  }
  return null;
}
