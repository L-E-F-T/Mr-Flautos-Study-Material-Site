/**
 * Command line tool: the command bank (docs/COMMAND-LINE-PLAN.md section 14). One file per exam,
 * <dataPath>/commands/bank.json, beside the command packs but not listed in their manifest: for
 * each system, every command the drill covers, what it does, every switch the reading teaches for
 * it, and a syntax line for a command that takes an address or a name. The command screen shows
 * the entries of its task's system behind a Command bank toggle, and the content check reads the
 * same file (validate-core.js). The bank's words are content: only the content chat writes them.
 *
 * No DOM and no fetch: the caller passes readJSON, as for content.js. Plain code an old phone can
 * load, like command-match.js: no optional chaining, no nullish operator, and no lookbehind in a
 * regular expression.
 */
import { SYSTEMS, cleanLine, readLine } from './command-match.js';

/** The bank's file name, in the exam's commands folder. */
export const BANK_FILE = 'bank.json';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function filled(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/** Where an exam's bank lives (data/network-plus/commands/bank.json), or null for an exam with no data folder. */
export function bankPath(exam) {
  if (!exam || typeof exam.dataPath !== 'string' || !exam.dataPath) return null;
  return exam.dataPath.replace(/\/+$/, '') + '/commands/' + BANK_FILE;
}

/**
 * Read an exam's bank as { path, data }, or null when it has none (no file: every system reads
 * Coming soon). A file that cannot be read, or is not valid JSON, throws, as a pack does.
 */
export async function loadCommandBank(readJSON, exam) {
  const path = bankPath(exam);
  if (!path) return null;
  const data = await readJSON(path, { optional: true });
  return data === null || data === undefined ? null : { path: path, data: data };
}

/** True for a bank marked as test content: "bank": { "placeholder": true }. */
export function isPlaceholderBank(bank) {
  return Boolean(bank && isObject(bank.data) && isObject(bank.data.bank) && bank.data.bank.placeholder === true);
}

/**
 * The entries the page can show, in file order: each with a known system and a command. An entry
 * keeps only the switches that have both a switch and its words. Fields the page does not know are
 * ignored, and a missing text is an empty string.
 * Gives [{ system, command, does, syntax, section, switches: [{ switch, does, section }] }].
 */
export function bankEntries(bank) {
  const list = bank && isObject(bank.data) && Array.isArray(bank.data.entries) ? bank.data.entries : [];
  const out = [];
  for (const entry of list) {
    if (!isObject(entry) || SYSTEMS.indexOf(entry.system) < 0 || !filled(entry.command)) continue;
    const switches = [];
    for (const row of Array.isArray(entry.switches) ? entry.switches : []) {
      if (isObject(row) && filled(row.switch) && filled(row.does)) {
        switches.push({ switch: row.switch, does: row.does, section: filled(row.section) ? row.section : '' });
      }
    }
    out.push({
      system: entry.system,
      command: entry.command,
      does: filled(entry.does) ? entry.does : '',
      syntax: filled(entry.syntax) ? entry.syntax : '',
      section: filled(entry.section) ? entry.section : '',
      switches: switches,
    });
  }
  return out;
}

/** The entries of one system, in file order. */
export function entriesFor(entries, system) {
  return (Array.isArray(entries) ? entries : []).filter(function (entry) { return entry.system === system; });
}

/** The tool a line starts with, as the matcher reads it (ipconfig, ip, show): the name a bank entry is written with. */
export function toolOf(line, system) {
  return readLine(cleanLine(String(line), system), system).name;
}

const DEVICE = { router: true, 'switch': true };

/**
 * How a switch is compared. On Windows any case, with / and - the same mark; on Linux as written;
 * on a router or switch any case, spaces folded. Only the switch's first word counts (-n <count>
 * is -n), and a value after = is dropped, so -type=mx, -type=<type>, and -type are one switch. On a
 * router or switch the whole text is the switch (ip route), without any <placeholder>.
 */
export function switchKey(text, system) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (DEVICE[system]) return words.filter(function (w) { return !/^<.*>$/.test(w); }).join(' ').toLowerCase();
  let s = words.length ? words[0] : '';
  const eq = s.indexOf('=');
  if (eq > 0) s = s.substring(0, eq);
  if (system === 'windows') s = s.toLowerCase().replace(/^-/, '/');
  return s;
}

/**
 * The switches a stored line uses, as { word, key } (switchKey): on Windows each word after the
 * command that starts with / or -, on Linux each word that starts with -, and on a router or switch
 * the words after show as one switch (show ip route uses ip route). A value the task gives (an
 * address or a name, the @ of a dig server dropped) is never a switch. given: the targets the
 * task prints, as givenTargets in command-match.js gives them.
 */
export function usedSwitches(line, system, given) {
  const givenLow = (Array.isArray(given) ? given : []).map(function (target) { return String(target).toLowerCase(); });
  const words = cleanLine(String(line), system).split(' ').filter(Boolean).slice(1).filter(function (w) {
    return givenLow.indexOf(w.replace(/^@/, '').toLowerCase()) < 0;
  });
  if (DEVICE[system]) return words.length ? [{ word: words.join(' '), key: switchKey(words.join(' '), system) }] : [];
  const mark = system === 'windows' ? /^[\/-]./ : /^-./;
  return words.filter(function (w) { return mark.test(w); }).map(function (w) { return { word: w, key: switchKey(w, system) }; });
}

/**
 * The switches an entry would still need to list a stored line's switch, by key (switchKey): none
 * when it lists the same key. A word of letters and digits that no switch has as a whole
 * (netstat -an) is single letters when the entry lists one of them: it needs the letters it does not
 * list (-no beside -n needs -o). Any other switch needs itself.
 */
export function unlistedSwitches(entry, key, system) {
  const keys = (entry && Array.isArray(entry.switches) ? entry.switches : []).map(function (row) { return switchKey(row.switch, system); });
  if (keys.indexOf(key) >= 0) return [];
  if (DEVICE[system]) return [key];
  const mark = key.charAt(0);
  const letters = key.substring(1);
  if (letters.length < 2 || !/^[A-Za-z0-9]+$/.test(letters)) return [key];
  const missing = [];
  let listsOne = false;
  for (let i = 0; i < letters.length; i++) {
    const one = mark + letters.charAt(i);
    if (keys.indexOf(one) >= 0) listsOne = true;
    else if (missing.indexOf(one) < 0) missing.push(one);
  }
  return listsOne ? missing : [key];
}

/** Whether an entry lists a stored line's switch (unlistedSwitches needs nothing more). */
export function listsSwitch(entry, key, system) {
  return unlistedSwitches(entry, key, system).length === 0;
}
