/**
 * Content loading shared by the website (fetch) and the validator CLI (Node fs).
 * The caller supplies readJSON(path, { optional }) which returns parsed JSON,
 * or null when `optional` is true and the file does not exist.
 *
 * Layout of one exam's content (paths relative to the site root):
 *   data/exams.json                               registry of every exam
 *   <dataPath>/objectives.json                    domains → objectives → sub-objectives
 *   <dataPath>/units.json                         courseware units → lessons → sections
 *   <dataPath>/flashcards/manifest.json           { "packs": ["unit-03.json", …] }
 *   <dataPath>/questions/manifest.json            { "packs": ["unit-03.json", …] }
 *   <dataPath>/commands/manifest.json             { "packs": ["unit-04.json", …] } for the Command line
 *                                                 tool, loaded apart from the two above (end of this file)
 *   <dataPath>/<kind>/manifest.private.json       OPTIONAL, lab server only, never committed
 */

export const REGISTRY_PATH = 'data/exams.json';
// The two kinds every exam page loads. "commands" is left out on purpose: only the Command line
// page and the content check load command packs (loadCommandPacks), so the flashcards and
// practice pages never download one. Do not add it here or to loadExamContent.
export const CONTENT_KINDS = ['flashcards', 'questions'];

export async function loadRegistry(readJSON) {
  return readJSON(REGISTRY_PATH);
}

export function liveExams(registry) {
  return registry.exams.filter((exam) => exam.status === 'live');
}

export function findExam(registry, id) {
  return registry.exams.find((exam) => exam.id === id) || null;
}

function joinPath(...parts) {
  return parts
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part.replace(/\/+$/, '') : part.replace(/^\/+|\/+$/g, '')))
    .join('/');
}

/** Load every pack listed in a content folder's manifests. */
async function loadPacks(readJSON, folder, { includePrivate }) {
  const manifests = [{ visibility: 'public', file: 'manifest.json' }];
  if (includePrivate) manifests.push({ visibility: 'private', file: 'manifest.private.json' });

  const packs = [];
  for (const { visibility, file } of manifests) {
    const manifest = await readJSON(joinPath(folder, file), { optional: true });
    if (!manifest) continue;
    const files = Array.isArray(manifest.packs) ? manifest.packs : [];
    const loaded = await Promise.all(
      files.map(async (packFile) => {
        const path = joinPath(folder, packFile);
        return { path, visibility, data: await readJSON(path) };
      }),
    );
    packs.push(...loaded);
  }
  return packs;
}

/**
 * Load one exam's taxonomies and content packs.
 * Returns { exam, objectives, units, flashcardPacks, questionPacks }.
 * Command packs are not loaded here (see loadCommandPacks).
 */
export async function loadExamContent(readJSON, exam, { includePrivate = true } = {}) {
  const base = exam.dataPath;
  const [objectives, units, flashcardPacks, questionPacks] = await Promise.all([
    readJSON(joinPath(base, 'objectives.json')),
    readJSON(joinPath(base, 'units.json')),
    loadPacks(readJSON, joinPath(base, 'flashcards'), { includePrivate }),
    loadPacks(readJSON, joinPath(base, 'questions'), { includePrivate }),
  ]);
  return { exam, objectives, units, flashcardPacks, questionPacks };
}

/**
 * Which kinds of content an exam has, read from its manifests alone (no packs are loaded).
 * Returns { flashcards: boolean, questions: boolean }. The home page uses it to label a
 * study mode that has no content yet "Coming soon".
 * The Command line tool is asked about on its own (commandState), so a commands manifest that
 * cannot be read never changes these two answers.
 */
export async function contentAvailable(readJSON, exam, { includePrivate = true } = {}) {
  const files = includePrivate ? ['manifest.json', 'manifest.private.json'] : ['manifest.json'];
  const hasPacks = async (kind) => {
    for (const file of files) {
      const manifest = await readJSON(joinPath(exam.dataPath, kind, file), { optional: true });
      if (manifest && Array.isArray(manifest.packs) && manifest.packs.length > 0) return true;
    }
    return false;
  };
  const [flashcards, questions] = await Promise.all(CONTENT_KINDS.map(hasPacks));
  return { flashcards, questions };
}

