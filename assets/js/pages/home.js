/**
 * Home page: one card per exam from data/exams.json. Live exams link to their two study
 * modes, and offer to resume a deck or test the student left unfinished on this device. A
 * small Discard beside each Resume button throws that deck or test away, with an Undo.
 * An exam that is not built yet, or a study mode with no content yet, is labeled "Coming soon".
 */
import { fetchJSON, applySiteChrome, showFatal, pageUrl, includePrivatePacks } from '../lib/boot.js';
import { loadRegistry, contentAvailable } from '../lib/content.js';
import { h, mount, announce } from '../lib/dom.js';
import * as store from '../lib/storage.js';
import { initThemeToggle } from '../lib/theme.js';

initThemeToggle();

// Where the flashcards and practice pages save an exam's deck and its unfinished test.
const deckKey = (examId) => `flashcards:${examId}`;
const testKey = (examId) => `practice-run:${examId}`;

/** A tap this soon after a card changes is the second half of a double tap, and is ignored. */
const DOUBLE_TAP_MS = 500;

/** What is unfinished for an exam on this device (saved by the flashcards and practice pages). */
function unfinished(examId) {
  const cards = store.load(deckKey(examId), null);
  const run = store.load(testKey(examId), null);
  return {
    deck: Boolean(cards && cards.deck && Array.isArray(cards.deck.queue) && cards.deck.queue.length),
    test: Boolean(run && !run.finished && Array.isArray(run.questionIds) && run.questionIds.length),
  };
}

/**
 * Throw away one exam's unfinished deck or test, and nothing else. Returns what it threw away,
 * for Undo, or null when nothing was unfinished (finished, or discarded in another tab, since
 * the card was drawn). The deck's term picks and settings stay, so the flashcards page opens on
 * the term list; the practice page keeps its topic picks, the same as its own Discard button.
 * The test history, other exams, and light or dark mode are never touched.
 */
function discard(examId, kind) {
  if (!unfinished(examId)[kind]) return null;
  if (kind === 'test') {
    const run = store.load(testKey(examId), null);
    store.remove(testKey(examId));
    return run;
  }
  const cards = store.load(deckKey(examId), null);
  store.save(deckKey(examId), { ...cards, deck: null });
  return cards.deck;
}

/** Undo: put back what discard() threw away, unless a new deck or test has been saved since. */
function restore(examId, kind, saved) {
  if (kind === 'test') {
    return store.load(testKey(examId), null) === null && store.save(testKey(examId), saved);
  }
  const cards = store.load(deckKey(examId), null);
  const settings = cards && typeof cards === 'object' ? cards : {};
  return !settings.deck && store.save(deckKey(examId), { ...settings, deck: saved });
}

/**
 * One exam card. `has` says which study modes have content: { flashcards, questions }.
 * Discard throws a deck or test away at once; its row then reads "Deck discarded" beside an
 * Undo until the student leaves the page. After each Discard or Undo the card is drawn again
 * from what is saved.
 */
