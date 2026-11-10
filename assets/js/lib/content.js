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
 *   <dataPath>/<kind>/manifest.private.json       OPTIONAL, lab server only, never committed
 */

export const REGISTRY_PATH = 'data/exams.json';
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
