/**
 * Command line tool: the drill's own rules (docs/COMMAND-LINE-PLAN.md sections 4, 7, 14, and 15):
 * which commands the page can show, the weighted draw, the version pick, and grading a saved
 * answer again when the page loads. No page code: no DOM, no fetch, and no saved data. The page
 * (assets/js/pages/commands.js) calls it, and the draw can be tried from the browser console.
 *
 * Plain code an old phone can load, like command-match.js: no optional chaining, no nullish
 * operator, and no lookbehind in a regular expression.
 */
import { matchLine, SYSTEMS } from './command-match.js';
import { partnerIds, printableVersions } from './command-items.js';
import { randomInt, shuffle } from './random.js';

/** Counted tries before Show answer appears. There is no limit on tries (section 15). */
export const SHOW_ANSWER_AFTER = 2;
/** The longest line the field takes, and the longest a saved drill keeps. */
export const MAX_TYPED = 80;
/**
 * The lines a command saves. Past this many, only a line that adds a try and the right line are
 * saved, so the tries and the answer are never lost.
 */
export const MAX_LINES = 50;

function has(lookup, id) {
  return Boolean(lookup) && typeof lookup.has === 'function' && lookup.has(id);
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * The commands the page can show, in pack order: an id, a known system, a task, at least one
 * answer group with a line, unit tags, a version the page can print, and every partner in
 * typedFormOf loaded. A draft shows only on the teacher's ?drafts=1 look. With drafts hidden a
 * draft partner is not loaded, so its command is hidden too, as for a deleted question. A repeated
 * id keeps its first command. Fields the page does not know are ignored.
 * lookups: { questionById, flashcardById }, as bootExamPage gives them.
 */
export function usableCommands(commands, lookups, options) {
  const showDrafts = Boolean(options && options.showDrafts);
  const questions = lookups ? lookups.questionById : null;
  const cards = lookups ? lookups.flashcardById : null;
  const ids = new Set();
  const out = [];
  for (const command of Array.isArray(commands) ? commands : []) {
    if (!isObject(command) || typeof command.id !== 'string' || !command.id || ids.has(command.id)) continue;
    if (SYSTEMS.indexOf(command.system) < 0) continue;
    if (command.status === 'draft' && !showDrafts) continue;
    if (typeof command.task !== 'string' || !command.task.trim()) continue;
    if (!Array.isArray(command.units) || !command.units.length) continue;
    const groups = Array.isArray(command.accept) ? command.accept : [];
    if (!groups.length || !groups.every(function (group) {
      return isObject(group) && Array.isArray(group.lines) && group.lines.some(function (line) { return typeof line === 'string' && line.trim() !== ''; });
    })) continue;
    if (partnerIds(command).some(function (id) { return !has(questions, id) && !has(cards, id); })) continue;
    if (!printableVersions(command, questions).length) continue;
    ids.add(command.id);
    out.push(command);
  }
  return out;
}

/**
 * Draw `count` different ids from pool, a list of { id, weight }. Each pick takes a ticket at
 * random from the weights still in the pool, so a command of weight 3 is picked three times as
 * often as one of weight 1, and a picked command is never picked again. The picks are shuffled,
 * so the order of a drill is not the order of the weights. A count of the whole pool takes every
 * command, and then the weights change nothing.
 */
export function drawIds(pool, count) {
  const left = [];
  for (const entry of Array.isArray(pool) ? pool : []) {
    if (!entry || typeof entry.id !== 'string') continue;
    left.push({ id: entry.id, weight: Math.max(1, Math.floor(Number(entry.weight)) || 1) });
  }
  const n = Math.max(0, Math.min(Math.floor(Number(count)) || 0, left.length));
  const picked = [];
  while (picked.length < n) {
    let total = 0;
    for (const entry of left) total += entry.weight;
    let ticket = randomInt(total);
    let i = 0;
    while (ticket >= left[i].weight) {
      ticket -= left[i].weight;
      i += 1;
    }
    picked.push(left[i].id);
    left.splice(i, 1);
  }
  return shuffle(picked);
}

/**
 * The version a command shows, by id, from the ids of the versions the page can print.
 * options.keep: a version to show again when it is still in the list (Retry, when only the
 * question was missed). options.avoid: the version last shown on this device; another one is
 * picked at random when there is one. Null when the list is empty.
 */
export function pickVersion(ids, options) {
  const list = (Array.isArray(ids) ? ids : []).filter(function (id) { return typeof id === 'string'; });
  if (!list.length) return null;
  const keep = options ? options.keep : null;
  if (typeof keep === 'string' && list.indexOf(keep) >= 0) return keep;
  const avoid = options ? options.avoid : null;
  const others = list.filter(function (id) { return id !== avoid; });
  const from = others.length ? others : list;
  return from[randomInt(from.length)];
}

/**
 * A saved answer graded again with the matcher, so a reload shows what the student saw and a pack
 * edited since is read by its current lines. answer is { lines, shown }: lines are every line run
 * on the command, as typed, ending with the right line once it was run.
 * Gives { state, tries, steps, group, shown, cleared }:
 *   state    'open' until a right line, 'right', or 'shown' (Show answer); there is no try limit
 *   tries    the lines that added a try, the right line included (4 for Correct on try 4)
 *   steps    { typed, result } for each line run, in order, up to the right line
 *   group    the answer group of the right line; 0 for any other state (its answer is shown)
 *   shown    true when Show answer ended the command
 *   cleared  the index of the first step after the last cls or clear: the box shows the steps from it
 * An empty saved line is skipped, and lines after the right line are ignored.
 */
export function gradeAnswer(command, answer, ctx) {
  const lines = answer && Array.isArray(answer.lines) ? answer.lines : [];
  const steps = [];
  let misses = 0;
  let accepted = null;
  let cleared = 0;
  for (const typed of lines) {
    if (typeof typed !== 'string') continue;
    const text = typed.substring(0, MAX_TYPED);
    const result = matchLine(command, text, ctx);
    if (result.code === 'empty') continue;
    steps.push({ typed: text, result: result });
    if (result.code === 'accepted') {
      accepted = result;
      break;
    }
    if (result.counts) misses += 1;
    else if (result.code === 'clear-screen') cleared = steps.length;
  }
  if (accepted) return { state: 'right', tries: misses + 1, steps: steps, group: accepted.group, shown: false, cleared: cleared };
  const shown = Boolean(answer && answer.shown === true);
  return { state: shown ? 'shown' : 'open', tries: misses, steps: steps, group: 0, shown: shown, cleared: cleared };
}

/** The choice ids of a follow-up question in a new order: shuffled, unless the question says shuffleChoices false. */
export function newChoiceOrder(question) {
  const ids = choiceIds(question);
  return question && question.shuffleChoices === false ? ids : shuffle(ids);
}

/** A saved choice order kept for the choices that still exist, then any choice added since. */
export function keptChoiceOrder(question, saved) {
  const current = choiceIds(question);
  const kept = (Array.isArray(saved) ? saved : []).filter(function (id, i, list) { return current.indexOf(id) >= 0 && list.indexOf(id) === i; });
  return kept.concat(current.filter(function (id) { return kept.indexOf(id) < 0; }));
}

/**
 * A saved pick of a follow-up, graded by the question's current key: 'right', 'missed', or 'none'
 * (not checked yet). picked is the list of choice ids checked, as on the practice page, or null.
 * It is right when it holds exactly the question's answer.
 */
export function gradePick(question, picked) {
  if (!Array.isArray(picked)) return 'none';
  const answer = question && Array.isArray(question.answer) ? question.answer : [];
  const chosen = picked.filter(function (id, i) { return picked.indexOf(id) === i; });
  const right = chosen.length === answer.length && chosen.every(function (id) { return answer.indexOf(id) >= 0; });
  return answer.length > 0 && right ? 'right' : 'missed';
}

function choiceIds(question) {
  const choices = question && Array.isArray(question.choices) ? question.choices : [];
  const out = [];
  for (const choice of choices) if (isObject(choice) && typeof choice.id === 'string' && out.indexOf(choice.id) < 0) out.push(choice.id);
  return out;
}
