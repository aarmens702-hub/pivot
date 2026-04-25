import { describe, it, expect } from 'vitest';
import { buildGraph, bfsDistances, shortestPath } from '../wordGraph.js';

// Tiny fixture set with known one-letter relationships:
//   cat ── bat ── bad ── bid
//    │      │      │
//   cot    bat    bag
// Words 4 letters long are required by the graph builder, so we use a small
// set that covers branches/leaves, isolated nodes, and a known shortest path.
const fixture = new Set([
  'cake', 'bake', 'bake'.replace('e', 'r'), // "bakr" not a word; skip
]);

const tiny = new Set(['cake', 'bake', 'bare', 'bart', 'cart', 'card', 'isle']);

describe('buildGraph', () => {
  it('produces symmetric edges', () => {
    const g = buildGraph(tiny);
    for (const [a, neighbors] of g) {
      for (const b of neighbors) {
        expect(g.get(b).has(a)).toBe(true);
      }
    }
  });

  it('connects words that differ by exactly one letter', () => {
    const g = buildGraph(tiny);
    expect(g.get('cake').has('bake')).toBe(true);
    expect(g.get('bake').has('bare')).toBe(true);
    expect(g.get('bare').has('bart')).toBe(true);
    expect(g.get('bart').has('cart')).toBe(true);
    expect(g.get('cart').has('card')).toBe(true);
  });

  it('does not connect words differing by more than one letter', () => {
    const g = buildGraph(tiny);
    expect(g.get('cake').has('card')).toBe(false);
    expect(g.get('cake').has('isle')).toBe(false);
  });

  it('isolates words with no neighbors in the set', () => {
    const g = buildGraph(tiny);
    expect(g.get('isle').size).toBe(0);
  });
});

describe('bfsDistances', () => {
  it('returns distance 0 for the source', () => {
    const g = buildGraph(tiny);
    const d = bfsDistances(g, 'cake');
    expect(d.get('cake')).toBe(0);
  });

  it('returns correct distances on a known small graph', () => {
    const g = buildGraph(tiny);
    const d = bfsDistances(g, 'cake');
    // cake → bake (1) → bare (2) → bart (3) → cart (4) → card (5)
    expect(d.get('bake')).toBe(1);
    expect(d.get('bare')).toBe(2);
    expect(d.get('bart')).toBe(3);
    expect(d.get('cart')).toBe(4);
    expect(d.get('card')).toBe(5);
  });

  it('omits unreachable nodes from the distance map', () => {
    const g = buildGraph(tiny);
    const d = bfsDistances(g, 'cake');
    expect(d.has('isle')).toBe(false);
  });

  it('returns a single-entry map for an isolated source', () => {
    const g = buildGraph(tiny);
    const d = bfsDistances(g, 'isle');
    expect(d.size).toBe(1);
    expect(d.get('isle')).toBe(0);
  });
});

describe('shortestPath', () => {
  it('returns [start] when start === target', () => {
    const g = buildGraph(tiny);
    expect(shortestPath(g, 'cake', 'cake')).toEqual(['cake']);
  });

  it('returns the optimal path between connected nodes', () => {
    const g = buildGraph(tiny);
    const path = shortestPath(g, 'cake', 'card');
    expect(path).toEqual(['cake', 'bake', 'bare', 'bart', 'cart', 'card']);
  });

  it('returns null for disconnected nodes', () => {
    const g = buildGraph(tiny);
    expect(shortestPath(g, 'cake', 'isle')).toBeNull();
  });

  it('returns a 2-step path for direct neighbors', () => {
    const g = buildGraph(tiny);
    expect(shortestPath(g, 'cake', 'bake')).toEqual(['cake', 'bake']);
  });
});
