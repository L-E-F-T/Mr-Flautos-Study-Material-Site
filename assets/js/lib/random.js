/**
 * Unbiased randomness for shuffling decks and drawing practice questions.
 * Uses crypto.getRandomValues when available (all modern browsers and Node 19+).
 */

/** Random integer in [0, n). */
export function randomInt(n) {
  if (!(n > 1)) return 0;
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const limit = Math.floor(0x100000000 / n) * n; // rejection sampling avoids modulo bias
    const buffer = new Uint32Array(1);
    let value;
    do {
      cryptoApi.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);
    return value % n;
  }
  return Math.floor(Math.random() * n);
}

/** Fisher–Yates shuffle, in place. Returns the same array. */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/** n distinct random items from an array (fewer if the array is shorter). */
export function sample(array, n) {
  const count = Math.max(0, Math.min(n, array.length));
  return shuffle([...array]).slice(0, count);
}
