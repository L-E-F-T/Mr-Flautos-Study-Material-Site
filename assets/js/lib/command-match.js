/**
 * Command line tool: the matcher (docs/COMMAND-LINE-PLAN.md section 6).
 * It says whether a typed line answers a command and, when it does not, what kind of miss it is.
 * No page code: no DOM, no fetch, no import. The page, the content check, and the content
 * check's case table (tools/command-cases.json) call it, so all of them read a line the same way.
 *
 * Plain code an old phone can load: no optional chaining, no nullish operator, and no
 * lookbehind or named group in a regular expression. A typed word is never used as a key of a
 * plain object ("constructor" and "__proto__" are rows of the case table): keys go through own().
 *
 * Only a website chat edits this file, with a test row for every rule, and a Windows rule only
 * after the line was run on a Windows PC. Every change is run through the content check on
 * port 8081 and on port 8091, pushed alone, and its GitHub run is watched.
 *
 * matchSpec takes these steps in this order:
 *   1 clean    zero-width characters go; tabs and odd spaces become spaces; curly quotes become
 *              straight; hyphen look-alikes, an en dash, and a minus sign become one hyphen; an
 *              em dash becomes two; trim; squeeze spaces; drop a pasted copy of the prompt.
 *   2 never    an empty line; help, the question mark, cls, clear, exit; a line that asks for help.
 *   3 read     the line the way its system does (readLine).
 *   4 compare  stored lines are read the same way; equal keys mean accepted; the first group wins.
 *   5 free     Not counted: an alsoWorks line, or on a router or switch a short form of each word.
 *   6 name     a given address or host name typed wrong or left off; an extra period; another
 *              system's command; the right command with wrong details; a command the tool asks
 *              elsewhere; a real command with no item; anything else.
 */

/** tools/command-cases.json carries the same number. Change the two together. */
export const MATCHER_VERSION = 2;

export const SYSTEMS = ['windows', 'linux', 'router', 'switch'];

const PROMPTS = { 'windows': 'C:\\>', 'linux': '$', 'router': 'Router#', 'switch': 'Switch#' };
const SYSTEM_NAMES = { 'windows': 'Windows', 'linux': 'Linux', 'router': 'Router', 'switch': 'Switch' };

/**
 * The one table of words, by result code: the kind of verdict, the label, whether the result
 * counts a try, and whether the typed line stays in the field. The page and the content check
 * print labels through wordsFor(). No other file holds a label.
 */
export const VERDICTS = freezeAll({
  'accepted':        { verdict: 'accepted', label: 'Accepted', counts: false, keepLine: false },
  'wrong-command':   { verdict: 'miss', label: 'Wrong command', counts: true, keepLine: false },
  'wrong-details':   { verdict: 'miss', label: 'Right command, wrong details', counts: true, keepLine: true },
  'wrong-address':   { verdict: 'slip', label: 'Wrong address', counts: false, keepLine: true },
  'wrong-name':      { verdict: 'slip', label: 'Wrong host name', counts: false, keepLine: true },
  'address-missing': { verdict: 'slip', label: 'Address missing', counts: false, keepLine: true },
  'name-missing':    { verdict: 'slip', label: 'Host name missing', counts: false, keepLine: true },
  'extra-period':    { verdict: 'slip', label: 'Extra period', counts: false, keepLine: true },
  'not-counted':     { verdict: 'slip', label: 'Not counted', counts: false, keepLine: true },
  'not-in-tool':     { verdict: 'slip', label: 'Not in this tool', counts: false, keepLine: true },
  'not-recognized':  { verdict: 'slip', label: 'Not recognized', counts: false, keepLine: true },
  'ignored-word':    { verdict: 'ignored', label: 'Not in this tool', counts: false, keepLine: false },
  'empty':           { verdict: 'ignored', label: '', counts: false, keepLine: false },
});

function freezeAll(table) {
  for (const code of Object.keys(table)) Object.freeze(table[code]);
  return Object.freeze(table);
}

