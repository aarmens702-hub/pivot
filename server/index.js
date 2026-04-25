import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { z } from 'zod';
import { loadPlayableVocab, loadEndpointVocab, buildGraph, shortestPath } from './wordGraph.js';
import { buildPuzzlePool, generateOnePuzzle, generateDailyPuzzle } from './puzzleGen.js';
import { buildAntonymPool } from './themedGen.js';

const PORT = process.env.PORT || 5174;
const isProd = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN;

console.log('[pivot] loading playable vocabulary...');
const playable = loadPlayableVocab();
console.log(`[pivot] ${playable.size} playable 4-letter words`);

const endpointSet = loadEndpointVocab(playable);
const endpointList = [...endpointSet];
console.log(`[pivot] ${endpointList.length} endpoint words (start/target pool)`);

console.log('[pivot] building adjacency graph...');
const t0 = Date.now();
const graph = buildGraph(playable);
console.log(`[pivot] graph built in ${Date.now() - t0}ms`);

console.log('[pivot] pre-generating puzzle pools...');
const t1 = Date.now();
const puzzlePool = buildPuzzlePool(graph, endpointList, endpointSet);
const easyPool = buildPuzzlePool(graph, endpointList, endpointSet, 200, { minDist: 3, maxDist: 3 });
const mediumPool = buildPuzzlePool(graph, endpointList, endpointSet, 200, { minDist: 4, maxDist: 4 });
const hardPool = buildPuzzlePool(graph, endpointList, endpointSet, 200, { minDist: 5, maxDist: 5 });
console.log(`[pivot] pools ready in ${Date.now() - t1}ms — random:${puzzlePool.length} easy:${easyPool.length} medium:${mediumPool.length} hard:${hardPool.length}`);

let antonymPool = [];
console.log('[pivot] building antonym pool in background...');
buildAntonymPool(graph, endpointSet, endpointList).then(p => { antonymPool = p; });

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json());

// CORS: dev keeps wildcard, prod locks to a single origin.
app.use(cors({ origin: isProd ? (corsOrigin || false) : true }));

// Rate limit: 60 requests/minute/IP. /api/health is excluded so monitors don't trip it.
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
}));

// Schemas
const fourLetter = z.string().regex(/^[a-z]{4}$/i, 'expected 4 lowercase letters');
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const puzzleQuery = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  theme: z.enum(['antonym']).optional(),
});
const dailyQuery = z.object({ date: dateKey.optional() });
const validateQuery = z.object({ from: fourLetter.optional(), word: fourLetter });
const solutionQuery = z.object({ start: fourLetter, target: fourLetter });

function parseQuery(schema, req, res) {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: 'invalid params', details: result.error.flatten() });
    return null;
  }
  return result.data;
}

// Wrap async handlers so unhandled rejections become 500s instead of crashing.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function pickFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    playable: playable.size,
    endpoints: endpointList.length,
    pools: {
      random: puzzlePool.length,
      easy: easyPool.length,
      medium: mediumPool.length,
      hard: hardPool.length,
      antonym: antonymPool.length,
    },
  });
});

app.get('/api/puzzle', (req, res) => {
  const q = parseQuery(puzzleQuery, req, res);
  if (!q) return;

  let pool = puzzlePool;
  if (q.difficulty === 'easy') pool = easyPool;
  else if (q.difficulty === 'medium') pool = mediumPool;
  else if (q.difficulty === 'hard') pool = hardPool;
  else if (q.theme === 'antonym') {
    if (antonymPool.length === 0) {
      return res.status(503).json({ error: 'antonym pool still building, try again in a moment' });
    }
    pool = antonymPool;
  }

  if (pool.length === 0) return res.status(503).json({ error: 'pool empty' });
  const puzzle = pickFrom(pool);
  res.json({
    start: puzzle.start,
    target: puzzle.target,
    distance: puzzle.distance,
    theme: puzzle.theme,
  });

  if (pool === puzzlePool && pool.length < 200) {
    const fresh = generateOnePuzzle(graph, endpointList, endpointSet);
    if (fresh) pool.push(fresh);
  }
});

app.get('/api/puzzle/daily', (req, res) => {
  const q = parseQuery(dailyQuery, req, res);
  if (!q) return;
  const date = q.date || new Date().toISOString().slice(0, 10);
  const puzzle = generateDailyPuzzle(graph, endpointList, endpointSet, date);
  if (!puzzle) return res.status(500).json({ error: 'failed to generate daily puzzle' });
  res.json(puzzle);
});

const synonymCache = new Map();

async function fetchSynonymsFor(word) {
  if (synonymCache.has(word)) return synonymCache.get(word);
  try {
    const res = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=50`);
    if (!res.ok) throw new Error(`datamuse ${res.status}`);
    const data = await res.json();
    const syns = new Set(data.map(d => d.word.toLowerCase()));
    synonymCache.set(word, syns);
    return syns;
  } catch (err) {
    console.warn(`[pivot] synonym fetch failed for ${word}:`, err.message);
    return new Set();
  }
}

async function areSynonyms(a, b) {
  const [synsA, synsB] = await Promise.all([fetchSynonymsFor(a), fetchSynonymsFor(b)]);
  return synsA.has(b) || synsB.has(a);
}

app.get('/api/validate', wrap(async (req, res) => {
  const q = parseQuery(validateQuery, req, res);
  if (!q) return;
  const word = q.word.toLowerCase();
  const from = q.from?.toLowerCase();

  const inDict = playable.has(word);
  let isNeighbor = false;
  let isSynonym = false;
  if (from && inDict) {
    const neighbors = graph.get(from);
    isNeighbor = !!neighbors && neighbors.has(word);
    if (!isNeighbor && word !== from) {
      isSynonym = await areSynonyms(from, word);
    }
  }
  res.json({ word, inDict, isNeighbor, isSynonym });
}));

app.get('/api/neighbors/:word', (req, res) => {
  const parsed = fourLetter.safeParse(req.params.word);
  if (!parsed.success) return res.status(400).json({ error: 'invalid word' });
  const word = parsed.data.toLowerCase();
  const neighbors = graph.get(word);
  if (!neighbors) return res.status(404).json({ error: 'unknown word' });
  res.json({ word, neighbors: [...neighbors] });
});

app.get('/api/solution', (req, res) => {
  const q = parseQuery(solutionQuery, req, res);
  if (!q) return;
  const start = q.start.toLowerCase();
  const target = q.target.toLowerCase();
  if (!graph.has(start) || !graph.has(target)) {
    return res.status(400).json({ error: 'unknown word' });
  }
  const path = shortestPath(graph, start, target);
  res.json({ path, length: path ? path.length - 1 : null });
});

// Catch-all error handler — turns any thrown/awaited rejection into a 500.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[pivot] unhandled error:', err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`[pivot] server listening on http://localhost:${PORT}`);
});
