const STORAGE_KEY = 'pivot:stats:v1';

const empty = () => ({
  dailyStreak: 0,
  longestStreak: 0,
  lastDailyDate: null,
  dailyHistory: [],
  lifetimeWins: 0,
  lifetimeGames: 0,
  totalMoves: 0,
});

export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

function save(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage can throw in private mode / quota exceeded — silently ignore.
  }
  return stats;
}

function isoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayDiff(a, b) {
  const ad = new Date(a + 'T00:00:00Z').getTime();
  const bd = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((bd - ad) / 86400000);
}

// Record a finished game. `mode` is 'daily' or 'random'/'easy'/etc — only
// daily games affect streak. `won` is bool, `moves` is the chain length - 1.
export function recordGame({ mode, won, moves, dateKey }) {
  const stats = loadStats();
  stats.lifetimeGames += 1;
  if (won) stats.lifetimeWins += 1;
  stats.totalMoves += moves;

  if (mode === 'daily') {
    const today = dateKey || isoDay();
    const already = stats.dailyHistory.find(h => h.date === today);
    if (!already) {
      stats.dailyHistory.push({ date: today, moves, won });
      if (stats.dailyHistory.length > 60) stats.dailyHistory.shift();

      if (won) {
        if (stats.lastDailyDate && dayDiff(stats.lastDailyDate, today) === 1) {
          stats.dailyStreak += 1;
        } else {
          stats.dailyStreak = 1;
        }
        if (stats.dailyStreak > stats.longestStreak) {
          stats.longestStreak = stats.dailyStreak;
        }
        stats.lastDailyDate = today;
      } else {
        stats.dailyStreak = 0;
      }
    }
  }

  return save(stats);
}

export function alreadyPlayedDaily(dateKey) {
  const stats = loadStats();
  const target = dateKey || isoDay();
  return stats.dailyHistory.some(h => h.date === target);
}

// Recent N daily-history entries newest-first (for the stats modal chart).
export function recentDailyHistory(n = 7) {
  return loadStats().dailyHistory.slice(-n);
}

export function todayKey() {
  return isoDay();
}
