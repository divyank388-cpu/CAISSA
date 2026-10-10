// The player's profile, kept in this browser for now. Login/accounts will replace this later.
const KEY = "caissa:profile";

export const LEVELS = [
  { id: "new", label: "Brand new", blurb: "I'm just starting out" },
  { id: "beginner", label: "I know the rules", blurb: "I can play a game, but I'm still learning" },
  { id: "casual", label: "Casual player", blurb: "I play for fun and know some openings and tactics" },
  { id: "experienced", label: "Experienced", blurb: "I play regularly and study the game" },
];

export const levelLabel = (id) => LEVELS.find((level) => level.id === id)?.label ?? "Beginner";

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {}
}
