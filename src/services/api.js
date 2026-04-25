const API_BASE = import.meta.env.VITE_API_BASE || '';

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${path} failed: ${res.status}`);
  }
  return res.json();
}

export function fetchPuzzle({ difficulty, theme } = {}) {
  const params = new URLSearchParams();
  if (difficulty) params.set('difficulty', difficulty);
  if (theme) params.set('theme', theme);
  const qs = params.toString();
  return getJson(`/api/puzzle${qs ? `?${qs}` : ''}`);
}

export function fetchDailyPuzzle(date) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  const qs = params.toString();
  return getJson(`/api/puzzle/daily${qs ? `?${qs}` : ''}`);
}

export function validateMove(from, word) {
  const params = new URLSearchParams({ from, word });
  return getJson(`/api/validate?${params.toString()}`);
}

export function fetchNeighbors(word) {
  return getJson(`/api/neighbors/${encodeURIComponent(word)}`);
}

export function fetchSolution(start, target) {
  const params = new URLSearchParams({ start, target });
  return getJson(`/api/solution?${params.toString()}`);
}

export async function fetchDefinition(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch {
    return null;
  }
}
