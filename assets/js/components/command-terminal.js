/**
 * Command line tool: the terminal box (docs/COMMAND-LINE-PLAN.md section 7). A view only: it
 * builds the nodes and the one live field, and the page (assets/js/pages/commands.js) decides
 * what goes in. Text from a pack and the typed line go in as text nodes. The prompt (C:\>, $,
 * Router#, Switch#) is the system's own text, set in code by promptFor in command-match.js.
 * Every class starts with cl- (site.css, Command line).
 */
import { h, icon, plural } from '../lib/dom.js';
import { promptFor, systemName, wordsFor } from '../lib/command-match.js';
import { MAX_TYPED } from '../lib/command-drill.js';

/** True on a phone or tablet with no mouse: there the keyboard stays closed until a tap. */
export function touchOnly() {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/**
 * The one live field of a command. Every setting is written as text, because h() skips a value
 * of false. No placeholder, and no inputmode, so a phone shows its usual keyboard.
 */
export function commandField(id, describedBy) {
  return h('input', {
    type: 'text', id, class: 'cl-term-input', 'aria-label': 'Command', 'aria-describedby': describedBy,
    autocapitalize: 'none', autocorrect: 'off', autocomplete: 'off', spellcheck: 'false',
    writingsuggestions: 'false', enterkeyhint: 'go', maxlength: String(MAX_TYPED),
  });
}

/** The prompt. Hidden from screen readers beside the field, which has its own name. */
export function promptText(system, hidden = false) {
  return h('span', { class: 'cl-term-prompt', 'aria-hidden': hidden ? 'true' : null }, promptFor(system));
}

/**
 * A line that was run: the prompt, then the line exactly as it was typed. A Linux shell prints a
 * space after its $; Windows (C:\>) and a router or switch (Router#) print none.
 */
export function echoLine(system, typed) {
  return h('pre', { class: 'cl-term-echo' }, promptText(system), system === 'linux' ? ' ' : null, typed);
}

/** The next prompt, under what a command printed (alone when it printed nothing). */
export function nextPrompt(system) {
  return h('pre', { class: 'cl-term-echo', 'aria-hidden': 'true' }, promptText(system));
}

/** What a right line printed, named for screen readers by the line. Null for an empty output. */
export function outputBlock(text, line) {
  if (typeof text !== 'string' || text === '') return null;
  return h('pre', { class: 'cl-term-out', role: 'group', 'aria-label': `Output of ${line}` }, text);
}

/** A miss that used a try: red, with the x icon, and the other system's name when it has one. */
export function missLine(result) {
  const words = wordsFor(result);
  return h('div', { class: 'cl-term-miss' },
    h('span', { class: 'cl-term-miss-label' }, icon('x'), words.label),
    words.tag ? h('span', { class: 'cl-term-tag' }, words.tag) : null,
  );
}

/** A plain line: a result that used no try, the tries left, or Answer. Never red or green. */
export function noteLine(text) {
  return h('div', { class: 'cl-term-note' }, text);
}

/** A counted miss as the box prints it: the line, its label, then the tries left while any are. */
export function missEntry(system, step, triesLeft) {
  return [
    echoLine(system, step.typed),
    missLine(step.result),
    triesLeft > 0 ? noteLine(`${plural(triesLeft, 'try', 'tries')} left`) : null,
  ];
}

/** The box: a title strip with the system's name (and Show answer while the command is open), then the body. */
export function terminalBox({ system, labelId, action = null, body }) {
  return h('div', { class: 'cl-term', role: 'group', 'aria-labelledby': labelId },
    h('div', { class: 'cl-term-bar' }, h('span', { id: labelId }, systemName(system)), action),
    body,
  );
}
