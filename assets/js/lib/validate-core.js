/**
 * Content validator shared by tools/validate.html (browser) and
 * tools/validate-cli.mjs (Node / GitHub Actions). No DOM access here.
 *
 * Errors block deployment. Warnings are worth fixing but never block.
 */
import { loadRegistry, loadExamContent, itemsFromPacks, isPlaceholderPack } from './content.js';
import { objectiveTaxonomy, unitTaxonomy, indexTaxonomy, ancestorAtDepth, naturalCompare } from './taxonomy.js';

export const MAX_QUOTE_WORDS = 40;
const EXAM_STATUSES = ['live', 'planned', 'hidden'];
const ITEM_STATUSES = ['draft', 'published'];
const ORIGIN_KINDS = ['original', 'certmaster-variation', 'messer-variation', 'teacher', 'other'];
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
  const report = { errors: [], warnings: [], exams: [] };
  const error = (where, message) => report.errors.push({ where, message });
  const warn = (where, message) => report.warnings.push({ where, message });

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

  for (const exam of registry.exams.filter((e) => e.status === 'live' && nonEmptyString(e.dataPath))) {
    let content;
    try {
      content = await loadExamContent(readJSON, exam, { includePrivate });
    } catch (e) {
      error(exam.dataPath, e.message);
      continue;
    }
    report.exams.push(validateExam(exam, content, { error, warn }));
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
    const major = String(unit.id || '').split('.')[0];
    for (const lesson of unit.subunits || []) {
      const lWhere = `${unitWhere} › ${lesson.id}`;
      if (!new RegExp(`^${major}\\.\\d+$`).test(lesson.id || '')) error(lWhere, `Lesson id "${lesson.id}" should start with "${major}.".`);
      if (unitIds.has(lesson.id)) error(lWhere, `Duplicate id "${lesson.id}".`);
      unitIds.add(lesson.id);
      if (!nonEmptyString(lesson.title)) error(lWhere, 'Lesson title is required.');
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

/** Plain-text summary for the CLI. */
export function formatReport(report) {
  const lines = [];
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
