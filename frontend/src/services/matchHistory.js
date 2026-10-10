// Finished matches, kept in this browser for now (a real database comes with accounts).
const KEY = "caissa:matches";

export function getMatches() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

export function addMatch(match) {
  const all = [match, ...getMatches()].slice(0, 100);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}
