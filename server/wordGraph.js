import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const WORD_LEN = 4;

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Weaver's curated 4-letter word list (4,030 words). This is the single source
// of truth for what counts as a valid word in the game — the graph is built
// from it, and every player move is validated against it.
const weaverRaw = readFileSync(join(__dirname, 'data', 'weaver_words.txt'), 'utf8');
const weaverList = weaverRaw
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length === WORD_LEN && /^[a-z]+$/.test(w));

// SCOWL "most common English words" tiers — used ONLY to filter puzzle
// endpoints (start + target) down to words an average player recognizes.
// Intermediate steps along a ladder can come from the full Weaver list.
function readTier(tier) {
  const p = require.resolve(`wordlist-english/${tier}.json`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function loadPlayableVocab() {
  return new Set(weaverList);
}

export function loadEndpointVocab(playable) {
  const raw = ['english-words-10', 'english-words-20'].flatMap(readTier);
  const out = new Set();
  for (const w of raw) {
    const lower = String(w).toLowerCase();
    if (lower.length !== WORD_LEN) continue;
    if (!/^[a-z]+$/.test(lower)) continue;
    if (!playable.has(lower)) continue;
    out.add(lower);
  }
  return out;
}

// Adjacency graph: edge between words differing by exactly one letter. Built
// with wildcard buckets — O(N·L) instead of O(N²) pairwise comparison.
export function buildGraph(wordSet) {
  const buckets = new Map();
  for (const word of wordSet) {
    for (let i = 0; i < WORD_LEN; i++) {
      const pattern = word.slice(0, i) + '*' + word.slice(i + 1);
      let bucket = buckets.get(pattern);
      if (!bucket) {
        bucket = [];
        buckets.set(pattern, bucket);
      }
      bucket.push(word);
    }
  }

  const graph = new Map();
  for (const word of wordSet) graph.set(word, new Set());
  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue;
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        graph.get(bucket[i]).add(bucket[j]);
        graph.get(bucket[j]).add(bucket[i]);
      }
    }
  }
  return graph;
}

// BFS (exactly the level-by-level expansion used in the Weaver solver):
// expand every leaf one step at a time, returning each word's distance from
// the source. Used both for solving (shortestPath) and for puzzle generation
// (pick a random endpoint at distance N from a random seed).
export function bfsDistances(graph, source) {
  const dist = new Map();
  dist.set(source, 0);
  const queue = [source];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    const d = dist.get(node);
    const neighbors = graph.get(node);
    if (!neighbors) continue;
    for (const nb of neighbors) {
      if (dist.has(nb)) continue;
      dist.set(nb, d + 1);
      queue.push(nb);
    }
  }
  return dist;
}

export function shortestPath(graph, start, target) {
  if (start === target) return [start];
  const prev = new Map();
  prev.set(start, null);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    const neighbors = graph.get(node);
    if (!neighbors) continue;
    for (const nb of neighbors) {
      if (prev.has(nb)) continue;
      prev.set(nb, node);
      if (nb === target) {
        const path = [];
        let cur = nb;
        while (cur !== null) {
          path.push(cur);
          cur = prev.get(cur);
        }
        return path.reverse();
      }
      queue.push(nb);
    }
  }
  return null;
}
