/**
 * Tiny DOM helpers. Strings passed as children become text nodes, so content
 * from the data files is never parsed as HTML.
 */

/**
 * Create an element.
 *   h('button', { class: 'btn', onClick: fn, disabled: true }, 'Label')
 * - class / dataset / style(object) are handled specially
 * - on<Event> props become event listeners
 * - boolean true sets an empty attribute; false/null/undefined skip it
 * - non-string values for known DOM properties (checked, value, indeterminate…) are assigned directly
 */
export function h(tag, props, ...children) {
  const node = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (typeof value !== 'string' && key in node) node[key] = value;
      else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, String(value));
    }
  }
  append(node, children);
  return node;
}

/** Append children (nested arrays allowed; null/false skipped; strings become text). */
export function append(parent, children) {
  for (const child of [children].flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/** Replace all children of a node. */
export function mount(parent, ...children) {
  parent.replaceChildren();
  return append(parent, children);
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_PATHS = {
  check: 'M4 12.5l5 5L20 6.5',
  x: 'M6 6l12 12M18 6L6 18',
};

/**
 * Small line icon that takes the color of the text around it (styled by .icon in site.css).
 * The UI uses these instead of emoji or symbol characters, which render differently on
 * every device. Icons are hidden from screen readers, so always pair one with text.
 */
export function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', `icon icon-${name}`);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICON_PATHS[name] || '');
  svg.append(path);
  return svg;
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let uid = 0;
/** Unique id for aria-controls / label pairing. */
export function nextId(prefix = 'id') {
  uid += 1;
  return `${prefix}-${uid}`;
}

/** Announce a message to screen readers through a shared polite live region. */
export function announce(message) {
  let region = document.getElementById('sr-announcer');
  if (!region) {
    region = h('div', { id: 'sr-announcer', class: 'visually-hidden', 'aria-live': 'polite', 'aria-atomic': 'true' });
    document.body.append(region);
  }
  region.textContent = '';
  // Let assistive tech notice the change even when the same text repeats.
  window.setTimeout(() => { region.textContent = message; }, 30);
}

/** True when the keyboard event target is a text field we should not hijack. */
export function isTypingTarget(event) {
  const el = event.target;
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
  if (el.tagName === 'INPUT') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(type);
  }
  return false;
}

/** "two", "three"… for "Choose two." instructions. */
export function numberWord(n) {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] || String(n);
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
