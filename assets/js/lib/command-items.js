/**
 * Command line tool: how a command is read (docs/COMMAND-LINE-PLAN.md sections 4, 14, and 15).
 * The page and the content check both read a command through this file: its partners, what
 * each answer group prints in a version, the follow-up question, the weight in the draw, the
 * reference it shows, and whether its help is off. No page code: no DOM and no fetch.
 *
 * Questions come in as a lookup by id (questionById): a Map, or anything with get(id).
 *
 * Plain code an old phone can load, like command-match.js: no optional chaining, no nullish
 * operator, and no lookbehind in a regular expression.
 */
import { matchLine, promptFor } from './command-match.js';

function lookUp(lookup, id) {
  if (!lookup || typeof lookup.get !== 'function' || typeof id !== 'string') return null;
  const found = lookup.get(id);
  return found === undefined ? null : found;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** The ids in typedFormOf, each once and in order. An empty list when it has none. */
export function partnerIds(command) {
  const list = command && Array.isArray(command.typedFormOf) ? command.typedFormOf : [];
  const out = [];
  for (const id of list) if (typeof id === 'string' && out.indexOf(id) < 0) out.push(id);
  return out;
}

/** The partner questions the lookup has, in typedFormOf order (a card partner is not one). */
export function partnerQuestions(command, questionById) {
  const out = [];
  for (const id of partnerIds(command)) {
    const question = lookUp(questionById, id);
    if (question) out.push(question);
  }
  return out;
}

/** True for a command from a pack marked "set": "extra" (commandsFromPacks stamps _set). */
export function isExtra(command) {
  return Boolean(command) && command._set === 'extra';
}

/**
 * True when help is off on a command: "help": false (docs/CONTENT-GUIDE.md, "Help off"). There
 * help and a command's own help print Help off. With no field, help is on.
 */
export function helpOff(command) {
  return Boolean(command) && command.help === false;
}

/** The versions of a command, as a list. */
export function versionsOf(command) {
  return command && Array.isArray(command.versions) ? command.versions.filter(isObject) : [];
}

/** The version with this id, or null. A saved drill keeps the version by its id. */
export function versionById(command, id) {
  for (const version of versionsOf(command)) if (version.id === id) return version;
  return null;
}

/** A version's follow-up question, or null when it has none or the lookup does not have it. */
export function followUpOf(version, questionById) {
  const followUp = version && isObject(version.followUp) ? version.followUp : null;
  return followUp ? lookUp(questionById, followUp.question) : null;
}

/** The text of a question's text exhibit, or null when it has none. */
export function exhibitText(question) {
  const exhibit = question && isObject(question.exhibit) ? question.exhibit : null;
  return exhibit && exhibit.type === 'text' && typeof exhibit.text === 'string' ? exhibit.text : null;
}

/**
 * A question's exhibit as the command prints it for one answer group. Its first line is dropped
 * only when that line is the prompt plus a line the same answer group accepts (C:\>ipconfig over
 * the output of ipconfig). Any other first line is kept. Null when the question has no text exhibit.
 */
export function exhibitAsOutput(command, group, question) {
  const text = exhibitText(question);
  if (text === null) return null;
  const lines = text.split('\n');
  const prompt = promptFor(command && command.system);
  const first = lines[0];
  if (prompt && first.substring(0, prompt.length).toLowerCase() === prompt.toLowerCase()) {
    const result = matchLine(command, first.substring(prompt.length));
    if (result.code === 'accepted' && result.group === group) lines.shift();
  }
  return lines.join('\n');
}

/**
 * What answer group `group` (0 for the first) prints in a version, or null when it cannot be
 * printed. An output is a text (which may be empty), or exhibitOf: the exhibit of the version's
 * own follow-up question, read through exhibitAsOutput.
 */
export function outputText(command, version, group, questionById) {
  const outputs = version && Array.isArray(version.outputs) ? version.outputs : [];
  const output = outputs[group];
  if (!isObject(output)) return null;
  const hasText = output.text !== undefined;
  const hasExhibit = output.exhibitOf !== undefined;
  if (hasText === hasExhibit) return null;
  if (hasText) return typeof output.text === 'string' ? output.text : null;
  const followUp = isObject(version.followUp) ? version.followUp : null;
  if (!followUp || followUp.question !== output.exhibitOf) return null;
  return exhibitAsOutput(command, group, lookUp(questionById, followUp.question));
}

/** The number of answer groups a command has. */
export function groupCount(command) {
  return command && Array.isArray(command.accept) ? command.accept.length : 0;
}

/** True when the version prints an output for every answer group and has no more outputs than that. */
export function canPrint(command, version, questionById) {
  const groups = groupCount(command);
  const outputs = version && Array.isArray(version.outputs) ? version.outputs : [];
  if (!groups || outputs.length !== groups) return false;
  for (let g = 0; g < groups; g++) if (outputText(command, version, g, questionById) === null) return false;
  return true;
}

/** The versions the page can show. A command with none is hidden. */
export function printableVersions(command, questionById) {
  return versionsOf(command).filter(function (version) { return canPrint(command, version, questionById); });
}

/**
 * The weight of a source item in the draw: 3 for the practice exam book's two full tests
 * (Practice Tests 6 and 7), 2 for any other Practice Tests chapter, 1 for anything else.
 */
export function sourceWeight(basedOn) {
  const found = /^Practice Tests (\d+)\b/.exec(typeof basedOn === 'string' ? basedOn.trim() : '');
  if (!found) return 1;
  return found[1] === '6' || found[1] === '7' ? 3 : 2;
}

/**
 * A command's weight in the draw, and where it comes from: { weight, from, id, basedOn }.
 * from is 'origin' for a command with an origin of its own (it uses that source), 'partner'
 * for the partner question whose source counts most (id names it), or 'none'.
 * No weight is stored in a pack.
 */
export function drawWeight(command, questionById) {
  if (command && isObject(command.origin)) {
    const basedOn = typeof command.origin.basedOn === 'string' ? command.origin.basedOn : '';
    return { weight: sourceWeight(basedOn), from: 'origin', id: null, basedOn: basedOn };
  }
  let best = { weight: 1, from: 'none', id: null, basedOn: '' };
  for (const question of partnerQuestions(command, questionById)) {
    const basedOn = isObject(question.origin) && typeof question.origin.basedOn === 'string' ? question.origin.basedOn : '';
    const weight = sourceWeight(basedOn);
    if (best.from === 'none' || weight > best.weight) best = { weight: weight, from: 'partner', id: question.id, basedOn: basedOn };
  }
  return best;
}

/** The first partner question that cites the same source and section as the command, or null. */
export function quotePartner(command, questionById) {
  const ref = command && isObject(command.reference) ? command.reference : null;
  if (!ref) return null;
  for (const question of partnerQuestions(command, questionById)) {
    const theirs = isObject(question.reference) ? question.reference : null;
    if (theirs && theirs.source === ref.source && theirs.section === ref.section) return question;
  }
  return null;
}

/**
 * The reference a command shows. A command with an empty quote shows its partner question's
 * quote when both cite the same section, so a fact is quoted once. Null when it has no reference.
 */
export function referenceOf(command, questionById) {
  const ref = command && isObject(command.reference) ? command.reference : null;
  if (!ref) return null;
  if (typeof ref.quote === 'string' && ref.quote.trim()) return ref;
  const partner = quotePartner(command, questionById);
  const quote = partner && typeof partner.reference.quote === 'string' ? partner.reference.quote : '';
  return quote.trim() ? Object.assign({}, ref, { quote: quote }) : ref;
}
