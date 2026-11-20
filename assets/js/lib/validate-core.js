/**
 * Content validator shared by tools/validate.html (browser) and
 * tools/validate-cli.mjs (Node / GitHub Actions). No DOM access here.
 *
 * Errors block deployment. Warnings are worth fixing but never block.
 */
import {
  loadRegistry, loadExamContent, itemsFromPacks, isPlaceholderPack, loadCommandPacks, commandsFromPacks, commandUnits,
} from './content.js';
import { objectiveTaxonomy, unitTaxonomy, indexTaxonomy, ancestorAtDepth, naturalCompare } from './taxonomy.js';
import {
  MATCHER_VERSION, SYSTEMS, VERDICTS, buildContext, cleanLine, givenTargets, isCommandLine, matchSpec, plainFormProblems,
  promptFor, readLine, specFromItem, wordsFor,
} from './command-match.js';
import { drawWeight, exhibitText, isExtra, outputText, partnerIds, partnerQuestions, quotePartner } from './command-items.js';

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
    // The Command line tool's switch. Whether each unit is in units.json is checked with the exam.
    if (exam.commandUnits !== undefined) {
      const list = exam.commandUnits;
      if (!Array.isArray(list)) error(where, 'commandUnits must be a list of unit ids such as "4.0".');
      else if (list.length === 0) error(where, 'commandUnits is empty. List the units, or leave the field out.');
      else {
        const listed = new Set();
        for (const unit of list) {
          if (typeof unit !== 'string' || !/^\d+\.0$/.test(unit)) error(where, `commandUnits lists ${JSON.stringify(unit)}, which is not a unit id such as "4.0".`);
          else if (listed.has(unit)) error(where, `commandUnits lists "${unit}" twice.`);
          listed.add(unit);
        }
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
    // Every live exam's commands folder is read, field or not, in a try of its own: a broken
    // commands manifest is reported without hiding the rest of the exam.
    let commandPacks = [];
    let commandsError = null;
    try {
      commandPacks = await loadCommandPacks(readJSON, exam, { includePrivate });
    } catch (e) {
      commandsError = e;
    }
    report.exams.push(validateExam(exam, content, { error, warn, commandPacks, commandsError }));
    const commands = commandsFromPacks(commandPacks);
    const versionItems = [];
    for (const command of commands) {
      for (const version of Array.isArray(command.versions) ? command.versions : []) {
        if (isPlainObject(version)) versionItems.push({ id: version.id, _pack: `${command._pack} › ${command.id || '(no id)'}` });
      }
    }
    const items = [
      ...itemsFromPacks(content.questionPacks, 'questions'), ...itemsFromPacks(content.flashcardPacks, 'flashcards'),
      ...commands, ...versionItems,
    ];
    for (const item of items) {
      if (!nonEmptyString(item.id)) continue;
      const owner = idOwner.get(item.id);
      if (!owner) idOwner.set(item.id, exam.id);
      else if (owner !== exam.id) error(`${item._pack} › ${item.id}`, `Id already used in ${owner}. Ids start with this exam's course code (docs/CONTENT-GUIDE.md).`);
    }
  }

  return report;
}

function validateExam(exam, content, { error, warn, commandPacks = [], commandsError = null }) {
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
  for (const pack of [...content.questionPacks, ...content.flashcardPacks, ...commandPacks]) {
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

  /* ---------- Command line ---------- */
  const commandLine = checkCommandLine({
    exam, base, commandPacks, commandsError, error, warn, checkTags, checkReference,
    unitIds, unitIndex, questions, flashcards, questionIds, cardIds,
  });

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
    // Null for an exam with no commandUnits and no command pack: it shows no Command line panel.
    commandLine,
  };
}

/* ---------- Command line: command packs (docs/COMMAND-LINE-PLAN.md, Appendix I and section 14) ---------- */