// Lines that never count (step 2), and the words that make a line ask for help.
const IGNORED_WORDS = ['help', '?', 'cls', 'clear', 'exit'];
const HELP_LAST_WORDS = ['?', '/?', '-?', '--help'];
const HELP_FIRST_WORDS = ['help', 'man'];

// A command that belongs to another system: Wrong command, with a tag. Checked against the
// reading: 4.4.1 ipconfig (Windows), 4.4.2 ifconfig and ip (Linux), 5.1.8 tracert (Windows) and
// traceroute (Linux and router operating systems), 5.1.7 and 5.6.2 show (router, switch).
const RUNS_ON = {
  'ipconfig': ['windows'], 'tracert': ['windows'],
  'ifconfig': ['linux'], 'ip': ['linux'],
  'traceroute': ['linux', 'router'],
  'show': ['router', 'switch'],
};

// Real command names by system: a real command with no item reads Not in this tool. The
// Windows names were found on a Windows PC with "where"; cmd's own commands and the other
// systems are general knowledge.
const KNOWN = {
  'windows': ['ipconfig', 'ping', 'tracert', 'pathping', 'arp', 'netstat', 'route', 'nslookup', 'getmac', 'hostname',
    'nbtstat', 'netsh', 'net', 'ftp', 'ssh', 'curl', 'whoami', 'systeminfo', 'tasklist', 'gpupdate', 'gpresult',
    'winver', 'sfc', 'chkdsk', 'robocopy', 'nltest', 'dir', 'cd', 'echo', 'type', 'ver'],
  'linux': ['ip', 'ifconfig', 'ping', 'traceroute', 'tracepath', 'mtr', 'dig', 'nslookup', 'host', 'hostname', 'netstat',
    'ss', 'arp', 'route', 'tcpdump', 'nmap', 'curl', 'wget', 'ssh', 'ls', 'cd', 'pwd', 'cat', 'grep', 'man'],
  'router': ['show', 'ping', 'traceroute', 'enable', 'disable', 'configure', 'copy', 'reload', 'telnet', 'ssh', 'debug', 'terminal', 'write'],
  'switch': ['show', 'ping', 'traceroute', 'enable', 'disable', 'configure', 'copy', 'reload', 'telnet', 'ssh', 'debug', 'terminal', 'write'],
};

// Windows ping switches that take a value (from ping /? on a Windows PC). Case matters: -S and -s differ.
const PING_VALUE_SWITCHES = ['n', 'l', 'i', 'v', 'r', 's', 'j', 'k', 'w', 'S', 'c'];

// Device words that may be shortened, with the fewest letters taken. Cisco's own guide gives
// "sh ver" and says "s" is not enough. Every other word is typed in full to be accepted.
const DEVICE_SHORT = [['show', 2]];

// A short form of a device word (the Not counted rule) has at least this many letters.
const SHORT_WORD_MIN = 2;

// Never given, even when the task prints them: there the address is the answer.
const NEVER_GIVEN = ['127.0.0.1', 'localhost'];

/* ---------- small helpers ---------- */

function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
function isPrefix(part, whole) { return part.length > 0 && part.length <= whole.length && whole.substring(0, part.length) === part; }
function knownOn(system, name) { return own(KNOWN, system) && KNOWN[system].indexOf(name) >= 0; }

/** The prompt the box shows: C:\> on Windows, $ on Linux, Router# and Switch# on devices. */
export function promptFor(system) {
  return own(PROMPTS, system) ? PROMPTS[system] : '';
}

/** The system's name for the box's title strip and for a tag: Windows, Linux, Router, or Switch. */
export function systemName(system) {
  return own(SYSTEM_NAMES, system) ? SYSTEM_NAMES[system] : '';
}

/* ---------- step 1: clean ---------- */

