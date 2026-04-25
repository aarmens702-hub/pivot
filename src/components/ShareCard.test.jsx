import { describe, it, expect } from 'vitest';
import { buildShareString } from './share-string';

describe('buildShareString', () => {
  it('produces a Wordle-style emoji grid for a known win', () => {
    const out = buildShareString({
      chain: ['save', 'sane', 'bane', 'bank'],
      target: 'bank',
      moves: 3,
      parDistance: 3,
      mode: 'random',
    });
    // First line is the header
    const [header, ...rows] = out.split('\n');
    expect(header).toBe('Pivot SAVE→BANK 3/3');
    // 4 rows for the chain (start + 3 moves)
    expect(rows).toHaveLength(4);
    // s-a-v-e against b-a-n-k: only "a" matches at index 1 → ⬜🟩⬜⬜
    expect(rows[0]).toBe('⬜🟩⬜⬜');
    // s-a-n-e against b-a-n-k: "a" and "n" match → ⬜🟩🟩⬜
    expect(rows[1]).toBe('⬜🟩🟩⬜');
    // b-a-n-e against b-a-n-k: 3 match → 🟩🟩🟩⬜
    expect(rows[2]).toBe('🟩🟩🟩⬜');
    // b-a-n-k all match → 🟩🟩🟩🟩
    expect(rows[3]).toBe('🟩🟩🟩🟩');
  });

  it('uses "Pivot Daily" tag for daily mode', () => {
    const out = buildShareString({
      chain: ['save', 'bank'],
      target: 'bank',
      moves: 1,
      parDistance: 1,
      mode: 'daily',
    });
    expect(out.split('\n')[0]).toMatch(/^Pivot Daily/);
  });

  it('handles missing parDistance gracefully', () => {
    const out = buildShareString({
      chain: ['save', 'sane'],
      target: 'sane',
      moves: 1,
      parDistance: null,
      mode: 'random',
    });
    expect(out.split('\n')[0]).toContain('1/?');
  });
});
