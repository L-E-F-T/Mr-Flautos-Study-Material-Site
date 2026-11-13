/**
 * Two-click discard: a minus that turns red on the first click and acts on a second click on the
 * red minus. It turns back after a few seconds, on Escape, or when anything else is clicked or
 * focused, and a quick double click counts as one click. It is the one icon on the site without
 * visible text and the one red outside right and wrong, by Mr. Flauto's choice, so it carries a
 * screen-reader name and a tooltip instead.
 *
 * Used on the home card's Resume buttons ("Discard deck") and on the practice page's Last test
 * banner ("Dismiss last test"). `className` picks the look for where it sits.
 */
import { h, icon, announce } from '../lib/dom.js';

/** How long the red minus waits for the second click before it turns back. */
const CONFIRM_MS = 5000;
/** A second click sooner than this is a double click, not a confirmation. */
const DOUBLE_CLICK_MS = 500;

/**
 * @param {object} options
 * @param {string} options.what            what it removes: "deck", "last test"
 * @param {string} [options.verb]          "Discard" (default) or "Dismiss"
 * @param {string} options.className       styling hook: 'exam-discard', 'discard-btn'
 * @param {() => void} onConfirm           runs on the second click
 */
export function discardButton({ what, verb = 'Discard', className }, onConfirm) {
  const name = `${verb} ${what}`;
  const action = verb.toLowerCase();
  const button = h('button', { type: 'button', class: className, 'aria-label': name, title: name }, icon('minus'));
  let armedAt = 0;
  let timer = 0;

  const onOutside = (event) => {
    if (!button.contains(event.target)) disarm();
  };
  const onKey = (event) => {
    if (event.key === 'Escape') disarm();
  };
  function arm() {
    armedAt = Date.now();
    button.classList.add('is-armed');
    button.setAttribute('aria-label', `Confirm: ${name.toLowerCase()}`);
    button.title = `Click again to ${action}`;
    announce(`Press again to ${action} the ${what}.`);
    timer = window.setTimeout(disarm, CONFIRM_MS);
    document.addEventListener('pointerdown', onOutside, true);
    button.addEventListener('keydown', onKey);
    button.addEventListener('blur', disarm);
  }
  function disarm() {
    if (!armedAt) return;
    armedAt = 0;
    window.clearTimeout(timer);
    document.removeEventListener('pointerdown', onOutside, true);
    button.removeEventListener('keydown', onKey);
    button.removeEventListener('blur', disarm);
    button.classList.remove('is-armed');
    button.setAttribute('aria-label', name);
    button.title = name;
  }
  button.addEventListener('click', () => {
    if (!armedAt) arm();
    else if (Date.now() - armedAt >= DOUBLE_CLICK_MS) {
      disarm();
      onConfirm();
    }
  });
  return button;
}
