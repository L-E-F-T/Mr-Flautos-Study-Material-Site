/**
 * Command line tool: the terminal box (docs/COMMAND-LINE-PLAN.md sections 7 and 15). A view only:
 * it builds the nodes and the one live field, and the page (assets/js/pages/commands.js) decides
 * what goes in. Text from a pack, the bank, and the typed line go in as text nodes. The prompt
 * (C:\>, $, Router#, Switch#) and a system's error are the system's own text, set in code:
 * promptFor in command-match.js and systemError in command-help.js. Every class starts with cl-
 * (site.css, Command line).
 *
 * The box is a transcript: every line run stays in it with what it printed, as on a terminal,
 * until cls or clear empties it.
 */
import { h, icon, append } from '../lib/dom.js';
import { promptFor, systemName, wordsFor } from '../lib/command-match.js';
import { MAX_TYPED } from '../lib/command-drill.js';
import { helpFor, helpNote, helpWords, systemError } from '../lib/command-help.js';

// A help listing: each command or switch on its own line and its words on the line under it,
// indented, so that a long line wraps inside the indent on a phone. Inline, so that site.css (shared
// by every page) does not change.
const HELP_WORDS = { paddingLeft: '2ch' };

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

/** A plain line: a result that used no try, Help off, or Answer. Never red or green. */
export function noteLine(text) {
  return h('div', { class: 'cl-term-note' }, text);
}

/**
 * What a help line printed (helpFor in command-help.js): each command or switch with its words
 * under it; or one plain line (Help off, Coming soon, Not in this tool); or, on a router or switch,
 * the device's own message.
 */
export function helpBlock(help, line) {
  if (help.kind === 'list' || help.kind === 'command') {
    return h('div', { class: 'cl-term-out', role: 'group', 'aria-label': `Output of ${line}` },
      help.rows.map((row) => h('div', null, row.head, row.words ? h('div', { style: HELP_WORDS }, row.words) : null)),
    );
  }
  if (help.kind === 'unrecognized') return h('pre', { class: 'cl-term-out' }, helpWords(help));
  return noteLine(helpWords(help));
}

/** What the system printed for a command it does not know (systemError in command-help.js). */
export function errorBlock(lines) {
  return h('pre', { class: 'cl-term-out' }, lines.join('\n'));
}

/**
 * One line run, as the box prints it: the echo, then a red label for a line that added a try, the
 * help, the system's error, or a plain label. A right line is printed by endedBody, with its output.
 *   help     { entries, off }: the bank's entries, and whether help is off on this command
 *   compact  a review card prints a help line as one plain line (Help: 7 commands), not the listing
 */
export function stepEntry(system, step, help, compact = false) {
  const result = step.result;
  const echo = echoLine(system, step.typed);
  if (result.counts) return [echo, missLine(result)];
  const listing = helpFor(help.entries, system, result, help.off);
  if (listing) return [echo, compact ? noteLine(helpNote(listing, result.word)) : helpBlock(listing, step.typed)];
  const error = systemError(system, result);
  if (error) return [echo, errorBlock(error)];
  const words = wordsFor(result);
  return [echo, words.label ? noteLine(words.label) : null];
}

/** The steps the box shows (gradeAnswer in command-drill.js): each line run after the last cls or clear, the right line left out. */
export function shownSteps(graded) {
  return graded.steps.slice(graded.cleared).filter((step) => step.result.code !== 'accepted' && step.result.code !== 'clear-screen');
}

/**
 * The body of the box once a command has ended, from its graded answer: each line run after the
 * last cls or clear, as it printed, then the right line as typed, or Answer and the answer line,
 * then its output (nothing for an empty one) and the next prompt. A command left open (the drill
 * ended first) reads as after Show answer. The review card uses it too, so a card shows what the
 * screen showed. answer: the line shown as the answer. output: the text the line printed. help:
 * as for stepEntry. Gives { body, printed }: printed is the line that printed the output.
 */
export function endedBody(system, graded, { answer, output, help, compact = false }) {
  const right = graded.state === 'right';
  const body = h('div', { class: 'cl-term-body' });
  for (const step of shownSteps(graded)) append(body, stepEntry(system, step, help, compact));
  const last = right ? graded.steps[graded.steps.length - 1] : null;
  let printed;
  if (right) {
    printed = echoLine(system, last.typed);
    append(body, printed);
  } else {
    printed = echoLine(system, answer);
    append(body, [noteLine('Answer'), printed]);
  }
  append(body, [outputBlock(output, right ? last.result.line : answer), nextPrompt(system)]);
  return { body, printed };
}

/** The box: a title strip with the system's name (and Show answer while the command is open), then the body. */
export function terminalBox({ system, labelId, action = null, body }) {
  return h('div', { class: 'cl-term', role: 'group', 'aria-labelledby': labelId },
    h('div', { class: 'cl-term-bar' }, h('span', { id: labelId }, systemName(system)), action),
    body,
  );
}