/** Step 1. Returns the cleaned text. Nothing else is repaired. */
export function cleanLine(raw, system) {
  let s = String(raw === undefined || raw === null ? '' : raw);
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');                                    // zero-width characters
  s = s.replace(/[\t\r\n\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');     // odd spaces
  s = s.replace(/[\u2018\u2019\u201B]/g, "'").replace(/[\u201C\u201D\u201F]/g, '"'); // curly quotes
  s = s.replace(/[\u2010-\u2013\u2212]/g, '-');                                   // hyphen look-alikes, en dash, minus sign
  s = s.replace(/[\u2014\u2015]/g, '--');                                         // an em dash is two hyphens
  s = s.replace(/ +/g, ' ').replace(/^ +| +$/g, '');
  const prompt = promptFor(system);
  if (prompt && s.substring(0, prompt.length).toLowerCase() === prompt.toLowerCase()) s = s.substring(prompt.length).replace(/^ +/, '');
  return s;
}

/* ---------- targets: an IPv4 address, a MAC address, or a dotted host name ---------- */

function targetOf(token) {
  let sig = '';
  let body = token;
  if (body.charAt(0) === '@') { sig = '@'; body = body.substring(1); }
  const low = body.toLowerCase();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(body)) return { kind: 'ip4', sig: sig, v: sig + body };
  if (/^[0-9a-f]{2}([-:][0-9a-f]{2}){5}$/.test(low) || /^[0-9a-f]{4}(\.[0-9a-f]{4}){2}$/.test(low)) return { kind: 'mac', sig: sig, v: sig + low };
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(low) && /[a-z]/.test(low)) return { kind: 'name', sig: sig, v: sig + low };
  return null;
}

// An IPv4 address of two or three parts, filled out the way Windows reads it: the last part fills
// the bytes that are left (127.1 is 127.0.0.1, 127.256 is 127.0.1.0; run on this PC). Only decimal
// parts with no leading zero: Windows reads a leading zero as octal (127.010 is 127.0.0.8, also
// run), so such a part, and anything else, is returned as typed.
function fullIPv4(token) {
  if (!/^(0|[1-9]\d{0,9})(\.(0|[1-9]\d{0,9})){1,2}$/.test(token)) return token;
  const parts = token.split('.');
  const bytes = [];
  for (let p = 0; p < parts.length - 1; p++) {
    const n = Number(parts[p]);
    if (n > 255) return token;
    bytes.push(n);
  }
  const left = 4 - bytes.length;
  let last = Number(parts[parts.length - 1]);
  if (last >= Math.pow(256, left)) return token;
  const tail = [];
  for (let b = 0; b < left; b++) { tail.unshift(last % 256); last = Math.floor(last / 256); }
  return bytes.concat(tail).join('.');
}

// A one-label host name typed where a dotted name was given.
function looseName(token) {
  const body = token.charAt(0) === '@' ? token.substring(1) : token;
  return /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(body);
}

function labelKind(kind) { return kind === 'name' ? 'name' : 'address'; }

/* ---------- step 3: read a cleaned line the way its system does ---------- */

function word(v) { return { k: 'w', v: v }; }
function sw(v) { return { k: 's', v: v }; }

function plain(token, foldWords) {
  const t = targetOf(token);
  if (t) return { k: 't', v: t.v, kind: t.kind, sig: t.sig };
  return word(foldWords ? token.toLowerCase() : token);
}

function isMarked(token, marks) { return token.length > 1 && marks.indexOf(token.charAt(0)) >= 0; }

function genericTokens(rest, marks, foldSwitch, foldWords) {
  const out = [];
  for (const token of rest) {
    if (isMarked(token, marks)) {
      const body = token.substring(1);
      out.push(sw('-' + (foldSwitch ? body.toLowerCase() : body)));
    } else out.push(plain(token, foldWords));
  }
  return out;
}