const COMMAND_FIELDS = ['id', 'status', 'typedFormOf', 'origin', 'system', 'task', 'accept', 'alsoWorks', 'versions', 'objectives', 'units', 'reference'];
// commandsFromPacks stamps these on each command. They are not fields of a pack.
const COMMAND_STAMPS = ['_pack', '_visibility', '_set'];
const GROUP_FIELDS = ['lines', 'sections'];
const VERSION_FIELDS = ['id', 'outputs', 'followUp'];
const OUTPUT_FIELDS = ['text', 'exhibitOf'];
const FOLLOW_UP_FIELDS = ['question'];
// A follow-up with any of these holds a question of its own: written in place, refused until phase 3.
const IN_PLACE_FIELDS = ['id', 'stem', 'exhibit', 'choices', 'answer', 'objectives', 'units', 'reference', 'origin'];
const MAX_GROUPS = 3;
const MAX_VERSIONS = 3;
const OUTPUT_LINES = 12;
const OUTPUT_WIDTH = 25;
// The whole word a task names its system with, in any case.
const SYSTEM_WORDS = { windows: 'Windows', linux: 'Linux', router: 'router', switch: 'switch' };
// The loopback answer: never given, so a task whose stored line holds it never prints it.
const LOOPBACK = ['127.0.0.1', 'localhost'];
// Results that read a typed line as one of the command's own lines, with at most a given value typed differently.
const SAME_SHAPE = ['accepted', 'wrong-address', 'wrong-name'];
// The same, and a line with every given value left off: the right choice of a question that asks only for
// the tool (bare ping) reads as the command's own line.
const RIGHT_SHAPE = ['accepted', 'wrong-address', 'wrong-name', 'address-missing', 'name-missing'];

