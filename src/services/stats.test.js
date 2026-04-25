import { describe, it, expect, beforeEach } from 'vitest';
import { loadStats, recordGame, alreadyPlayedDaily } from './stats';

beforeEach(() => {
  localStorage.clear();
});

describe('stats — loadStats', () => {
  it('returns zeroed stats when storage is empty', () => {
    const s = loadStats();
    expect(s.dailyStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.lifetimeWins).toBe(0);
    expect(s.lifetimeGames).toBe(0);
    expect(s.dailyHistory).toEqual([]);
  });

  it('survives corrupt JSON in storage', () => {
    localStorage.setItem('pivot:stats:v1', 'not json');
    const s = loadStats();
    expect(s.lifetimeGames).toBe(0);
  });
});

describe('stats — recordGame (random / non-daily)', () => {
  it('increments lifetime counters but not daily streak', () => {
    recordGame({ mode: 'random', won: true, moves: 3 });
    const s = loadStats();
    expect(s.lifetimeGames).toBe(1);
    expect(s.lifetimeWins).toBe(1);
    expect(s.totalMoves).toBe(3);
    expect(s.dailyStreak).toBe(0);
    expect(s.dailyHistory).toEqual([]);
  });

  it('counts losses', () => {
    recordGame({ mode: 'random', won: false, moves: 5 });
    const s = loadStats();
    expect(s.lifetimeWins).toBe(0);
    expect(s.lifetimeGames).toBe(1);
  });
});

describe('stats — daily streak', () => {
  it('starts streak at 1 on first daily win', () => {
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-25' });
    const s = loadStats();
    expect(s.dailyStreak).toBe(1);
    expect(s.longestStreak).toBe(1);
  });

  it('increments streak on consecutive day wins', () => {
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-25' });
    recordGame({ mode: 'daily', won: true, moves: 4, dateKey: '2026-04-26' });
    recordGame({ mode: 'daily', won: true, moves: 2, dateKey: '2026-04-27' });
    const s = loadStats();
    expect(s.dailyStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it('resets streak when a day is skipped', () => {
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-25' });
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-26' });
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-29' }); // skipped 27, 28
    const s = loadStats();
    expect(s.dailyStreak).toBe(1);
    expect(s.longestStreak).toBe(2);
  });

  it('resets streak on a daily loss', () => {
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-25' });
    recordGame({ mode: 'daily', won: false, moves: 5, dateKey: '2026-04-26' });
    const s = loadStats();
    expect(s.dailyStreak).toBe(0);
  });

  it('does not double-record same-day plays', () => {
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-25' });
    recordGame({ mode: 'daily', won: false, moves: 5, dateKey: '2026-04-25' }); // ignored
    const s = loadStats();
    expect(s.dailyHistory).toHaveLength(1);
    expect(s.dailyStreak).toBe(1);
  });

  it('preserves longestStreak when current streak resets', () => {
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-25' });
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-26' });
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-27' });
    recordGame({ mode: 'daily', won: false, moves: 5, dateKey: '2026-04-28' });
    const s = loadStats();
    expect(s.dailyStreak).toBe(0);
    expect(s.longestStreak).toBe(3);
  });
});

describe('stats — alreadyPlayedDaily', () => {
  it('returns false before play', () => {
    expect(alreadyPlayedDaily('2026-04-25')).toBe(false);
  });

  it('returns true after play', () => {
    recordGame({ mode: 'daily', won: true, moves: 3, dateKey: '2026-04-25' });
    expect(alreadyPlayedDaily('2026-04-25')).toBe(true);
    expect(alreadyPlayedDaily('2026-04-26')).toBe(false);
  });
});