// One row of rules for each Windows command. A command with no row is compared as typed.
const WINDOWS_ROWS = {
  'ipconfig': function (rest) { return genericTokens(rest, '/-', true, true); },
  'arp': function (rest) { return genericTokens(rest, '/-', true, true); },
  'tracert': function (rest) { return genericTokens(rest, '/-', false, true); },   // switch letters exact, host names any case
  'route': function (rest) { return genericTokens(rest, '/-', true, true); },
  'ping': function (rest) {
    // Switch letters exact. Each switch, with its value, moves in front of the target. What
    // Windows reads as the same line is read the same (run on this PC): an address of two or
    // three parts is filled out (fullIPv4); -n 4 is dropped, since four echo requests is the
    // default, but not beside -t, because Windows takes the later of the two; and -4 is dropped
    // when the target is an IPv4 address. Before a host name -4 picks the address family, so it stays.
    const switches = [];
    const others = [];
    for (let i = 0; i < rest.length; i++) {
      if (isMarked(rest[i], '/-')) {
        const body = rest[i].substring(1);
        if (PING_VALUE_SWITCHES.indexOf(body) >= 0 && i + 1 < rest.length) { switches.push(sw('-' + body + ' ' + rest[i + 1])); i++; }
        else switches.push(sw('-' + body));
      } else others.push(plain(fullIPv4(rest[i]), true));
    }
    const continuous = switches.some(function (s) { return s.v === '-t'; });
    const toAddress = others.length === 1 && others[0].k === 't' && others[0].kind === 'ip4' && others[0].sig === '';
    const kept = switches.filter(function (s) { return !(s.v === '-n 4' && !continuous) && !(s.v === '-4' && toAddress); });
    return kept.concat(others);
  },
  'netstat': function (rest) {
    // Every word starts with / or -. The letters, in any case, are one set.
    if (!rest.length) return [];
    const letters = [];
    for (const token of rest) {
      if (!/^[\/-][A-Za-z]+$/.test(token)) return genericTokens(rest, '', false, false);   // not a letter set: as typed
      const body = token.substring(1).toLowerCase();
      for (let j = 0; j < body.length; j++) if (letters.indexOf(body.charAt(j)) < 0) letters.push(body.charAt(j));
    }
    letters.sort();
    return [sw('-' + letters.join(''))];
  },
  'nslookup': function (rest) {
    // A hyphen only. The option word exact; ty, typ, type, and any beginning of querytype are one
    // option; the value after = in any case. Options before the name, then the name, then the server.
    const out = [];
    let i = 0;
    for (; i < rest.length && rest[i].charAt(0) === '-' && rest[i].length > 1; i++) {
      const body = rest[i].substring(1);
      const eq = body.indexOf('=');
      let name = eq >= 0 ? body.substring(0, eq) : body;
      const value = eq >= 0 ? body.substring(eq + 1) : null;
      if (name === 'ty' || name === 'typ' || name === 'type' || isPrefix(name, 'querytype')) name = 'type';
      out.push(sw('-' + name + (value === null ? '' : '=' + value.toLowerCase())));
    }
    for (; i < rest.length; i++) out.push(plain(rest[i], true));
    return out;
  },
};

/**
 * Step 3. Reads a cleaned line the way its system does.
 * Returns { system, first, name, toks, key }: first is the command word as typed (what a
 * Not recognized label names), name is the command as read, and key is what is compared.
 */