/** A text's words in lower case, without the punctuation at either end of each. */
function taskWords(text) {
  return String(text || '').toLowerCase().split(/\s+/)
    .map((w) => w.replace(/^[("'[{]+/, '').replace(/[.,!?;:)\]}"']+$/, ''))
    .filter(Boolean);
}

/** The texts of a question's right choices. */
function answerTexts(question) {
  const answer = Array.isArray(question.answer) ? question.answer : [];
  const choices = Array.isArray(question.choices) ? question.choices : [];
  return choices.filter((c) => isPlainObject(c) && answer.includes(c.id) && typeof c.text === 'string').map((c) => c.text);
}

/** A matcher result in a message: its label, with the answer group for Accepted. */
function resultWords(r) {
  if (r.code === 'accepted') return `${VERDICTS.accepted.label} in answer group ${r.group + 1}`;
  return wordsFor(r).label || r.code;
}

/** Every address and host name a line holds, as the line writes it, except the loopback answer. */
function lineTargets(line) {
  // The line given as its own task: givenTargets gives each target the task prints. The @ in
  // front of a dig server is taken off the task's words so that the server counts too.
  return givenTargets(line.replace(/(^| )@/g, '$1'), [line]);
}

/** C10 and V6 on what one output prints, and the warnings of C10. */
function checkOutputText(where, what, text, { system, lines, givenLow, error, warn }) {
  const rows = text.split('\n');
  if (rows.length > OUTPUT_LINES) error(where, `${what} has ${rows.length} lines. An output has at most ${OUTPUT_LINES}.`);
  const widest = Math.max(...rows.map((row) => row.length));
  if (widest > OUTPUT_WIDTH) error(where, `${what} has a line of ${widest} characters. A line has at most ${OUTPUT_WIDTH}.`);
  if (text.includes('\t')) error(where, `${what} has a tab.`);
  if (/[–—]/.test(text)) error(where, `${what} has an en or em dash.`);
  if (text === '') return;
  const prompt = promptFor(system);
  if (prompt && text.toLowerCase().startsWith(prompt.toLowerCase())) warn(where, `${what} starts with the prompt.`);
  if (lines.some((line) => line.split(' ')[0].toLowerCase() === 'ping') && /TTL=/i.test(text)) {
    warn(where, `${what} prints TTL=. A ping output prints no TTL value.`);
  }
  const shown = text.toLowerCase();
  const targets = [];
  for (const line of lines) for (const target of lineTargets(line)) if (!targets.includes(target.toLowerCase())) targets.push(target.toLowerCase());
  for (const target of targets) if (givenLow.includes(target) && !shown.includes(target)) warn(where, `${what} never shows ${target}, which the task gives.`);
}

/**
 * The command checks of one live exam: Appendix I of docs/COMMAND-LINE-PLAN.md, read for the
 * frozen shape (schemas/command-pack.schema.json), with the changes in its section 14. Returns
 * what the Command line panel and formatReport show, or null for an exam with no commandUnits
 * and no command pack. Commands are read through command-items.js, as the page reads them.
 */
function checkCommandLine(env) {
  const {
    exam, base, commandPacks, commandsError, error, warn, checkTags, checkReference,
    unitIds, unitIndex, questions, flashcards, questionIds, cardIds,
  } = env;
  const folder = `${base}/commands`;
  if (commandsError) error(folder, commandsError && commandsError.message ? commandsError.message : String(commandsError));
  const hasField = exam.commandUnits !== undefined;
  if (!hasField && commandPacks.length === 0) return null;

  // The gate: the units the field names, and the packs it switches on.
  if (Array.isArray(exam.commandUnits)) {
    for (const unit of new Set(exam.commandUnits)) {
      if (typeof unit === 'string' && /^\d+\.0$/.test(unit) && !unitIds.has(unit)) {
        error(`data/exams.json › ${exam.id}`, `commandUnits names "${unit}", which is not a unit in ${base}/units.json.`);
      }
    }
  }
  if (!commandsError && hasField && commandPacks.length === 0) warn(folder, 'commandUnits is set and no command pack is listed, so the tool reads Coming soon.');
  if (!commandsError && !hasField && commandPacks.length > 0) warn(folder, 'Command packs are listed and commandUnits is not set, so the tool is switched off.');
  for (const pack of commandPacks) {
    if (!pack.data || !Array.isArray(pack.data.commands)) error(pack.path, 'Must contain a "commands" array.');
    const info = pack.data && pack.data.pack;
    if (isPlainObject(info) && info.set !== undefined && info.set !== 'extra') {
      error(pack.path, '"set" in the pack header is "extra" for the extra set, and left out for a launch pack.');
    }
  }

  const commands = commandsFromPacks(commandPacks);
  const placeholderPaths = new Set(commandPacks.filter(isPlaceholderPack).map((pack) => pack.path));
  const questionById = new Map();
  for (const q of questions) if (nonEmptyString(q.id) && !questionById.has(q.id)) questionById.set(q.id, q);
  const cardById = new Map();
  for (const card of flashcards) if (nonEmptyString(card.id) && !cardById.has(card.id)) cardById.set(card.id, card);

  // Ids start with the exam's course code, the one its questions and cards use (n- for Network+).
  const codes = new Set();
  for (const item of [...questions, ...flashcards]) {
    const found = /^([a-z][a-z0-9]*)-u\d{2}-[qf]\d{3}$/.exec(String(item.id || ''));
    if (found) codes.add(found[1]);
  }
  const code = codes.size === 1 ? [...codes][0] : null;
  const idPattern = (letter) => (code ? new RegExp(`^${code}-u\\d{2}-${letter}\\d{3}$`) : new RegExp(`^[a-z][a-z0-9]*-u\\d{2}-${letter}\\d{3}$`));
  const commandIdPattern = idPattern('c');
  const versionIdPattern = idPattern('v');
  const exampleId = (letter) => `${code || 'n'}-u04-${letter}001`;

  // A source item is used once: by a question, or by a command with an origin of its own.
  const sourceKey = (basedOn) => basedOn.trim().replace(/\s+/g, ' ').toLowerCase();
  const sourceUsers = new Map();
  const useSource = (basedOn, item, label) => {
    if (!nonEmptyString(basedOn)) return;
    const key = sourceKey(basedOn);
    if (!sourceUsers.has(key)) sourceUsers.set(key, []);
    sourceUsers.get(key).push({ item, label });
  };
  for (const q of questions) if (isPlainObject(q.origin)) useSource(q.origin.basedOn, q, q.id);
  for (const command of commands) if (isPlainObject(command.origin)) useSource(command.origin.basedOn, command, command.id || '(no id)');

  // What the matcher knows about the whole exam (a command the tool asks elsewhere is Wrong command).
  const specs = new Map();
  for (const command of commands) if (SYSTEMS.includes(command.system)) specs.set(command, specFromItem(command));
  const ctx = buildContext([...specs.values()]);
  const units = commandUnits(exam);
  const notCounted = VERDICTS['not-counted'].label;

  const commandIds = new Set();
  const versionIds = new Set();
  const partnerOwner = new Map();
  const followUpOwner = new Map();
  const firstAnswers = new Map();
  const counts = { commands: commands.length, versions: 0, followUps: 0, extra: 0, drafts: 0, placeholder: 0, labOnly: 0 };
  const lines = [];

  for (const command of commands) {
    const label = nonEmptyString(command.id) ? command.id : '(no id)';
    const where = `${command._pack} › ${label}`;
    const placeholder = placeholderPaths.has(command._pack);
    if (isExtra(command)) counts.extra += 1;
    if (command.status === 'draft') counts.drafts += 1;
    if (placeholder) counts.placeholder += 1;
    if (command._visibility === 'private') counts.labOnly += 1;

    // C17: an unknown field (a misspelled typedFormOf, a refuse list). The page ignores it.
    for (const key of Object.keys(command)) {
      if (!COMMAND_FIELDS.includes(key) && !COMMAND_STAMPS.includes(key)) warn(where, `Unknown field "${key}".`);
    }

    // C1: the id's shape, and an id no other command, version, question, or card uses.
    if (!nonEmptyString(command.id) || !commandIdPattern.test(command.id)) {
      error(where, `id must look like ${exampleId('c')}: the course code, the unit, the letter c, and a number.`);
    }
    if (nonEmptyString(command.id)) {
      if (questionIds.has(command.id)) error(where, `Id "${command.id}" is already a question's id.`);
      else if (cardIds.has(command.id)) error(where, `Id "${command.id}" is already a flashcard's id.`);
      else if (commandIds.has(command.id)) error(where, `Duplicate command id "${command.id}".`);
      else if (versionIds.has(command.id)) error(where, `Id "${command.id}" is already a version's id.`);
      commandIds.add(command.id);
    }

    // C11, first half: status, objective, and unit tags, as for a question.
    checkTags(where, command);

    // C2
    const system = SYSTEMS.includes(command.system) ? command.system : null;
    if (!system) error(where, `system must be one of ${SYSTEMS.join(', ')}.`);
    const spec = system ? specs.get(command) : null;
    const givenLow = spec ? spec.given.map((target) => target.toLowerCase()) : [];

    // C3: the task names its system in words and asks a question, in one or two sentences.
    const task = typeof command.task === 'string' ? command.task : '';
    const words = taskWords(task);
    if (!task.trim()) error(where, 'task is required.');
    else {
      if (system && !new RegExp(`\\b${SYSTEM_WORDS[system]}\\b`, 'i').test(task)) {
        error(where, `The task does not name its system in words (${SYSTEM_WORDS[system]}).`);
      }
      if (!task.trim().endsWith('?')) error(where, 'The task must end with a question mark.');
      const sentences = (task.trim().match(/[.?!](\s|$)/g) || []).length;
      if (sentences > 2) warn(where, `The task has ${sentences} sentences. Keep it to one or two.`);
      checkDashes(warn, where, 'task', task);
    }

    // C4: one to three answer groups, each with its lines.
    const accept = Array.isArray(command.accept) ? command.accept : [];
    const groups = accept.map((group) => (isPlainObject(group) && Array.isArray(group.lines) ? group.lines.filter((line) => typeof line === 'string') : []));
    if (!accept.length) error(where, 'accept must list one to three answer groups.');
    else if (accept.length > MAX_GROUPS) error(where, `accept has ${accept.length} answer groups. A command has at most ${MAX_GROUPS}.`);
    accept.forEach((group, g) => {
      if (!isPlainObject(group) || !Array.isArray(group.lines) || !group.lines.length || !isStringList(group.lines)) {
        error(where, `Answer group ${g + 1} needs "lines", a list of one or more lines.`);
      }
      if (isPlainObject(group)) for (const key of Object.keys(group)) if (!GROUP_FIELDS.includes(key)) warn(where, `Answer group ${g + 1} has an unknown field "${key}".`);
    });
    const stored = groups.flat();

    // C5, C6, C7: each stored line is plain, accepted as it is in its own group, and not the same
    // line to the matcher as another. A line with a fault of its own is not tried as well.
    const keyOf = (line) => readLine(cleanLine(line, system), system).key;
    const seen = new Map();
    if (system) {
      groups.forEach((list, g) => {
        for (const line of list) {
          const problems = plainFormProblems(line, system);
          if (problems.length) error(where, `Stored line "${line}" ${problems.join('; ')}.`);
          const key = keyOf(line);
          if (seen.has(key)) {
            error(where, `Stored line "${line}" is the same line to the matcher as "${seen.get(key)}".`);
            continue;
          }
          seen.set(key, line);
          if (problems.length) continue;
          const r = matchSpec(spec, line, ctx);
          if (r.code !== 'accepted' || r.group !== g || r.line !== line) {
            error(where, `Stored line "${line}", typed as it is, reads ${resultWords(r)}, not ${VERDICTS.accepted.label} in answer group ${g + 1}.`);
          }
        }
      });
    }

    // C8: the task prints every address and host name the stored lines hold, and never the loopback answer.
    if (system) {
      const missing = [];
      const printed = [];
      for (const line of stored) {
        for (const target of lineTargets(line)) {
          const low = target.toLowerCase();
          if (!givenLow.includes(low) && !missing.includes(low)) missing.push(low);
        }
        for (const part of line.toLowerCase().split(' ')) {
          if (LOOPBACK.includes(part) && words.includes(part) && !printed.includes(part)) printed.push(part);
        }
      }
      for (const target of missing) error(where, `The task does not print ${target}, which a stored line holds.`);
      for (const target of printed) error(where, `The task prints ${target}, which is the answer.`);
    }

    // C9: the task holds no stored line and no switch. R4b decides when a task may name the tool;
    // this warns on the gross case only, and never where R4b allows it (a partner question's stem
    // names the tool, or every choice of a partner is a line of it).
    if (system && task.trim()) {
      const joined = ` ${words.join(' ')} `;
      const held = stored.find((line) => line && joined.includes(` ${line.toLowerCase()} `));
      if (held) error(where, `The task holds the stored line "${held}".`);
      const switchWord = words.find((w) => /^[\/-]+[a-z?]/.test(w));
      if (switchWord) error(where, `The task holds a switch (${switchWord}).`);
      if (!held) {
        const partners = partnerQuestions(command, questionById);
        const tools = [];
        for (const line of stored) {
          const tool = line.split(' ')[0].toLowerCase();
          if (tool && !tools.includes(tool)) tools.push(tool);
        }
        for (const tool of tools) {
          if (!words.includes(tool)) continue;
          const plenty = stored.every((line) => {
            const parts = line.toLowerCase().split(' ');
            return parts[0] === tool && parts.filter((part) => !givenLow.includes(part.replace(/^@/, ''))).length >= 2;
          });
          const byPartner = partners.some((q) => taskWords(q.stem).includes(tool) || (Array.isArray(q.choices) && q.choices.length > 0
            && q.choices.every((c) => isPlainObject(c) && typeof c.text === 'string' && c.text.trim().split(/\s+/)[0].toLowerCase() === tool)));
          if (!plenty && !byPartner) {
            warn(where, `The task names its tool, ${tool}. A task names the tool only when every stored line starts with it and has two words the task does not print.`);
          }
        }
      }
    }

    // alsoWorks: each line plain, Not counted on its own command, and not the same line to the
    // matcher as an accepted line or another alsoWorks line.
    let also = [];
    if (command.alsoWorks !== undefined) {
      if (!isStringList(command.alsoWorks)) error(where, 'alsoWorks must be a list of lines.');
      else also = command.alsoWorks;
    }
    if (system) {
      for (const line of also) {
        const problems = plainFormProblems(line, system);
        if (problems.length) {
          error(where, `alsoWorks line "${line}" ${problems.join('; ')}.`);
          continue;
        }
        const key = keyOf(line);
        if (seen.has(key)) {
          error(where, `alsoWorks line "${line}" is the same line to the matcher as "${seen.get(key)}".`);
          continue;
        }
        seen.set(key, line);
        const r = matchSpec(spec, line, ctx);
        if (r.code !== 'not-counted' || r.line !== line) error(where, `alsoWorks line "${line}", typed as it is, reads ${resultWords(r)}, not ${notCounted}.`);
      }
    }

    // C12: every partner is a question or card of this exam, and none is the partner of two commands.
    const ids = partnerIds(command);
    if (command.typedFormOf !== undefined) {
      if (!isStringList(command.typedFormOf) || command.typedFormOf.length === 0) error(where, 'typedFormOf must be a list of question or flashcard ids.');
      else if (ids.length !== command.typedFormOf.length) error(where, 'typedFormOf lists an id twice.');
    }
    let questionPartner = null;
    let cardPartner = null;
    for (const id of ids) {
      const partner = questionById.get(id) || cardById.get(id) || null;
      const kind = questionById.has(id) ? 'question' : cardById.has(id) ? 'card' : /-q\d{3}$/.test(id) ? 'question' : /-f\d{3}$/.test(id) ? 'card' : null;
      if (kind === 'question' && !questionPartner) questionPartner = id;
      if (kind === 'card' && !cardPartner) cardPartner = id;
      if (!partner) {
        error(where, `typedFormOf names ${id}, which is not a question or flashcard of this exam.`);
        continue;
      }
      if (partner.status === 'draft') warn(where, `Its partner ${id} is a draft.`);
      if (command._visibility === 'public' && partner._visibility === 'private') error(where, `Its partner ${id} is lab-only, so the published site would not have it.`);
      if (partnerOwner.has(id)) error(where, `${id} is already the partner of ${partnerOwner.get(id)}. No question or card is the partner of two commands.`);
      else partnerOwner.set(id, label);
    }

    // C13 and C15: an origin exactly when no partner is a question, no partner in the extra set, and
    // a source item no other question or command uses.
    const origin = command.origin;
    if (isExtra(command) && ids.length) error(where, 'A command in a pack marked extra has no typedFormOf.');
    if (!ids.length && origin === undefined) error(where, 'Needs typedFormOf (its partner question or flashcard) or an origin.');
    else if (origin !== undefined && questionPartner) {
      error(where, `Has an origin, but its partner ${questionPartner} is a question. A command that types a question is read through that question's source item.`);
    } else if (origin === undefined && cardPartner && !questionPartner) {
      error(where, `Its partner ${cardPartner} is a flashcard, so it needs an origin: the source item it is modeled on.`);
    }
    if (origin !== undefined) {
      if (!isPlainObject(origin) || !ORIGIN_KINDS.includes(origin.kind)) error(where, `origin.kind must be one of ${ORIGIN_KINDS.join(', ')}.`);
      else {
        if (origin.verbatim === true && !PRIVATE_DIR.test(command._pack)) {
          error(where, 'Marked verbatim (copied from a third-party source) but stored outside a private/ folder, so it would be published. Rewrite it, or move its pack into private/ and list it in manifest.private.json.');
        }
        if (nonEmptyString(origin.basedOn)) {
          const others = (sourceUsers.get(sourceKey(origin.basedOn)) || []).filter((user) => user.item !== command).map((user) => user.label);
          if (others.length) error(where, `Its source item "${origin.basedOn}" is also used by ${others.join(', ')}. A source item is used once.`);
        }
      }
    }

    // C14: the command refuses, by shape, every wrong choice of its partner questions that is a
    // command line (the target-slip rule: the task has addresses of its own), and each right choice
    // that is a command line reads as one of its own lines.
    if (system) {
      const alsoSpec = also.length ? { system, groups: also.map((line) => [line]), given: givenTargets(task, also), alsoWorks: [] } : null;
      for (const q of partnerQuestions(command, questionById)) {
        const answer = Array.isArray(q.answer) ? q.answer : [];
        for (const choice of Array.isArray(q.choices) ? q.choices : []) {
          if (!isPlainObject(choice) || !isCommandLine(choice.text)) continue;
          const r = matchSpec(spec, choice.text, ctx);
          if (answer.includes(choice.id)) {
            if (!RIGHT_SHAPE.includes(r.code)) warn(where, `The right choice "${choice.text}" of ${q.id} reads ${resultWords(r)}, not one of its stored lines.`);
            continue;
          }
          if (SAME_SHAPE.includes(r.code)) error(where, `Stored line "${r.line}" has the shape of the wrong choice "${choice.text}" of ${q.id}.`);
          else if (r.code === 'not-counted' && !also.includes(r.line)) {
            error(where, `The wrong choice "${choice.text}" of ${q.id} reads ${notCounted}, as a short form of "${r.line}".`);
          } else if (r.code === 'switch-typo') {
            error(where, `The wrong choice "${choice.text}" of ${q.id} reads ${resultWords(r)}, one letter off "${r.line}", so it would cost no try.`);
          }
          if (alsoSpec) {
            const a = matchSpec(alsoSpec, choice.text, ctx);
            if (SAME_SHAPE.includes(a.code)) error(where, `alsoWorks line "${a.line}" has the shape of the wrong choice "${choice.text}" of ${q.id}.`);
          }
        }
      }
    }

    // C16
    if (system && groups.length && groups[0].length) {
      const key = `${system} ${keyOf(groups[0][0])}`;
      if (firstAnswers.has(key)) warn(where, `Same first answer as ${firstAnswers.get(key)}.`);
      else firstAnswers.set(key, label);
    }

    // C11, second half: the reference as for a question. No quote is asked for in a placeholder pack,
    // or when a partner question cites the same section (its quote is the one shown).
    checkReference(where, command.reference, { required: true, wantQuote: !placeholder && !quotePartner(command, questionById) });

    // C18: no command is tagged to a unit that commandUnits leaves out.
    if (units) {
      const outside = [];
      for (const tag of Array.isArray(command.units) ? command.units : []) {
        const unit = ancestorAtDepth(unitIndex, tag, 1);
        if (unit && !units.includes(unit.id) && !outside.includes(tag)) outside.push(tag);
      }
      if (outside.length) error(where, `Tagged to ${outside.join(', ')}, in a unit that commandUnits leaves out.`);
    }

    // V1 to V8: the versions, what each answer group prints, and the follow-ups.
    const versions = Array.isArray(command.versions) ? command.versions : [];
    if (!versions.length) error(where, 'versions must list one to three versions.');
    else if (versions.length > MAX_VERSIONS) warn(where, `Has ${versions.length} versions. A command has at most ${MAX_VERSIONS}.`);
    const rightAnswers = [];
    versions.forEach((version, v) => {
      if (!isPlainObject(version)) {
        error(where, `Version ${v + 1} must be an object with "id" and "outputs".`);
        return;
      }
      counts.versions += 1;
      const name = nonEmptyString(version.id) ? version.id : `version ${v + 1}`;
      for (const key of Object.keys(version)) if (!VERSION_FIELDS.includes(key)) warn(where, `Version ${name} has an unknown field "${key}".`);
      if (!nonEmptyString(version.id) || !versionIdPattern.test(version.id)) {
        error(where, `Version ${v + 1}: id must look like ${exampleId('v')}: the course code, the unit, the letter v, and a number.`);
      }
      if (nonEmptyString(version.id)) {
        if (versionIds.has(version.id)) error(where, `Duplicate version id "${version.id}".`);
        else if (commandIds.has(version.id) || questionIds.has(version.id) || cardIds.has(version.id)) {
          error(where, `Version id "${version.id}" is already used by a command, question, or flashcard.`);
        }
        versionIds.add(version.id);
      }

      // V4 and V7: the follow-up names a published question of this exam that has a text exhibit,
      // follows this output only, and whose right answer is not a line this command accepts.
      const followUp = version.followUp;
      let question = null;
      if (followUp !== undefined) {
        counts.followUps += 1;
        if (!isPlainObject(followUp)) error(where, `The follow-up of ${name} must be { "question": "<id>" }.`);
        else if (IN_PLACE_FIELDS.some((key) => hasOwn(followUp, key))) {
          error(where, `The follow-up of ${name} is written in place. Until phase 3 a follow-up names a published question: { "question": "<id>" }.`);
        } else if (!nonEmptyString(followUp.question)) error(where, `The follow-up of ${name} needs "question", the id of a published question.`);
        else {
          for (const key of Object.keys(followUp)) if (!FOLLOW_UP_FIELDS.includes(key)) warn(where, `The follow-up of ${name} has an unknown field "${key}".`);
          question = questionById.get(followUp.question) || null;
          if (!question) error(where, `The follow-up of ${name} names ${followUp.question}, which is not a question of this exam.`);
        }
      }
      if (question) {
        const id = question.id;
        if (question.status === 'draft') error(where, `The follow-up of ${name}, ${id}, is a draft.`);
        if (command._visibility === 'public' && question._visibility === 'private') {
          error(where, `The follow-up of ${name}, ${id}, is lab-only, so the published site would not have it.`);
        }
        if (exhibitText(question) === null) error(where, `The follow-up of ${name}, ${id}, has no text exhibit.`);
        if (followUpOwner.has(id)) error(where, `${id} is already the follow-up of ${followUpOwner.get(id)}. A question follows one output only.`);
        else followUpOwner.set(id, `${label} ${name}`);
        const texts = answerTexts(question);
        if (spec) {
          for (const text of texts) {
            if (matchSpec(spec, text, ctx).code === 'accepted') error(where, `The right answer of its follow-up ${id} ("${text}") is a line this command accepts.`);
          }
        }
        rightAnswers.push({ name, id, key: texts.map((text) => text.trim().toLowerCase()).sort().join('\n') });
      }

      // V1, V2, V5, V6: one output for each answer group, each a text or the exhibit of this
      // version's own follow-up, and what it prints passes C10.
      const outputs = Array.isArray(version.outputs) ? version.outputs : null;
      if (!outputs || !outputs.length) error(where, `Version ${name} needs "outputs", one for each answer group.`);
      else if (accept.length && outputs.length !== accept.length) {
        error(where, `Version ${name} has ${count(outputs.length, 'output', 'outputs')} for ${count(accept.length, 'answer group', 'answer groups')}. It needs one output for each answer group.`);
      }
      let printsExhibit = false;
      let strayExhibit = false;
      (outputs || []).forEach((output, k) => {
        const what = `Output ${k + 1} of ${name}`;
        if (!isPlainObject(output)) {
          error(where, `${what} must be { "text": "..." } or { "exhibitOf": "<id>" }.`);
          return;
        }
        for (const key of Object.keys(output)) if (!OUTPUT_FIELDS.includes(key)) warn(where, `${what} has an unknown field "${key}".`);
        const hasText = output.text !== undefined;
        const hasExhibit = output.exhibitOf !== undefined;
        if (hasText && hasExhibit) {
          error(where, `${what} has both text and exhibitOf.`);
          return;
        }
        if (!hasText && !hasExhibit) {
          error(where, `${what} needs a text or an exhibitOf.`);
          return;
        }
        if (hasText && typeof output.text !== 'string') {
          error(where, `${what}: text must be a string.`);
          return;
        }
        if (hasExhibit) {
          if (!isPlainObject(followUp) || output.exhibitOf !== followUp.question) {
            error(where, `${what} prints the exhibit of ${output.exhibitOf}, which is not this version's follow-up question.`);
            strayExhibit = true;
            return;
          }
          printsExhibit = true;
        }
        if (!system) return;
        const text = outputText(command, version, k, questionById);
        if (text === null) return;   // what keeps it from printing is reported above
        checkOutputText(where, what, text, { system, lines: groups[k] || [], givenLow, error, warn });
      });
      if (question && exhibitText(question) !== null && !printsExhibit && !strayExhibit) {
        error(where, `No output of ${name} prints the exhibit of its follow-up ${question.id}.`);
      }
    });

    // V8: two versions whose follow-ups have the same right answer can be memorized.
    for (let i = 0; i < rightAnswers.length; i++) {
      for (let j = i + 1; j < rightAnswers.length; j++) {
        const a = rightAnswers[i];
        const b = rightAnswers[j];
        if (a.id !== b.id && a.key && a.key === b.key) {
          warn(where, `Versions ${a.name} and ${b.name} have the same right answer to their follow-ups, so it can be memorized.`);
        }
      }
    }

    // The review sheet: every stored line once, under its system, and each alsoWorks line.
    if (system) {
      const weight = drawWeight(command, questionById);
      const ownSection = isPlainObject(command.reference) && typeof command.reference.section === 'string' ? command.reference.section : '';
      groups.forEach((list, g) => {
        const group = accept[g];
        const section = isPlainObject(group) && isStringList(group.sections) && group.sections.length ? group.sections.join(', ') : ownSection;
        for (const line of list) lines.push({ system, line, id: label, group: g + 1, section, weight });
      });
      for (const line of also) lines.push({ system, line, id: label, group: null, section: ownSection, weight });
    }
  }

  return { hasField, counts, lines, commands };
}

/** The Command line line formatReport prints under an exam that has the tool or command packs. */
function count(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function commandLineSummary(commandLine) {
  const n = commandLine.counts;
  return `  Command line: ${count(n.commands, 'command', 'commands')} (${n.extra} extra), ${count(n.versions, 'version', 'versions')}, `
    + `${count(n.followUps, 'follow-up', 'follow-ups')}, ${count(n.drafts, 'draft', 'drafts')}, ${n.labOnly} lab-only`
    + (n.placeholder ? `, ${n.placeholder} placeholder` : '');
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
    if (exam.commandLine) lines.push(commandLineSummary(exam.commandLine));
  }
  lines.push('');
  for (const w of report.warnings) lines.push(`WARNING  ${w.where}: ${w.message}`);
  for (const e of report.errors) lines.push(`ERROR    ${e.where}: ${e.message}`);
  lines.push('');
  lines.push(`${report.errors.length} error(s), ${report.warnings.length} warning(s).`);
  return lines.join('\n');
}
