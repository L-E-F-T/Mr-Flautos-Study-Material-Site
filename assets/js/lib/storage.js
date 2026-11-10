/**
 * Per-browser saved state (decks, practice tests in progress, last settings).
 * Nothing leaves the student's device: there are no accounts and no server.
 * Every call is wrapped so the site still works when storage is blocked
 * (private windows, locked-down school profiles).
 */

const PREFIX = 'certprep:v1:';

export function load(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}