export function readLine(text, system) {
  const out = { system: system, first: '', name: '', toks: [], key: '' };
  if (typeof text !== 'string' || text === '') return out;
  let parts = text.split(' ');
  let toks;
  if (system === 'windows') {
    // cmd splits the name at a slash (ipconfig/all). The name in any case, without .exe.
    const slash = parts[0].indexOf('/');
    if (slash > 0) parts = [parts[0].substring(0, slash), parts[0].substring(slash)].concat(parts.slice(1));
    out.first = parts[0];
    let name = parts[0].toLowerCase();
    if (name.length > 4 && name.substring(name.length - 4) === '.exe') name = name.substring(0, name.length - 4);
    const row = own(WINDOWS_ROWS, name) ? WINDOWS_ROWS[name] : null;
    toks = [word(name)].concat(row ? row(parts.slice(1)) : genericTokens(parts.slice(1), '', false, false));
  } else if (system === 'linux') {
    // Case matters, except the first letter of the line (a phone capitalizes it) and a DNS name.
    // A leading sudo is dropped.
    const typedFirst = parts[0];
    parts = parts.slice(0);
    parts[0] = typedFirst.charAt(0).toLowerCase() + typedFirst.substring(1);
    if (parts[0] === 'sudo' && parts.length > 1) { parts.shift(); out.first = parts[0]; }
    else out.first = typedFirst;
    let rest = parts.slice(1);
    if (parts[0] === 'ip' && rest.length && isPrefix(rest[0], 'address')) {
      rest[0] = 'address';
      if (rest.length === 1) rest.push('show');                 // no action word means show
      else if (isPrefix(rest[1], 'show') || isPrefix(rest[1], 'list') || isPrefix(rest[1], 'lst')) rest[1] = 'show';
    }
    if (parts[0] === 'dig') {                                   // dig reads @server wherever it sits
      const at = [];
      const other = [];
      for (const token of rest) (token.charAt(0) === '@' ? at : other).push(token);
      rest = at.concat(other);
    }
    toks = [word(parts[0])];
    for (const token of rest) toks.push(token.charAt(0) === '-' && token.length > 1 ? sw(token) : plain(token, false));
  } else {
    // Router and switch: any case. sh, sho, and show are show. Every other word as typed.
    out.first = parts[0];
    toks = [];
    for (let p = 0; p < parts.length; p++) {
      let w = parts[p].toLowerCase();
      if (p === 0) for (const pair of DEVICE_SHORT) if (w.length >= pair[1] && isPrefix(w, pair[0])) w = pair[0];
      toks.push(p === 0 ? word(w) : plain(w, true));
    }
  }
  out.toks = toks;
  out.name = toks[0].v;
  out.key = toks.map(function (t) { return t.v; }).join(' ');
  return out;
}

/* ---------- which targets the task gave ---------- */

/**
 * The addresses and host names of the stored lines that the task prints as whole words. A
 * wrong value of the same kind in the same place then costs no try. The task is split at
 * spaces. A period, comma, question mark, exclamation mark, semicolon, colon, or closing bracket
 * at the end of a word is dropped, and case does not matter. An @ in front of a server in a line
 * is dropped. 127.0.0.1 and localhost are never given.
 */
export function givenTargets(task, lines) {
  const words = [];
  for (const w of String(task === undefined || task === null ? '' : task).split(/\s+/)) {
    const bare = w.replace(/[.,!;:)\]}?]+$/, '').toLowerCase();
    if (bare) words.push(bare);
  }
  const out = [];
  const seen = [];
  for (const line of Array.isArray(lines) ? lines : []) {
    if (typeof line !== 'string') continue;
    for (const part of line.split(' ')) {
      const body = part.charAt(0) === '@' ? part.substring(1) : part;
      if (!body || !targetOf(body)) continue;
      const low = body.toLowerCase();
      if (NEVER_GIVEN.indexOf(low) >= 0 || seen.indexOf(low) >= 0) continue;
      if (words.indexOf(low) >= 0) { seen.push(low); out.push(body); }
    }
  }
  return out;
}

function isGiven(tok, given) {
  if (tok.k === 's') return false;
  const body = (tok.v.charAt(0) === '@' ? tok.v.substring(1) : tok.v).toLowerCase();
  for (const g of given) if (String(g).toLowerCase() === body) return true;
  return false;
}

/* ---------- steps 4 to 6 ---------- */

function readStored(line, system) {
  if (typeof line !== 'string') return null;
  const reading = readLine(cleanLine(line, system), system);
  return reading.toks.length ? reading : null;
}

// Every stored line of a spec, read once: { group, line, reading }.
function storedReadings(spec) {
  const out = [];
  const groups = Array.isArray(spec.groups) ? spec.groups : [];
  for (let g = 0; g < groups.length; g++) {
    for (const line of Array.isArray(groups[g]) ? groups[g] : []) {
      const reading = readStored(line, spec.system);
      if (reading) out.push({ group: g, line: line, reading: reading });
    }
  }
  return out;
}

