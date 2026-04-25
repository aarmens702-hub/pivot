import { describe, it, expect } from 'vitest';
import { buildGraph } from '../wordGraph.js';
import { generateOnePuzzle, generateDailyPuzzle } from '../puzzleGen.js';

// Use a small but well-connected fixture so generation is deterministic
// enough to test (every word has multiple ladders to choose from).
const wordSet = new Set([
  'cake', 'bake', 'bare', 'bart', 'cart', 'card', 'cord', 'cold', 'bold',
  'bald', 'ball', 'bell', 'belt', 'bolt', 'boot', 'boom', 'book', 'cook',
  'cool', 'pool', 'tool', 'foot', 'food', 'good', 'gold',
]);
const graph = buildGraph(wordSet);
const endpointSet = wordSet;
const endpointList = [...wordSet];

describe('generateOnePuzzle', () => {
  it('returns a puzzle with start/target/distance fields', () => {
    const p = generateOnePuzzle(graph, endpointList, endpointSet);
    expect(p).not.toBeNull();
    expect(p.start).toBeTypeOf('string');
    expect(p.target).toBeTypeOf('string');
    expect(p.distance).toBeTypeOf('number');
  });

  it('respects minDist and maxDist options', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateOnePuzzle(graph, endpointList, endpointSet, { minDist: 3, maxDist: 3 });
      if (p) expect(p.distance).toBe(3);
    }
  });

  it('puts both start and target inside endpoint set', () => {
    const p = generateOnePuzzle(graph, endpointList, endpointSet);
    expect(endpointSet.has(p.start)).toBe(true);
    expect(endpointSet.has(p.target)).toBe(true);
  });
});

describe('generateDailyPuzzle', () => {
  it('is deterministic for the same dateKey', () => {
    const a = generateDailyPuzzle(graph, endpointList, endpointSet, '2026-04-25');
    const b = generateDailyPuzzle(graph, endpointList, endpointSet, '2026-04-25');
    expect(a.start).toBe(b.start);
    expect(a.target).toBe(b.target);
    expect(a.distance).toBe(b.distance);
  });

  it('returns the dateKey on the puzzle object', () => {
    const p = generateDailyPuzzle(graph, endpointList, endpointSet, '2026-04-25');
    expect(p.dateKey).toBe('2026-04-25');
  });

  it('produces different puzzles for different dates (most of the time)', () => {
    // Across 10 different dates we expect at least 5 distinct (start, target)
    // pairs — collisions are possible but extremely unlikely on this small set.
    const seen = new Set();
    for (let i = 0; i < 10; i++) {
      const p = generateDailyPuzzle(graph, endpointList, endpointSet, `2026-04-${10 + i}`);
      seen.add(`${p.start}|${p.target}`);
    }
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  it('respects the 3-5 distance constraint', () => {
    for (let i = 0; i < 15; i++) {
      const p = generateDailyPuzzle(graph, endpointList, endpointSet, `2026-05-${1 + i}`);
      if (p) {
        expect(p.distance).toBeGreaterThanOrEqual(3);
        expect(p.distance).toBeLessThanOrEqual(5);
      }
    }
  });
});
