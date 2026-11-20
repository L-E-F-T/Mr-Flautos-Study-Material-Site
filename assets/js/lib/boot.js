/**
 * Shared start-up for exam pages (flashcards.html, practice.html, commands.html):
 * reads ?exam=, loads that exam's content, applies its theme, fills the header,
 * and returns everything the page needs. Shows a readable error instead of a
 * blank page when something goes wrong.
 * The Command line page serves only an exam that has that tool. For it, this file picks the
 * exam, or sends the browser to the home page, before any pack loads. Every exam page shows
 * the Command line tab only for an exam that has the tool.
 */
import { loadRegistry, loadExamContent, liveExams, findExam, itemsFromPacks, isPlaceholderPack, commandUnits, commandState } from './content.js';
import { objectiveTaxonomy, unitTaxonomy, indexTaxonomy } from './taxonomy.js';
import { h, mount } from './dom.js';

/** Browser implementation of readJSON for content.js. */
export async function fetchJSON(path, { optional = false } = {}) {
  const url = new URL(path, document.baseURI);
  let response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch {
    throw new Error(`Could not reach ${path}. Check your connection, then reload.`);
  }
  if (response.status === 404 && optional) return null;
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status}).`);
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${error.message}`);
  }
}

export function queryFlag(name) {
  const value = new URLSearchParams(window.location.search).get(name);
  return value !== null && value !== '0' && value !== 'false';
}

/** Link to another page of the site, keeping ?exam= and ?drafts=. */
export function pageUrl(page, examId, extra = {}) {
  const params = new URLSearchParams();
  if (examId) params.set('exam', examId);
  if (queryFlag('drafts')) params.set('drafts', '1');
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const query = params.toString();
  return query ? `${page}?${query}` : page;
}

/** Lab-only packs never exist on GitHub Pages (the deploy strips them), so don't ask for them there. */
export function includePrivatePacks() {
  return !window.location.hostname.endsWith('.github.io');
}

export function applySiteChrome(registry) {
  const title = registry.site && registry.site.title;
  if (title) for (const node of document.querySelectorAll('[data-site-title]')) node.textContent = title;
}

export function showFatal(error) {
  const main = document.getElementById('app') || document.querySelector('main');
  if (!main) return;
  const isFile = window.location.protocol === 'file:';
  mount(
    main,
    h('div', { class: 'wrap error-box' },
      h('div', { class: 'notice notice-bad', role: 'alert' },
        h('strong', null, 'This page could not load. '),
        isFile
          ? 'It was opened straight from the folder. Double-click serve.cmd in the project folder, then open http://localhost:8080/.'
          : String(error && error.message ? error.message : error),
      ),
    ),
  );
  // eslint-disable-next-line no-console
  console.error(error);
}

/** Each mode's name, for the browser tab title and the heading of an exam that is not built yet. */
const MODE_NAMES = { flashcards: 'Flashcards', practice: 'Practice test', commands: 'Command line' };

/**
 * Whether an exam has the Command line tool: "commandUnits" in data/exams.json, or, on the
 * teacher's ?drafts=1 look before launch, a commands manifest that lists a pack. Only that look
 * asks for a manifest, in a try of its own: a manifest that cannot be read means no tool.
 */
async function hasCommandLine(exam, preview) {
  if (commandUnits(exam)) return true;
  if (!preview) return false;
  try {
    return (await commandState(fetchJSON, exam, { includePrivate: includePrivatePacks(), preview: true })) === 'ready';
  } catch {
    return false;
  }
}

/**
 * Boot an exam page. `mode` is "flashcards", "practice", or "commands".
 * Resolves to a context object, or null after showing an error or sending the browser
 * to the home page.
 */