// The alsoWorks lines of a spec, read the same way as stored lines: { line, reading }.
function alsoReadings(spec) {
  const out = [];
  for (const line of Array.isArray(spec.alsoWorks) ? spec.alsoWorks : []) {
    const reading = readStored(line, spec.system);
    if (reading) out.push({ line: line, reading: reading });
  }
  return out;
}

function findAccepted(stored, typed) {
  for (const s of stored) if (s.reading.key === typed.key) return s;
  return null;
}

// Each typed word is the stored word in the same place, or a beginning of it at least two
// letters long. Only plain words: an address, a host name, or a switch is typed whole.
function shortFormOf(T, S) {
  if (T.length !== S.length) return false;
  for (let i = 0; i < S.length; i++) {
    if (T[i].v === S[i].v) continue;
    if (S[i].k !== 'w' || T[i].k !== 'w') return false;
    if (T[i].v.length < SHORT_WORD_MIN || !isPrefix(T[i].v, S[i].v)) return false;
  }
  return true;
}

// Step 5, a line a real system would run that the tool does not hold (Not counted, no try):
// an alsoWorks line, read the same way as a stored line; or on a router or switch, a line with
// the same number of words as an accepted line or an alsoWorks line, each word that line's word
// or a beginning of it. It carries the line it matched, and the group only for a short form of
// an accepted line.
function notCounted(stored, also, typed, system) {
  for (const a of also) if (a.reading.key === typed.key) return { group: null, line: a.line };
  if (system !== 'router' && system !== 'switch') return null;
  for (const s of stored) if (shortFormOf(typed.toks, s.reading.toks)) return { group: s.group, line: s.line };
  for (const a of also) if (shortFormOf(typed.toks, a.reading.toks)) return { group: null, line: a.line };
  return null;
}

// The line is right except for a target the task gave: a value of the same kind in the place of
// each given target with at least one value different, or every given target left off.
function targetSlip(stored, typed, given) {
  for (const s of stored) {
    const S = s.reading.toks;
    const T = typed.toks;
    const givenIdx = [];
    for (let a = 1; a < S.length; a++) if (isGiven(S[a], given)) givenIdx.push(a);
    if (!givenIdx.length) continue;
    const firstKind = S[givenIdx[0]].kind || 'name';
    if (T.length === S.length) {
      let ok = true;
      let differs = null;
      for (let j = 0; j < S.length && ok; j++) {
        if (givenIdx.indexOf(j) >= 0) {
          const want = S[j].kind || 'name';
          const gotKind = T[j].k === 't' ? T[j].kind : (T[j].k === 'w' && want === 'name' && looseName(T[j].v) ? 'name' : null);
          const sigS = S[j].v.charAt(0) === '@' ? '@' : '';
          const sigT = T[j].v.charAt(0) === '@' ? '@' : '';
          if (gotKind !== want || sigS !== sigT) ok = false;
          else if (T[j].v.toLowerCase() !== S[j].v.toLowerCase() && differs === null) differs = want;
        } else if (T[j].v !== S[j].v) ok = false;
      }
      if (ok && differs !== null) return { code: 'wrong-' + labelKind(differs), line: s.line };
    }
    if (T.length === S.length - givenIdx.length) {
      let same = true;
      let t = 0;
      for (let k = 0; k < S.length && same; k++) {
        if (givenIdx.indexOf(k) >= 0) continue;
        if (T[t].v !== S[k].v) same = false;
        t++;
      }
      if (same) return { code: labelKind(firstKind) + '-missing', line: s.line };
    }
  }
  return null;
}

function stripPeriods(text) {
  const out = [];
  for (const part of text.split(' ')) {
    const bare = part.replace(/\.+$/, '');
    if (bare !== '') out.push(bare);
  }
  return out.join(' ');
}

