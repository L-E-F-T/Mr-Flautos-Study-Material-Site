/**
 * Command line tool: what the terminal prints for help, and for a command the system does not know
 * (docs/COMMAND-LINE-PLAN.md section 15). The page (assets/js/pages/commands.js) and the content
 * check's try-a-line box (tools/validate.js) both print through it, so they always agree.
 *
 * The help's text is the command bank (<dataPath>/commands/bank.json, read by command-bank.js).
 * help or ? lists the commands the bank has for the task's system, and a command's own help
 * (ipconfig /?, ip --help, show ?) lists that entry's syntax line and switches. The matcher
 * (command-match.js) says which kind of help a line asks for: help-list or help-command, with the
 * command in result.word.
 *
 * No DOM and no fetch. Plain code an old phone can load, like command-match.js: no optional
 * chaining, no nullish operator, and no lookbehind in a regular expression.
 */
import { promptFor } from './command-match.js';
import { entriesFor } from './command-bank.js';

const DEVICE = { router: true, 'switch': true };
// The words that ask for help, as the matcher reads them, and the words in front that do.
const HELP_MARKS = ['?', '/?', '-?', '--help'];
const HELP_FRONT = ['help', 'man'];

function isHelp(result) {
  return Boolean(result) && (result.code === 'help-list' || result.code === 'help-command');
}

function count(n, one, many) {
  return n + ' ' + (n === 1 ? one : many);
}

/** The bank entry for the command a help line asks about: any case on Windows and on devices, exact on Linux. */
function findEntry(entries, word, system) {
  const want = system === 'linux' ? String(word) : String(word).toLowerCase();
  for (const entry of entries) {
    const have = system === 'linux' ? entry.command : entry.command.toLowerCase();
    if (have === want) return entry;
  }
  return null;
}

/**
 * On a router or switch, the words typed after the command, without the help mark: show ip ? asks
 * for the switches whose first word is ip, and show i? (the mark against the word) for those whose
 * first word starts with i. Gives { words, partial }.
 */
function askedWords(typed) {
  const parts = String(typed).toLowerCase().split(' ').filter(Boolean);
  if (parts.length && HELP_FRONT.indexOf(parts[0]) >= 0) parts.shift();
  parts.shift();
  let partial = false;
  if (parts.length && HELP_MARKS.indexOf(parts[parts.length - 1]) >= 0) parts.pop();
  else if (parts.length && parts[parts.length - 1].length > 1 && parts[parts.length - 1].charAt(parts[parts.length - 1].length - 1) === '?') {
    parts[parts.length - 1] = parts[parts.length - 1].substring(0, parts[parts.length - 1].length - 1);
    partial = true;
  }
  return { words: parts, partial: partial };
}

function startsWith(text, asked) {
  const words = String(text).toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < asked.words.length) return false;
  for (let i = 0; i < asked.words.length; i++) {
    const want = asked.words[i];
    const last = i === asked.words.length - 1;
    if (last && asked.partial ? words[i].substring(0, want.length) !== want : words[i] !== want) return false;
  }
  return true;
}

function only(kind) {
  return { kind: kind, rows: [], count: 0 };
}

/**
 * What a help line prints, from the bank's entries (bankEntries in command-bank.js) and the
 * matcher's result for the line. off: help is off on this command (docs/COMMAND-LINE-PLAN.md
 * section 15, push 3). Gives { kind, rows, count }, or null when the result is not help. Each row
 * is { head, words }: a command or switch, and its words.
 *   list          every entry of the system, in file order (count: the commands)
 *   command       the entry of the command asked about: first its syntax line (or its name) with
 *                 its words, as a usage text starts, then its switches (count: the switches). On a
 *                 router or switch, a line with words after the command (show ip ?) lists only the
 *                 switches that start with them, and no first row.
 *   unrecognized  a router or switch help line whose words start no switch
 *   none          a real command of the system with no entry
 *   soon          the system has no entry
 *   off           help is off on this command
 */