/**
 * True for a pack marked as first-pass test content: "pack": { "placeholder": true }.
 * The site shows a "Test content" banner and the content check warns until it is replaced.
 */
export function isPlaceholderPack(pack) {
  return Boolean(pack && pack.data && pack.data.pack && pack.data.pack.placeholder === true);
}

/** Flatten packs into one item list, remembering where each item came from. */
export function itemsFromPacks(packs, key) {
  const items = [];
  for (const pack of packs) {
    const list = pack.data && Array.isArray(pack.data[key]) ? pack.data[key] : [];
    for (const item of list) items.push({ ...item, _pack: pack.path, _visibility: pack.visibility });
  }
  return items;
}

/* ---------- Command line tool (docs/COMMAND-LINE-PLAN.md) ---------- */

/**
 * The units an exam's Command line tool lists ("commandUnits" in data/exams.json), or null
 * when the exam does not have the tool. Only a website chat sets that field.
 */
export function commandUnits(exam) {
  return exam && Array.isArray(exam.commandUnits) && exam.commandUnits.length > 0 ? exam.commandUnits : null;
}

/**
 * Where an exam's Command line tool stands, from the field and the commands manifests alone
 * (no pack is loaded):
 *   'none'   the exam does not have the tool: nothing is shown and nothing is asked for
 *   'soon'   it has the tool and no command pack is listed ("Coming soon")
 *   'ready'  a manifest lists a pack
 * `preview` is the teacher's ?drafts=1 look before launch: an exam without the field is asked
 * too, and is 'ready' when a pack is listed.
 * A manifest that cannot be read throws. Call this in a try of its own, apart from
 * contentAvailable, and fall back on assumedAvailable(exam).commands.
 */
export async function commandState(readJSON, exam, { includePrivate = true, preview = false } = {}) {
  const hasTool = Boolean(commandUnits(exam));
  if (!hasTool && !preview) return 'none';
  // An exam with no folder (not built yet) has no manifest to ask for.
  if (!exam || !exam.dataPath) return hasTool ? 'soon' : 'none';
  const files = includePrivate ? ['manifest.json', 'manifest.private.json'] : ['manifest.json'];
  for (const file of files) {
    const manifest = await readJSON(joinPath(exam.dataPath, 'commands', file), { optional: true });
    if (manifest && Array.isArray(manifest.packs) && manifest.packs.length > 0) return 'ready';
  }
  return hasTool ? 'soon' : 'none';
}

/**
 * What a page assumes when an exam's manifests cannot be read: both study modes exist (the
 * exam's own pages will say what is wrong) and the Command line tool follows the field.
 */
export function assumedAvailable(exam) {
  return { flashcards: true, questions: true, commands: commandUnits(exam) ? 'ready' : 'none' };
}

/**
 * Load every pack an exam's commands manifests list, as { path, visibility, data } like the
 * other two kinds. A missing commands folder gives an empty list.
 * Only the Command line page and the content check call this. Read the commands with
 * commandsFromPacks, never from pack.data directly.
 */
export async function loadCommandPacks(readJSON, exam, { includePrivate = true } = {}) {
  if (!exam || !exam.dataPath) return [];
  return loadPacks(readJSON, joinPath(exam.dataPath, 'commands'), { includePrivate });
}

/**
 * Flatten command packs into one list of commands. As in itemsFromPacks, each command
 * remembers its pack (_pack, _visibility). It is also stamped with its pack's set, because the
 * pack header is dropped here: _set is 'extra' for a pack marked "set": "extra" and 'launch'
 * for a pack with no "set". Any other mark is kept as it is, so a set this code does not know
 * is in neither.
 * A listed pack with no "commands" list is skipped: it is a kind of pack this code does not know.
 */
export function commandsFromPacks(packs) {
  const commands = [];
  for (const pack of packs) {
    const list = pack.data && Array.isArray(pack.data.commands) ? pack.data.commands : null;
    if (!list) continue;
    const mark = pack.data.pack ? pack.data.pack.set : undefined;
    const set = mark === undefined || mark === null ? 'launch' : String(mark);
    for (const command of list) commands.push({ ...command, _pack: pack.path, _visibility: pack.visibility, _set: set });
  }
  return commands;
}