function asksForHelp(text) {
  const low = text.toLowerCase();
  if (IGNORED_WORDS.indexOf(low) >= 0) return true;
  const parts = low.split(' ');
  if (parts.length < 2) return false;
  return HELP_LAST_WORDS.indexOf(parts[parts.length - 1]) >= 0 || HELP_FIRST_WORDS.indexOf(parts[0]) >= 0;
}

// Every result has the same ten fields. Those that do not apply are null.
function result(code, typed, more) {
  const v = VERDICTS[code];
  const m = more || {};
  return {
    verdict: v.verdict,
    code: code,
    counts: v.counts,
    keepLine: v.keepLine,
    typed: typed,
    group: m.group === undefined ? null : m.group,
    line: m.line === undefined ? null : m.line,
    exact: m.exact === undefined ? null : m.exact,
    word: m.word === undefined ? null : m.word,
    runsOn: m.runsOn === undefined ? null : m.runsOn,
  };
}

/**
 * Steps 1 to 6 on a spec. The case table calls this; the page calls matchLine.
 *   spec  { system, groups: [[line, ...], ...], given: [target, ...], alsoWorks: [line, ...] }
 *   ctx   what buildContext returns, made once for all the commands of an exam
 * Returns { verdict, code, counts, keepLine, typed, group, line, exact, word, runsOn }:
 *   verdict   accepted, miss, slip, or ignored (VERDICTS)
 *   typed     the cleaned line
 *   group     the answer group that matched (accepted), or that a short form belongs to
 *   line      the stored or alsoWorks line that matched
 *   exact     true when the line was typed exactly as stored (accepted only)
 *   word      the command word: as typed for Not recognized and Not in this tool, as read for
 *             Wrong command
 *   runsOn    the systems another system's command runs on (Wrong command only)
 */
export function matchSpec(spec, raw, ctx) {
  const sp = spec || {};
  const system = sp.system;
  const given = Array.isArray(sp.given) ? sp.given : [];
  const text = cleanLine(raw, system);
  if (text === '') return result('empty', text);
  if (asksForHelp(text)) return result('ignored-word', text);

  const stored = storedReadings(sp);
  const also = alsoReadings(sp);
  const typed = readLine(text, system);
  const hit = findAccepted(stored, typed);
  if (hit) return result('accepted', text, { group: hit.group, line: hit.line, exact: text === hit.line });

  const free = notCounted(stored, also, typed, system);
  if (free) return result('not-counted', text, free);

  const slip = targetSlip(stored, typed, given);
  if (slip) return result(slip.code, text, { line: slip.line });

  const noDots = stripPeriods(text);
  if (noDots !== text && noDots !== '') {
    const typed2 = readLine(noDots, system);
    if (findAccepted(stored, typed2) || notCounted(stored, also, typed2, system) || targetSlip(stored, typed2, given)) return result('extra-period', text);
  }

  const name = typed.name;
  const lookup = name.toLowerCase();
  if (own(RUNS_ON, lookup) && RUNS_ON[lookup].indexOf(system) < 0) return result('wrong-command', text, { word: lookup, runsOn: RUNS_ON[lookup].slice() });

  const device = system === 'router' || system === 'switch';
  for (const s of stored) {
    const S = s.reading.toks;
    if (S[0].v !== name) continue;
    if (!device || typed.toks.length === 1 || (S.length > 1 && (isPrefix(typed.toks[1].v, S[1].v) || isPrefix(S[1].v, typed.toks[1].v)))) return result('wrong-details', text);
  }

  const caseName = system === 'linux' ? name : lookup;   // Linux is case sensitive: IP is not ip
  if (ctx && ctx.toolWords && typeof ctx.toolWords.has === 'function' && ctx.toolWords.has(caseName)) return result('wrong-command', text, { word: caseName });
  if (knownOn(system, caseName)) return result('not-in-tool', text, { word: typed.first });
  return result('not-recognized', text, { word: typed.first });
}

/**
 * What matchSpec needs to know about the rest of an exam: the first word of every stored line
 * (a command the tool asks elsewhere is Wrong command). Make it once, from the specs of all the
 * exam's commands: a caller that holds commands passes them through specFromItem first.
 */
