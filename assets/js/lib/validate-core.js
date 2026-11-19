/**
 * Content validator shared by tools/validate.html (browser) and
 * tools/validate-cli.mjs (Node / GitHub Actions). No DOM access here.
 *
 * Errors block deployment. Warnings are worth fixing but never block.
 */
import { loadRegistry, loadExamContent, itemsFromPacks, isPlaceholderPack } from './content.js';
import { objectiveTaxonomy, unitTaxonomy, indexTaxonomy, ancestorAtDepth, naturalCompare } from './taxonomy.js';
import {
  MATCHER_VERSION, SYSTEMS, VERDICTS, buildContext, cleanLine, givenTargets, isCommandLine, matchSpec, plainFormProblems,
  readLine, wordsFor,
} from './command-match.js';

export const MAX_QUOTE_WORDS = 40;
const EXAM_STATUSES = ['live', 'planned', 'hidden'];
const ITEM_STATUSES = ['draft', 'published'];
const ORIGIN_KINDS = ['original', 'certmaster-variation', 'messer-variation', 'practice-exam-variation', 'teacher', 'other'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRIVATE_DIR = /(^|\/)private\//;
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function wordCount(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** House style: no em dashes in student-facing text. */
function checkDashes(warn, where, label, text) {
  if (typeof text === 'string' && text.includes('—')) warn(where, `${label} contains an em dash; house style avoids them.`);
}

/** Load and validate everything. readJSON follows the contract in content.js. */
export async function validateAll(readJSON, { includePrivate = true } = {}) {
  const report = { errors: [], warnings: [], exams: [], caseTable: null };
  const error = (where, message) => report.errors.push({ where, message });
  const warn = (where, message) => report.warnings.push({ where, message });

  // The Command line matcher's test lines run first, on every check.
  report.caseTable = await checkCaseTable(readJSON, error);

  let registry;
  try {
    registry = await loadRegistry(readJSON);
  } catch (e) {
    error('data/exams.json', e.message);
    return report;
  }

  if (!registry || !Array.isArray(registry.exams) || registry.exams.length === 0) {
    error('data/exams.json', 'Must contain a non-empty "exams" array.');
    return report;
  }

  const examIds = new Set();
  for (const [i, exam] of registry.exams.entries()) {
    const where = `data/exams.json › exams[${i}]`;
    if (!nonEmptyString(exam.id) || !SLUG.test(exam.id)) error(where, 'id must be a lowercase slug like "a-plus-core-1".');
    else if (examIds.has(exam.id)) error(where, `Duplicate exam id "${exam.id}".`);
    else examIds.add(exam.id);
    if (!nonEmptyString(exam.code)) error(where, 'code is required (e.g. "220-1201").');
    if (!nonEmptyString(exam.name)) error(where, 'name is required.');
    if (!EXAM_STATUSES.includes(exam.status)) error(where, `status must be one of ${EXAM_STATUSES.join(', ')}.`);
    if (exam.status === 'live') {
      if (!nonEmptyString(exam.dataPath)) error(where, 'Live exams need a dataPath.');
      if (!exam.sources || typeof exam.sources !== 'object' || Object.keys(exam.sources).length === 0) {
        error(where, 'Live exams need a "sources" map naming the textbook(s) used in references.');
      }
    }
  }

  // Ids start with the exam's course code (c1-, n-), so no id is in two exams. An id another
  // exam already uses means the wrong code was used (ids are permanent once published).
  const idOwner = new Map();
  for (const exam of registry.exams.filter((e) => e.status === 'live' && nonEmptyString(e.dataPath))) {
    let content;
    try {
      content = await loadExamContent(readJSON, exam, { includePrivate });
    } catch (e) {
      error(exam.dataPath, e.message);
      continue;
    }
    report.exams.push(validateExam(exam, content, { error, warn }));
    const items = [...itemsFromPacks(content.questionPacks, 'questions'), ...itemsFromPacks(content.flashcardPacks, 'flashcards')];
    for (const item of items) {
      if (!nonEmptyString(item.id)) continue;
      const owner = idOwner.get(item.id);
      if (!owner) idOwner.set(item.id, exam.id);
      else if (owner !== exam.id) error(`${item._pack} › ${item.id}`, `Id already used in ${owner}. Ids start with this exam's course code (docs/CONTENT-GUIDE.md).`);
    }
  }

  return report;
}

function validateExam(exam, content, { error, warn }) {
  const base = exam.dataPath.replace(/\/+$/, '');

  /* ---------- objectives ---------- */
  const objWhere = `${base}/objectives.json`;
  const objectiveIds = new Set();
  const domains = Array.isArray(content.objectives && content.objectives.domains) ? content.objectives.domains : [];
  if (!domains.length) error(objWhere, 'Must contain a non-empty "domains" array.');
  let weightTotal = 0;
  for (const domain of domains) {
    const dWhere = `${objWhere} › ${domain.id}`;
    if (!/^\d+\.0$/.test(domain.id || '')) error(dWhere, `Domain id "${domain.id}" should look like "1.0".`);
    if (objectiveIds.has(domain.id)) error(dWhere, `Duplicate id "${domain.id}".`);
    objectiveIds.add(domain.id);
    if (!nonEmptyString(domain.title)) error(dWhere, 'Domain title is required.');
    if (typeof domain.weight !== 'number') warn(dWhere, 'Domain weight (exam %) is missing.');
    else weightTotal += domain.weight;
    const major = String(domain.id || '').split('.')[0];
    for (const objective of domain.objectives || []) {
      const oWhere = `${objWhere} › ${objective.id}`;
      if (!new RegExp(`^${major}\\.\\d+$`).test(objective.id || '')) error(oWhere, `Objective id "${objective.id}" should start with "${major}." (domain ${domain.id}).`);
      if (objectiveIds.has(objective.id)) error(oWhere, `Duplicate id "${objective.id}".`);
      objectiveIds.add(objective.id);
      if (!nonEmptyString(objective.title)) error(oWhere, 'Objective title is required.');
      for (const sub of objective.subobjectives || []) {
        const sWhere = `${objWhere} › ${sub.id}`;
        if (!String(sub.id || '').startsWith(`${objective.id}.`)) error(sWhere, `Sub-objective id "${sub.id}" should start with "${objective.id}.".`);
        if (objectiveIds.has(sub.id)) error(sWhere, `Duplicate id "${sub.id}".`);
        objectiveIds.add(sub.id);
        if (!nonEmptyString(sub.title)) error(sWhere, 'Sub-objective title is required.');
      }
    }
  }
  if (domains.length && weightTotal !== 100) warn(objWhere, `Domain weights add up to ${weightTotal}%, not 100%.`);

  /* ---------- units ---------- */
  const unitWhere = `${base}/units.json`;
  const unitIds = new Set();
  const units = Array.isArray(content.units && content.units.units) ? content.units.units : [];
  if (!units.length) error(unitWhere, 'Must contain a non-empty "units" array.');
  for (const unit of units) {
    const uWhere = `${unitWhere} › ${unit.id}`;
    if (!/^\d+\.0$/.test(unit.id || '')) error(uWhere, `Unit id "${unit.id}" should look like "3.0".`);
    if (unitIds.has(unit.id)) error(uWhere, `Duplicate id "${unit.id}".`);
    unitIds.add(unit.id);
    if (!nonEmptyString(unit.title)) error(uWhere, 'Unit title is required.');
    if (unit.notOnExam !== undefined && typeof unit.notOnExam !== 'boolean') error(uWhere, '"notOnExam" must be true or false.');
    const major = String(unit.id || '').split('.')[0];
    for (const lesson of unit.subunits || []) {
      const lWhere = `${unitWhere} › ${lesson.id}`;
      if (!new RegExp(`^${major}\\.\\d+$`).test(lesson.id || '')) error(lWhere, `Lesson id "${lesson.id}" should start with "${major}.".`);
      if (unitIds.has(lesson.id)) error(lWhere, `Duplicate id "${lesson.id}".`);
      unitIds.add(lesson.id);
      if (!nonEmptyString(lesson.title)) error(lWhere, 'Lesson title is required.');
      if (lesson.notOnExam !== undefined && typeof lesson.notOnExam !== 'boolean') error(lWhere, '"notOnExam" must be true or false.');
      for (const objectiveId of lesson.objectives || []) {
        if (!objectiveIds.has(objectiveId)) warn(lWhere, `Lists objective "${objectiveId}", which is not in objectives.json.`);
      }
      for (const section of lesson.sections || []) {
        const secWhere = `${unitWhere} › ${section.id}`;
        if (!String(section.id || '').startsWith(`${lesson.id}.`)) error(secWhere, `Section id "${section.id}" should start with "${lesson.id}.".`);
        if (unitIds.has(section.id)) error(secWhere, `Duplicate id "${section.id}".`);
        unitIds.add(section.id);
        if (!nonEmptyString(section.title)) error(secWhere, 'Section title is required.');
      }
    }
  }

  // Placeholder packs ("pack": { "placeholder": true }) are first-pass test content that will be
  // deleted. They still have to load without errors, but they do not count as written content
  // and nobody should spend time polishing them (so no "add a quote" warnings).
  const placeholderPaths = new Set(
    [...content.questionPacks, ...content.flashcardPacks].filter(isPlaceholderPack).map((pack) => pack.path),
  );
  const isPlaceholderItem = (item) => placeholderPaths.has(item._pack);

  const sources = exam.sources || {};
  const checkTags = (where, item) => {
    if (!Array.isArray(item.objectives) || item.objectives.length === 0) {
      // Allowed for lessons with no exam objective (e.g. Unit 1 troubleshooting methodology), but
      // such items only appear when students choose by unit.
      warn(where, 'No objective tag, so it only shows up when students choose by unit.');
    } else for (const tag of item.objectives) if (!objectiveIds.has(tag)) error(where, `Unknown objective "${tag}".`);
    if (!Array.isArray(item.units) || item.units.length === 0) error(where, 'Needs at least one unit/lesson tag in "units".');
    else for (const tag of item.units) if (!unitIds.has(tag)) error(where, `Unknown unit/lesson/section "${tag}".`);
    if (item.status !== undefined && !ITEM_STATUSES.includes(item.status)) error(where, `status must be one of ${ITEM_STATUSES.join(', ')}.`);
  };
  const checkReference = (where, ref, { required, wantQuote = required }) => {
    if (!ref) {
      if (required) error(where, 'Needs a "reference" (textbook section to read).');
      return;
    }
    if (!nonEmptyString(ref.source) || !sources[ref.source]) error(where, `reference.source "${ref.source}" is not one of: ${Object.keys(sources).join(', ')}.`);
    if (!nonEmptyString(ref.section)) error(where, 'reference.section is required (e.g. "3.2.4").');
    else if (!unitIds.has(ref.section)) error(where, `reference.section "${ref.section}" is not in units.json.`);
    if (wantQuote && !nonEmptyString(ref.quote)) warn(where, 'reference.quote is empty: add the line from the book that answers this.');
    if (nonEmptyString(ref.quote) && wordCount(ref.quote) > MAX_QUOTE_WORDS) {
      warn(where, `reference.quote is ${wordCount(ref.quote)} words. Keep quotes to the one or two sentences that answer the question (${MAX_QUOTE_WORDS} words max).`);
    }
  };

  /* ---------- flashcards ---------- */
  const flashcards = itemsFromPacks(content.flashcardPacks, 'flashcards');
  const cardIds = new Set();
  const terms = new Map();
  for (const pack of content.flashcardPacks) {
    if (!pack.data || !Array.isArray(pack.data.flashcards)) error(pack.path, 'Must contain a "flashcards" array.');
  }
  for (const card of flashcards) {
    const where = `${card._pack} › ${card.id || '(no id)'}`;
    if (!nonEmptyString(card.id) || !ID.test(card.id)) error(where, 'id is required (letters, numbers, . _ -).');
    else if (cardIds.has(card.id)) error(where, `Duplicate flashcard id "${card.id}".`);
    else cardIds.add(card.id);
    if (!nonEmptyString(card.term)) error(where, 'term is required.');
    if (!nonEmptyString(card.definition)) error(where, 'definition is required.');
    checkDashes(warn, where, 'term', card.term);
    checkDashes(warn, where, 'definition', card.definition);
    checkTags(where, card);
    checkReference(where, card.reference, { required: false });
    if (nonEmptyString(card.term)) {
      const key = card.term.trim().toLowerCase();
      if (terms.has(key)) warn(where, `Same term as ${terms.get(key)}.`);
      else terms.set(key, card.id);
    }
  }

  /* ---------- questions ---------- */
  const questions = itemsFromPacks(content.questionPacks, 'questions');
  const questionIds = new Set();
  const stems = new Map();
  for (const pack of [...content.questionPacks, ...content.flashcardPacks]) {
    const info = pack.data && pack.data.pack;
    if (isPlaceholderPack(pack)) {
      warn(pack.path, 'PLACEHOLDER: first-pass test content, not approved. Delete this file and its manifest.json entry when the real pack is ready. Do not edit or extend it.');
    } else if (info && info.reviewed === false) {
      warn(pack.path, 'Pack is marked "reviewed": false. Read it through, then set it to true.');
    }
    // What keeps a file off GitHub is WHERE it is stored (.gitignore ignores private/ folders),
    // not which manifest lists it.
    const storedPrivately = PRIVATE_DIR.test(pack.path);
    if (pack.visibility === 'private' && !storedPrivately) {
      error(pack.path, 'Listed in manifest.private.json but not stored inside a private/ folder, so git would commit it and the deploy would publish it. Move it into private/.');
    }
    if (pack.visibility === 'public' && storedPrivately) {
      error(pack.path, 'manifest.json (public) lists a file inside private/. That file is never pushed, so the published site would fail to load it. List it in manifest.private.json instead.');
    }
  }
  for (const pack of content.questionPacks) {
    if (!pack.data || !Array.isArray(pack.data.questions)) error(pack.path, 'Must contain a "questions" array.');
  }
  for (const q of questions) {
    const where = `${q._pack} › ${q.id || '(no id)'}`;
    if (!nonEmptyString(q.id) || !ID.test(q.id)) error(where, 'id is required (letters, numbers, . _ -).');
    else if (questionIds.has(q.id)) error(where, `Duplicate question id "${q.id}".`);
    else questionIds.add(q.id);
    if (!nonEmptyString(q.stem)) error(where, 'stem (the question text) is required.');
    checkDashes(warn, where, 'stem', q.stem);

    const choices = Array.isArray(q.choices) ? q.choices : [];
    if (choices.length < 2) error(where, 'Needs at least 2 choices.');
    const choiceIds = new Set();
    const choiceTexts = new Set();
    for (const choice of choices) {
      if (!nonEmptyString(choice.id)) error(where, 'Every choice needs an id.');
      else if (choiceIds.has(choice.id)) error(where, `Duplicate choice id "${choice.id}".`);
      else choiceIds.add(choice.id);
      if (!nonEmptyString(choice.text)) error(where, `Choice "${choice.id}" needs text.`);
      else {
        const key = choice.text.trim().toLowerCase();
        if (choiceTexts.has(key)) error(where, `Two choices have the same text: "${choice.text}".`);
        choiceTexts.add(key);
        if (/\b(all|none) of the above\b/i.test(choice.text)) warn(where, '"All/None of the above" is not CompTIA style.');
        checkDashes(warn, where, `choice "${choice.id}"`, choice.text);
      }
    }

    const answer = Array.isArray(q.answer) ? q.answer : [];
    if (answer.length === 0) error(where, 'answer must list the correct choice id(s), e.g. ["b"].');
    if (new Set(answer).size !== answer.length) error(where, 'answer lists the same choice twice.');
    for (const id of answer) if (!choiceIds.has(id)) error(where, `answer "${id}" is not one of the choice ids.`);
    if (answer.length >= choices.length && choices.length) error(where, 'Every choice cannot be correct.');
    if (answer.length === 1 && choices.length !== 4) warn(where, `Single-answer questions on the exam have 4 choices; this one has ${choices.length}.`);

    checkTags(where, q);
    checkReference(where, q.reference, { required: true, wantQuote: !isPlaceholderItem(q) });

    const origin = q.origin || {};
    if (q.origin === undefined) warn(where, 'origin is missing (where the question idea came from).');
    else if (!ORIGIN_KINDS.includes(origin.kind)) error(where, `origin.kind must be one of ${ORIGIN_KINDS.join(', ')}.`);
    if (origin.verbatim === true && !PRIVATE_DIR.test(q._pack)) {
      error(where, 'Marked verbatim (copied from a third-party source) but stored outside a private/ folder, so it would be published. Rewrite it, or move its pack into private/ and list it in manifest.private.json.');
    }

    if (q.exhibit && q.exhibit.type === 'image' && !nonEmptyString(q.exhibit.alt)) error(where, 'Image exhibits need alt text.');

    if (nonEmptyString(q.stem)) {
      const key = q.stem.trim().toLowerCase().replace(/\s+/g, ' ');
      if (stems.has(key)) warn(where, `Same question text as ${stems.get(key)}.`);
      else stems.set(key, q.id);
    }
  }

  /* ---------- coverage ---------- */
  const objectiveRoots = objectiveTaxonomy(content.objectives || { domains: [] });
  const unitRoots = unitTaxonomy(content.units || { units: [] });
  const objectiveIndex = indexTaxonomy(objectiveRoots);
  const unitIndex = indexTaxonomy(unitRoots);

  const tally = (roots, index, items, key) => {
    const counts = new Map();
    for (const item of items) {
      const hit = new Set();
      for (const tag of item[key] || []) {
        const node = ancestorAtDepth(index, tag, 2);
        if (node) hit.add(node.id);
      }
      for (const id of hit) counts.set(id, (counts.get(id) || 0) + 1);
    }
    const rows = [];
    for (const root of roots) {
      for (const child of root.children) rows.push({ id: child.id, title: child.title, parent: root.id, count: counts.get(child.id) || 0 });
    }
    return { rows, counts };
  };
  // Coverage counts real, published content only: drafts and placeholder items do not count.
  const published = (item) => item.status !== 'draft' && !isPlaceholderItem(item);
  const qObj = tally(objectiveRoots, objectiveIndex, questions.filter(published), 'objectives');
  const fObj = tally(objectiveRoots, objectiveIndex, flashcards.filter(published), 'objectives');
  const qUnit = tally(unitRoots, unitIndex, questions.filter(published), 'units');
  const fUnit = tally(unitRoots, unitIndex, flashcards.filter(published), 'units');

  return {
    id: exam.id,
    code: exam.code,
    name: exam.name,
    stats: {
      objectives: [...objectiveIds].filter((id) => /^\d+\.\d+$/.test(id)).length,
      lessons: unitRoots.reduce((n, unit) => n + unit.children.length, 0),
      flashcards: flashcards.length,
      questions: questions.length,
      drafts: [...flashcards, ...questions].filter((item) => item.status === 'draft').length,
      privateItems: [...flashcards, ...questions].filter((item) => item._visibility === 'private').length,
      placeholderItems: [...flashcards, ...questions].filter(isPlaceholderItem).length,
      placeholderPacks: placeholderPaths.size,
      quotesMissing: questions.filter((q) => !isPlaceholderItem(q) && !(q.reference && nonEmptyString(q.reference.quote))).length,
      multiAnswer: questions.filter((q) => Array.isArray(q.answer) && q.answer.length > 1).length,
    },
    coverage: {
      byObjective: qObj.rows.map((row) => ({ ...row, questions: row.count, flashcards: fObj.counts.get(row.id) || 0 })),
      byLesson: qUnit.rows.map((row) => ({ ...row, questions: row.count, flashcards: fUnit.counts.get(row.id) || 0 })),
    },
  };
}

/* ---------- Command line: the matcher's case table (tools/command-cases.json) ---------- */

export const CASE_TABLE_PATH = 'tools/command-cases.json';
const EVIDENCE = ['run', 'doc', 'rule', 'gk', 'notrun'];
const CASE_TABLE_FIELDS = ['note', 'matcher', 'sets', 'cases', 'given', 'commandLines'];
const CASE_SET_FIELDS = ['system', 'groups', 'given', 'alsoWorks'];
const CASE_ROW_FIELDS = ['s', 't', 'x', 'g', 'line', 'exact', 'on', 'label', 'tag', 'keep', 'why', 'ev'];
const GIVEN_ROW_FIELDS = ['task', 'lines', 'want', 'why', 'ev'];
const COMMAND_LINE_ROW_FIELDS = ['t', 'want', 'why', 'ev'];
const RESULT_FIELDS = ['verdict', 'code', 'counts', 'keepLine', 'typed', 'group', 'line', 'exact', 'word', 'runsOn'];

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isStringList = (value) => Array.isArray(value) && value.every((v) => typeof v === 'string');

/** A typed line as a message shows it: in quotes, with odd characters as \u escapes. */
function showLine(text) {
  const escaped = String(text).replace(/[^\x20-\x7E]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
  return `"${escaped}"`;
}

/**
 * Runs the case table: every row is typed through the matcher and must get what it says, and
 * every fixture set's own lines must be plain and work on their own set. Each failure is an
 * error, so it blocks publishing. Returns { rows, passed, matcher } for the report's line, or
 * null when the table cannot be read.
 */
async function checkCaseTable(readJSON, error) {
  const where = CASE_TABLE_PATH;
  let table;
  try {
    table = await readJSON(CASE_TABLE_PATH);
  } catch (e) {
    error(where, e.message);
    return null;
  }
  if (!isPlainObject(table)) {
    error(where, 'Must be an object with "matcher", "sets", "cases", "given", and "commandLines".');
    return null;
  }
  for (const key of Object.keys(table)) if (!CASE_TABLE_FIELDS.includes(key)) error(where, `Unknown field "${key}".`);
  if (table.matcher !== MATCHER_VERSION) {
    error(where, `"matcher" is ${JSON.stringify(table.matcher)}, but assets/js/lib/command-match.js is matcher ${MATCHER_VERSION}. Change the two together.`);
  }

  // The fixture sets. A broken set is reported, and every row that names it fails.
  const sets = new Map();
  if (!isPlainObject(table.sets)) error(where, '"sets" must be an object of fixture sets.');
  else {
    for (const [name, set] of Object.entries(table.sets)) {
      const problems = caseSetProblems(set);
      if (problems.length) error(`${where} › sets › ${name}`, `${problems.join('; ')}.`);
      else sets.set(name, set);
    }
  }
  const ctx = buildContext([...sets.values()]);
  for (const [name, set] of sets) {
    try {
      checkCaseSet(`${where} › sets › ${name}`, set, ctx, error);
    } catch (e) {
      error(`${where} › sets › ${name}`, `The check stopped: ${e && e.message ? e.message : e}.`);
    }
  }

  // The rows of the three lists. N in the report's line counts all of them.
  let rows = 0;
  let passed = 0;
  const runList = (key, check, label) => {
    const list = table[key];
    if (!Array.isArray(list)) {
      error(where, `"${key}" must be a list of rows.`);
      return;
    }
    list.forEach((row, i) => {
      rows += 1;
      let problems;
      try {
        problems = check(row);
      } catch (e) {
        problems = [`the check stopped: ${e && e.message ? e.message : e}`];
      }
      if (problems.length) error(`${where} › ${key}[${i}]${isPlainObject(row) ? ` ${label(row)}` : ''}`, `${problems.join('; ')}.`);
      else passed += 1;
    });
  };
  runList('cases', (row) => caseRowProblems(row, sets, ctx), (row) => `[${row.s}] ${showLine(row.t)}`);
  runList('given', givenRowProblems, (row) => showLine(row.task));
  runList('commandLines', commandLineRowProblems, (row) => showLine(row.t));
  return { rows, passed, matcher: MATCHER_VERSION };
}

function caseSetProblems(set) {
  if (!isPlainObject(set)) return ['must be an object'];
  const problems = [];
  for (const key of Object.keys(set)) if (!CASE_SET_FIELDS.includes(key)) problems.push(`unknown field "${key}"`);
  if (!SYSTEMS.includes(set.system)) problems.push(`"system" must be one of ${SYSTEMS.join(', ')}`);
  if (!Array.isArray(set.groups) || set.groups.length === 0 || !set.groups.every((group) => isStringList(group) && group.length > 0)) {
    problems.push('"groups" must be a list of answer groups, each a list of lines');
  }
  if (!isStringList(set.given)) problems.push('"given" must be a list of targets');
  if (!isStringList(set.alsoWorks)) problems.push('"alsoWorks" must be a list of lines');
  return problems;
}

// Each stored line is plain, accepted on its own set in its own group, and not the same line to
// the matcher as another. Each alsoWorks line is plain, Not counted on its own set, and not the
// same line to the matcher as a stored line or another alsoWorks line.
function checkCaseSet(where, set, ctx, error) {
  const seen = new Map();
  const twinOf = (line) => {
    const key = readLine(cleanLine(line, set.system), set.system).key;
    if (seen.has(key)) return seen.get(key);
    seen.set(key, line);
    return null;
  };
  set.groups.forEach((lines, group) => {
    for (const line of lines) {
      for (const problem of plainFormProblems(line, set.system)) error(where, `Stored line "${line}" ${problem}.`);
      const r = matchSpec(set, line, ctx);
      if (r.code !== 'accepted' || r.group !== group || r.line !== line) {
        error(where, `Stored line "${line}", typed as it is, gets ${r.code} (group ${r.group}, line ${JSON.stringify(r.line)}), not accepted in group ${group}.`);
      }
      const twin = twinOf(line);
      if (twin !== null) error(where, `Stored line "${line}" is the same line to the matcher as "${twin}".`);
    }
  });
  for (const line of set.alsoWorks) {
    for (const problem of plainFormProblems(line, set.system)) error(where, `alsoWorks line "${line}" ${problem}.`);
    const r = matchSpec(set, line, ctx);
    if (r.code !== 'not-counted' || r.line !== line) error(where, `alsoWorks line "${line}", typed as it is, gets ${r.code}, not Not counted.`);
    const twin = twinOf(line);
    if (twin !== null) error(where, `alsoWorks line "${line}" is the same line to the matcher as "${twin}".`);
  }
}

// Every row has only the fields its list knows, an evidence mark, and a why.
function rowFieldProblems(row, fields) {
  const problems = [];
  for (const key of Object.keys(row)) if (!fields.includes(key)) problems.push(`unknown field "${key}"`);
  if (!hasOwn(row, 'ev') || row.ev === '' || row.ev === null) problems.push('no evidence mark ("ev")');
  else if (!EVIDENCE.includes(row.ev)) problems.push(`the evidence mark "${row.ev}" is not one of ${EVIDENCE.join(', ')}`);
  if (typeof row.why !== 'string' || !row.why.trim()) problems.push('no "why"');
  return problems;
}

// What the page relies on in every result: the same ten fields, the verdict, counts, and
// keepLine of the code's row in VERDICTS, and runsOn on a wrong command only.
function resultShapeProblems(r) {
  if (!isPlainObject(r)) return ['the matcher gave no result'];
  const problems = [];
  const keys = Object.keys(r);
  if (keys.length !== RESULT_FIELDS.length || !RESULT_FIELDS.every((key) => hasOwn(r, key))) {
    problems.push(`the result has the fields ${keys.join(', ')}, not ${RESULT_FIELDS.join(', ')}`);
  }
  const entry = typeof r.code === 'string' && hasOwn(VERDICTS, r.code) ? VERDICTS[r.code] : null;
  if (!entry) problems.push(`the result code ${r.code} is not in VERDICTS`);
  else if (r.verdict !== entry.verdict || r.counts !== entry.counts || r.keepLine !== entry.keepLine) {
    problems.push(`the result for ${r.code} does not match its row in VERDICTS`);
  }
  if (r.runsOn !== null && r.code !== 'wrong-command') problems.push(`runsOn is set on ${r.code}`);
  return problems;
}

function caseRowProblems(row, sets, ctx) {
  if (!isPlainObject(row)) return ['must be an object'];
  const problems = rowFieldProblems(row, CASE_ROW_FIELDS);
  if (typeof row.t !== 'string') problems.push('"t", the typed line, must be text');
  if (typeof row.x !== 'string' || !hasOwn(VERDICTS, row.x)) problems.push(`"x" must be one of ${Object.keys(VERDICTS).join(', ')}`);
  const set = typeof row.s === 'string' && sets.has(row.s) ? sets.get(row.s) : null;
  if (!set) problems.push(`"s" names no fixture set that loaded (${JSON.stringify(row.s)})`);
  if (!set || typeof row.t !== 'string') return problems;

  const r = matchSpec(set, row.t, ctx);
  problems.push(...resultShapeProblems(r));
  if (r.code !== row.x) {
    problems.push(`expected ${row.x} but got ${r.code}`);
  } else {
    const words = wordsFor(r);
    if (hasOwn(row, 'g') && r.group !== row.g) problems.push(`expected group ${row.g} but got ${r.group}`);
    if (hasOwn(row, 'line') && r.line !== row.line) problems.push(`expected the line ${JSON.stringify(row.line)} but got ${JSON.stringify(r.line)}`);
    if (hasOwn(row, 'exact') && r.exact !== row.exact) problems.push(`expected exact ${row.exact} but got ${r.exact}`);
    if (hasOwn(row, 'on')) {
      const on = r.runsOn ? r.runsOn.join(',') : '';
      if (on !== row.on) problems.push(`expected the systems "${row.on}" but got "${on}"`);
    }
    if (hasOwn(row, 'label') && words.label !== row.label) problems.push(`expected the label "${row.label}" but got "${words.label}"`);
    if (hasOwn(row, 'tag') && words.tag !== row.tag) problems.push(`expected the tag "${row.tag}" but got "${words.tag}"`);
    if (hasOwn(row, 'keep') && r.keepLine !== row.keep) problems.push(`expected keepLine ${row.keep} but got ${r.keepLine}`);
  }
  // Only a wrong command and the right command with wrong details use a try (plan section 6).
  const counted = r.code === 'wrong-command' || r.code === 'wrong-details';
  if (r.counts !== counted) problems.push(`counts is ${r.counts} for ${r.code}`);
  return problems;
}

function givenRowProblems(row) {
  if (!isPlainObject(row)) return ['must be an object'];
  const problems = rowFieldProblems(row, GIVEN_ROW_FIELDS);
  if (typeof row.task !== 'string') problems.push('"task" must be text');
  if (!isStringList(row.lines)) problems.push('"lines" must be a list of lines');
  if (!isStringList(row.want)) problems.push('"want" must be a list of targets');
  if (typeof row.task === 'string' && isStringList(row.lines) && isStringList(row.want)) {
    const got = givenTargets(row.task, row.lines);
    const same = got.length === row.want.length && [...got].sort().join('\n') === [...row.want].sort().join('\n');
    if (!same) problems.push(`expected [${row.want.join(', ')}] but got [${got.join(', ')}]`);
  }
  return problems;
}

function commandLineRowProblems(row) {
  if (!isPlainObject(row)) return ['must be an object'];
  const problems = rowFieldProblems(row, COMMAND_LINE_ROW_FIELDS);
  if (typeof row.t !== 'string') problems.push('"t" must be text');
  if (typeof row.want !== 'boolean') problems.push('"want" must be true or false');
  else if (typeof row.t === 'string' && isCommandLine(row.t) !== row.want) problems.push(`expected ${row.want} but got ${!row.want}`);
  return problems;
}

/** The case table's one line, the same in GitHub's log and on the content check page. */
export function caseTableLine(report) {
  const table = report && report.caseTable;
  return table ? `Case table: ${table.passed} of ${table.rows}, matcher ${table.matcher}` : 'Case table: could not be read';
}

/** Plain-text summary for the CLI. */
export function formatReport(report) {
  const lines = [caseTableLine(report)];
  for (const exam of report.exams) {
    const s = exam.stats;
    lines.push(`${exam.name} (${exam.code}): ${s.questions} questions (${s.multiAnswer} choose-two+), ${s.flashcards} flashcards, ${s.drafts} drafts, ${s.privateItems} lab-only, ${s.quotesMissing} questions missing a quote`);
    if (s.placeholderItems) lines.push(`  PLACEHOLDER TEST CONTENT: ${s.placeholderItems} of those items in ${s.placeholderPacks} pack(s) are first-pass and must be replaced before students use the site.`);
    const empty = exam.coverage.byObjective.filter((row) => row.questions === 0).map((row) => row.id);
    if (empty.length) lines.push(`  Objectives with no questions yet: ${empty.sort(naturalCompare).join(', ')}`);
  }
  lines.push('');
  for (const w of report.warnings) lines.push(`WARNING  ${w.where}: ${w.message}`);
  for (const e of report.errors) lines.push(`ERROR    ${e.where}: ${e.message}`);
  lines.push('');
  lines.push(`${report.errors.length} error(s), ${report.warnings.length} warning(s).`);
  return lines.join('\n');
}