export async function bootExamPage(mode) {
  try {
    const registry = await loadRegistry(fetchJSON);
    applySiteChrome(registry);

    const requested = new URLSearchParams(window.location.search).get('exam');
    const live = liveExams(registry);
    const preview = queryFlag('drafts');
    let exam;
    let hasCommands;
    if (mode === 'commands') {
      // The Command line page serves only an exam that has the tool. An address that names an
      // exam without it goes to the home page, so a student is never moved to another exam's
      // page. No exam named, or an id no exam has, opens the first live exam that has the tool.
      const named = requested ? findExam(registry, requested) : null;
      exam = null;
      if (named) {
        if (await hasCommandLine(named, preview)) exam = named;
      } else {
        for (const candidate of live) {
          if (await hasCommandLine(candidate, preview)) {
            exam = candidate;
            break;
          }
        }
      }
      if (!exam) {
        window.location.replace(pageUrl('index.html'));
        return null;
      }
      hasCommands = true;
    } else {
      exam = (requested && findExam(registry, requested)) || live[0];
      if (!exam) throw new Error('No exams are published yet.');
      hasCommands = await hasCommandLine(exam, preview);
    }

    document.documentElement.dataset.examTheme = exam.theme || '';
    const siteTitle = (registry.site && registry.site.title) || 'Cert Prep';
    const modeName = MODE_NAMES[mode] || MODE_NAMES.practice;
    document.title = `${modeName} · ${exam.name} (${exam.code}) · ${siteTitle}`;

    // The Command line tab is in every exam page with the hidden attribute, so a script from
    // before the tool leaves it hidden. It shows for an exam that has the tool, and then the
    // header lays out three tabs (data-tabs="3" in site.css).
    const commandTabs = document.querySelectorAll('.mode-nav [data-mode="commands"]');
    for (const link of commandTabs) link.hidden = !hasCommands;
    if (hasCommands && commandTabs.length > 0) document.documentElement.dataset.tabs = '3';
    else delete document.documentElement.dataset.tabs;

    const titleBox = document.querySelector('[data-exam-title]');
    if (titleBox) {
      titleBox.hidden = false;
      const name = titleBox.querySelector('[data-exam-name]');
      const code = titleBox.querySelector('[data-exam-code]');
      if (name) name.textContent = exam.name;
      if (code) code.textContent = exam.code;
    }
    for (const link of document.querySelectorAll('[data-mode]')) {
      const target = link.getAttribute('data-mode');
      link.setAttribute('href', pageUrl(`${target}.html`, exam.id));
      if (target === mode) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    // The home link keeps ?drafts=1 too (plain index.html otherwise).
    for (const link of document.querySelectorAll('a.brand')) link.setAttribute('href', pageUrl('index.html'));

    // An exam that is listed but not built yet (status "planned" in data/exams.json).
    if (exam.status !== 'live') {
      const main = document.getElementById('app');
      if (main) {
        mount(main,
          h('div', { class: 'wrap' },
            h('div', { class: 'page-head' }, h('h1', null, modeName)),
            h('div', { class: 'notice' }, 'Coming soon'),
          ),
        );
      }
      return null;
    }

    const content = await loadExamContent(fetchJSON, exam, { includePrivate: includePrivatePacks() });
    const placeholderContent = [...content.flashcardPacks, ...content.questionPacks].some(isPlaceholderPack);
    // The Command line page draws the banner itself, once, when its command packs are counted too.
    if (mode !== 'commands') showTestContentBanner(placeholderContent);
    const showDrafts = queryFlag('drafts');
    const keep = (item) => showDrafts || item.status !== 'draft';

    const flashcards = itemsFromPacks(content.flashcardPacks, 'flashcards').filter(keep);
    const questions = itemsFromPacks(content.questionPacks, 'questions').filter(keep);

    const objectiveRoots = objectiveTaxonomy(content.objectives);
    const unitRoots = unitTaxonomy(content.units);

    return {
      registry,
      exam,
      showDrafts,
      // Whether the exam has the Command line tool (its tab shows).
      hasCommands,
      // Whether a flashcard or question pack is marked "placeholder" (the Test content banner).
      placeholderContent,
      objectives: content.objectives,
      units: content.units,
      objectiveRoots,
      unitRoots,
      objectiveIndex: indexTaxonomy(objectiveRoots),
      unitIndex: indexTaxonomy(unitRoots),
      flashcards,
      questions,
      flashcardById: new Map(flashcards.map((card) => [card.id, card])),
      questionById: new Map(questions.map((question) => [question.id, question])),
    };
  } catch (error) {
    showFatal(error);
    return null;
  }
}

/**
 * A strip under the header for as long as any loaded pack is marked
 * "placeholder": true (first-pass test content that will be replaced).
 * bootExamPage draws it on the flashcards and practice pages. On the Command line page it
 * hands back ctx.placeholderContent instead, so the page can add its command packs to that
 * answer and call this once.
 */
export function showTestContentBanner(show) {
  const existing = document.getElementById('test-content-banner');
  if (!show) {
    if (existing) existing.remove();
    return;
  }
  const main = document.querySelector('main');
  if (existing || !main) return;
  main.before(
    h('div', { id: 'test-content-banner', class: 'test-banner', role: 'note' },
      h('div', { class: 'wrap' }, h('strong', null, 'Test content'), ': first pass, to be replaced.'),
    ),
  );
}

/** Display name of a reference source, e.g. "CertMaster Learn A+ Core 1". */
export function sourceTitle(exam, sourceId) {
  const source = exam.sources && exam.sources[sourceId];
  return source ? source.title : sourceId || 'Textbook';
}