export function helpFor(entries, system, result, off) {
  if (!isHelp(result)) return null;
  if (off) return only('off');
  const own = entriesFor(entries, system);
  if (!own.length) return only('soon');
  if (result.code === 'help-list') {
    return { kind: 'list', rows: own.map(function (entry) { return { head: entry.command, words: entry.does }; }), count: own.length };
  }
  const entry = findEntry(own, result.word, system);
  if (!entry) return only('none');
  let switches = entry.switches;
  let first = [{ head: entry.syntax || entry.command, words: entry.does }];
  if (DEVICE[system]) {
    const asked = askedWords(result.typed);
    if (asked.words.length) {
      switches = switches.filter(function (row) { return startsWith(row.switch, asked); });
      if (!switches.length) return only('unrecognized');
      first = [];
    }
  }
  const rows = first.concat(switches.map(function (row) { return { head: row.switch, words: row.does }; }));
  return { kind: 'command', rows: rows, count: switches.length };
}

/** The words a help result prints in place of a listing: Help off, Coming soon, Not in this tool, or the device's message. */
export function helpWords(help) {
  if (!help) return '';
  if (help.kind === 'off') return 'Help off';
  if (help.kind === 'soon') return 'Coming soon';
  if (help.kind === 'none') return 'Not in this tool';
  if (help.kind === 'unrecognized') return '% Unrecognized command';
  return '';
}

/** A help result as plain lines: each command or switch, with its words under it, indented two spaces. */
export function helpLines(help) {
  if (!help) return [];
  if (help.kind !== 'list' && help.kind !== 'command') return [helpWords(help)];
  const out = [];
  for (const row of help.rows) {
    out.push(row.head);
    if (row.words) out.push('  ' + row.words);
  }
  return out;
}

/**
 * What a help line listed, in one line, for a review card and for the words read aloud:
 * Help: 7 commands, Help: ipconfig, 8 switches, Help off, Coming soon, Not in this tool.
 */
export function helpNote(help, word) {
  if (!help) return '';
  if (help.kind === 'list') return 'Help: ' + count(help.count, 'command', 'commands');
  if (help.kind === 'command') return 'Help: ' + word + ', ' + count(help.count, 'switch', 'switches');
  return helpWords(help);
}

/** True when a help line on this command printed a listing: help counts as used then, and only then. */
export function usedHelp(steps, entries, system, off) {
  for (const step of Array.isArray(steps) ? steps : []) {
    const help = helpFor(entries, system, step.result, off);
    if (help && (help.kind === 'list' || help.kind === 'command')) return true;
  }
  return false;
}

/**
 * What the system prints for a command it does not know (the matcher's not-recognized result), as
 * lines, the way the real system words it (docs/COMMAND-LINE-PLAN.md section 15, idea 1):
 *   Windows  'ipconfg' is not recognized as an internal or external command,
 *            operable program or batch file.
 *   Linux    ipconfg: command not found
 *   Router or switch, one word: % Unknown command or computer name, or unable to find computer address
 *   Router or switch, more words: a caret under the word's first letter, then
 *            % Invalid input detected at '^' marker.
 *   Router or switch, a help line: % Unrecognized command
 * Null for any other result. The Linux and device texts are general knowledge: nobody on this
 * project can run those systems.
 */
export function systemError(system, result) {
  if (!result || result.code !== 'not-recognized') return null;
  const word = typeof result.word === 'string' && result.word !== '' ? result.word : String(result.typed).split(' ')[0];
  if (system === 'windows') return ["'" + word + "' is not recognized as an internal or external command,", 'operable program or batch file.'];
  if (system === 'linux') return [word + ': command not found'];
  if (!DEVICE[system]) return null;
  const parts = String(result.typed).split(' ').filter(Boolean);
  const last = parts.length ? parts[parts.length - 1] : '';
  if (HELP_MARKS.indexOf(last) >= 0 || (last.length > 1 && last.charAt(last.length - 1) === '?')) return ['% Unrecognized command'];
  if (parts.length <= 1) return ['% Unknown command or computer name, or unable to find computer address'];
  // The caret sits under the word's first letter: the box prints the prompt with no space after it.
  const at = Math.max(0, String(result.typed).indexOf(word));
  let pad = '';
  for (let i = 0; i < promptFor(system).length + at; i++) pad += ' ';
  return [pad + '^', "% Invalid input detected at '^' marker."];
}