export function buildContext(specs) {
  const toolWords = new Set();
  for (const spec of Array.isArray(specs) ? specs : []) {
    if (!spec) continue;
    for (const s of storedReadings(spec)) toolWords.add(s.reading.name.toLowerCase());
  }
  return { toolWords: toolWords };
}

/** A command from a pack as a spec: { system, groups, given, alsoWorks }. */
export function specFromItem(item) {
  const it = item || {};
  const groups = [];
  const lines = [];
  for (const group of Array.isArray(it.accept) ? it.accept : []) {
    const list = group && Array.isArray(group.lines) ? group.lines.filter(function (l) { return typeof l === 'string'; }) : [];
    groups.push(list);
    for (const line of list) lines.push(line);
  }
  return {
    system: it.system,
    groups: groups,
    given: givenTargets(it.task, lines),
    alsoWorks: Array.isArray(it.alsoWorks) ? it.alsoWorks.filter(function (l) { return typeof l === 'string'; }) : [],
  };
}

/** The page's call: matchSpec(specFromItem(item), raw, ctx). */
export function matchLine(item, raw, ctx) {
  return matchSpec(specFromItem(item), raw, ctx);
}

/**
 * The words for a result: { label, tag }. The label is the table's, and Not recognized adds a
 * colon and the typed word, cut at 20 characters (Not recognized: ipconfg). The tag is empty
 * except for another system's command: ifconfig: Linux, or show: Router, Switch.
 */
export function wordsFor(res) {
  if (!res || typeof res.code !== 'string' || !own(VERDICTS, res.code)) return { label: '', tag: '' };
  let label = VERDICTS[res.code].label;
  if (res.code === 'not-recognized' && typeof res.word === 'string' && res.word !== '') label += ': ' + res.word.substring(0, 20);
  let tag = '';
  if (res.code === 'wrong-command' && Array.isArray(res.runsOn) && res.runsOn.length) {
    tag = res.word + ': ' + res.runsOn.map(function (s) { return systemName(s); }).join(', ');
  }
  return { label: label, tag: tag };
}

/**
 * The content check's proof of plain form for a stored line or an alsoWorks line. Returns a list
 * of problems, each to follow the line in a sentence; an empty list means the line is fine.
 */
export function plainFormProblems(line, system) {
  if (typeof line !== 'string' || line === '') return ['is empty'];
  const problems = [];
  if (/[^\x20-\x7E]/.test(line)) problems.push('has a character outside plain keyboard text');
  if (cleanLine(line, system) !== line) problems.push('is not trimmed to single spaces, or starts with the prompt');
  if (line.length > 36) problems.push('is longer than 36 characters');
  if (system !== 'linux' && line !== line.toLowerCase()) problems.push('must be lower case on Windows and on devices');
  const first = line.split(' ')[0];
  if (/\.exe$/i.test(first)) problems.push('must not end the command name with .exe');
  if (first.indexOf('/') > 0) problems.push('needs a space before the slash');
  if (first === 'sudo') problems.push('must not start with sudo');
  if (asksForHelp(line)) problems.push('is a line the tool never counts');
  if (/\.( |$)/.test(line)) problems.push('has a word that ends with a period');
  if (!knownOn(system, first)) problems.push('does not start with a command of this system');   // exact spelling: stored lines are already lower case where case does not matter
  if ((system === 'router' || system === 'switch') && readLine(line, system).key !== line) problems.push('must use full words');
  return problems;
}

/**
 * True when the text's first word, exactly as written in lower case, is a command the matcher
 * knows on any system. A capital first letter means it is not a command line. The content check
 * uses it on a question's choices.
 */
export function isCommandLine(text) {
  if (typeof text !== 'string') return false;
  const first = text.trim().split(/\s+/)[0];
  if (!first) return false;
  for (const system of SYSTEMS) if (knownOn(system, first)) return true;
  return false;
}