function examCard(exam, has) {
  // A live exam with no packs at all looks the same as one that is not built yet.
  const live = exam.status === 'live' && (has.flashcards || has.questions);
  // What Discard threw away while this page has been open, kept for Undo: 'deck' or 'test'.
  const undo = new Map();
  let card = null;

  function onDiscard(kind, what) {
    const saved = discard(exam.id, kind);
    if (saved !== null) undo.set(kind, saved);
    redraw(`[data-undo="${kind}"]`, `[data-mode="${kind}"]`);
    if (saved !== null) announce(`${what} discarded.`);
  }

  function onUndo(kind, what) {
    const restored = restore(exam.id, kind, undo.get(kind));
    undo.delete(kind);
    redraw(`[data-discard="${kind}"]`, `[data-mode="${kind}"]`);
    if (restored) announce(`${what} restored.`);
  }

  /** Draw the card again in place, keeping focus where the student was: the first match. */
  function redraw(...selectors) {
    const next = draw();
    card.replaceWith(next);
    card = next;
    const target = selectors.map((selector) => card.querySelector(selector)).find(Boolean);
    if (target) target.focus();
  }

  function draw() {
    const drawnAt = Date.now();
    const onTap = (action) => () => {
      if (Date.now() - drawnAt >= DOUBLE_TAP_MS) action();
    };
    const saved = live ? unfinished(exam.id) : { deck: false, test: false };
    const open = { deck: saved.deck && has.flashcards, test: saved.test && has.questions };

    // Resume is the main action when there is something to resume. Each unfinished deck or
    // test gets a row of its own, deck first like the mode buttons under them: Resume with a
    // small Discard beside it, or, once discarded, "Deck discarded" with Undo in the same spot.
    const row = (kind, what, href) => {
      const name = what.toLowerCase();
      if (undo.has(kind)) {
        return h('div', { class: 'exam-resume' },
          h('span', { class: 'exam-discarded' }, `${what} discarded`),
          h('button', {
            type: 'button', class: 'btn btn-sm exam-undo', 'data-undo': kind,
            'aria-label': `Undo discard ${name}`, onClick: onTap(() => onUndo(kind, what)),
          }, 'Undo'),
        );
      }
      if (!open[kind]) return null;
      return h('div', { class: 'exam-resume' },
        h('a', { class: 'btn btn-primary', href }, `Resume ${name}`),
        h('button', {
          type: 'button', class: 'btn btn-sm exam-discard', 'data-discard': kind,
          'aria-label': `Discard ${name}`, onClick: onTap(() => onDiscard(kind, what)),
        }, 'Discard'),
      );
    };
    const modeClass = open.deck || open.test ? 'btn' : 'btn btn-primary';
    // A mode with no content yet is shown, but it is not a link.
    const mode = (label, kind, ready, href) => (ready
      ? h('a', { class: modeClass, href, 'data-mode': kind }, label)
      : h('span', { class: 'btn is-soon' }, label, h('small', null, 'Coming soon')));

    return h('article', { class: `exam-card${live ? '' : ' is-planned'}`, 'data-theme-key': exam.theme || '' },
      h('div', { class: 'row spread' },
        h('span', { class: 'exam-code' }, exam.code),
        live ? null : h('span', { class: 'chip' }, 'Coming soon'),
      ),
      h('h2', null, exam.name),
      exam.blurb ? h('p', null, exam.blurb) : null,
      live
        ? h('div', { class: 'exam-actions' },
            row('deck', 'Deck', pageUrl('flashcards.html', exam.id)),
            row('test', 'Test', pageUrl('practice.html', exam.id, { resume: '1' })),
            h('div', { class: 'exam-buttons' },
              // With a deck in progress, Flashcards opens the list of terms; Resume deck opens the deck.
              mode('Flashcards', 'deck', has.flashcards, pageUrl('flashcards.html', exam.id, open.deck ? { choose: '1' } : {})),
              mode('Practice test', 'test', has.questions, pageUrl('practice.html', exam.id)),
            ),
          )
        : null,
    );
  }

  card = draw();
  return card;
}

try {
  const registry = await loadRegistry(fetchJSON);
  applySiteChrome(registry);

  const exams = registry.exams.filter((exam) => exam.status !== 'hidden');
  // Which study modes of each live exam have content (from the manifests, a small download).
  const everything = { flashcards: true, questions: true };
  const available = new Map(await Promise.all(exams.map(async (exam) => {
    if (exam.status !== 'live') return [exam.id, everything];
    try {
      return [exam.id, await contentAvailable(fetchJSON, exam, { includePrivate: includePrivatePacks() })];
    } catch {
      return [exam.id, everything]; // the exam's own pages will say what is wrong
    }
  })));

  const list = document.getElementById('exam-list');
  const render = () => mount(list, exams.map((exam) => examCard(exam, available.get(exam.id))));
  render();
  list.removeAttribute('aria-busy');

  // Coming back with the browser's Back button can show this page as it was left. Draw the
  // cards again so the Resume buttons match what is saved now.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) render();
  });
} catch (error) {
  showFatal(error);
}
