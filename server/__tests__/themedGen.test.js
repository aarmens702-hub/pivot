import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildGraph } from '../wordGraph.js';
import { buildAntonymPool } from '../themedGen.js';

// Stub Datamuse so tests don't hit the network. Returns predictable antonyms
// for known words and an empty list otherwise.
const fakeAntonyms = {
  hot: ['cold', 'cool'],
  cold: ['hot', 'warm'],
  good: ['bad', 'evil'],
  bad: ['good'],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const u = new URL(url);
    const word = u.searchParams.get('rel_ant');
    const list = fakeAntonyms[word] || [];
    return {
      ok: true,
      json: async () => list.map(w => ({ word: w })),
    };
  }));
});

describe('buildAntonymPool', () => {
  it('builds pairs only when both words are in the endpoint set and connected within 5 steps', async () => {
    const wordSet = new Set([
      'hot', 'hot'.length, // dummy filler ignored
    ]);
    // We need a real graph with 4-letter words. Build a small one where
    // antonym pairs are reachable.
    const real = new Set([
      'good', 'goad', 'load', 'lord', 'cord', 'cold', 'bold', 'bald',
      'baud', 'baad' /* not real but for path */, 'bald',
    ].filter(w => w.length === 4));
    const graph = buildGraph(real);
    const endpoints = real;
    const list = [...real];

    // We pretend "good" antonym is "cold" via stub. They should be reachable:
    // good → goad → load → lord → cord → cold (5 steps).
    const stubbed = {
      good: ['cold'],
      cold: ['good'],
    };
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const u = new URL(url);
      const word = u.searchParams.get('rel_ant');
      return { ok: true, json: async () => (stubbed[word] || []).map(w => ({ word: w })) };
    }));

    const pool = await buildAntonymPool(graph, endpoints, list, () => {});
    // good and cold are both in the set and connected; expect at least one entry
    const found = pool.find(p =>
      (p.start === 'good' && p.target === 'cold') ||
      (p.start === 'cold' && p.target === 'good')
    );
    expect(found).toBeDefined();
    expect(found.distance).toBeLessThanOrEqual(5);
    expect(found.theme).toBe('antonym');
  });

  it('skips antonym pairs not in the endpoint set', async () => {
    const real = new Set(['good', 'goad', 'load', 'lord', 'cord', 'cold']);
    const graph = buildGraph(real);
    // Endpoints exclude "good" so the pair shouldn't be added
    const endpoints = new Set(['cold', 'goad', 'load', 'lord', 'cord']);

    const pool = await buildAntonymPool(graph, endpoints, [...endpoints], () => {});
    const found = pool.find(p => p.start === 'good' || p.target === 'good');
    expect(found).toBeUndefined();
  });

  it('returns an empty pool when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }));
    const real = new Set(['good', 'cold']);
    const graph = buildGraph(real);
    const pool = await buildAntonymPool(graph, real, [...real], () => {});
    expect(pool).toEqual([]);
  });
});
