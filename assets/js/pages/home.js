/**
 * Home page: one card per exam from data/exams.json. Live exams link to their two study
 * modes, and offer to resume a deck or test the student left unfinished on this device. Each
 * Resume button has a minus at its right end that discards that deck or test: the first click
 * turns the minus red, and a second click on the red minus discards it.
 * An exam that is not built yet, or a study mode with no content yet, is labeled "Coming soon".
 */
import { fetchJSON, applySiteChrome, showFatal, pageUrl, includePrivatePacks } from '../lib/boot.js';
import { loadRegistry, contentAvailable } from '../lib/content.js';
import { h, mount, announce } from '../lib/dom.js';
import * as store from '../lib/storage.js';
import { initThemeToggle } from '../lib/theme.js';
import { discardButton } from '../components/discard-button.js';

initThemeToggle();

// Where the flashcards and practice pages save an exam's deck and its unfinished test.
const deckKey = (examId) => `flashcards:${examId}`;
const testKey = (examId) => `practice-run:${examId}`;

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
 * Throw away one exam's unfinished deck or test, and nothing else. The deck's term picks and
 * settings stay, so the flashcards page opens on the term list; the practice page keeps its
 * topic picks, the same as its own Discard button. The test history, other exams, and light
 * or dark mode are never touched.
 */
function discard(examId, kind) {
  // Finished, or already discarded in another tab, since the card was drawn: leave it.
  if (!unfinished(examId)[kind]) return;
  if (kind === 'test') store.remove(testKey(examId));
  else store.save(deckKey(examId), { ...store.load(deckKey(examId), {}), deck: null });
}

/** `has` says which study modes have content: { flashcards, questions }. */
function examCard(exam, has) {
  // A live exam with no packs at all looks the same as one that is not built yet.
  const live = exam.status === 'live' && (has.flashcards || has.questions);
  const saved = live ? unfinished(exam.id) : { deck: false, test: false };
  const open = { deck: saved.deck && has.flashcards, test: saved.test && has.questions };

  // After a discard the card is drawn again from what is saved, so it looks exactly as it
  // does with nothing saved, and focus moves to the mode button that starts a new one.
  const afterDiscard = (kind, what) => {
    discard(exam.id, kind);
    const fresh = examCard(exam, has);
    card.replaceWith(fresh);
    const next = fresh.querySelector(`[data-mode="${kind}"]`);
    if (next) next.focus();
    announce(`${what} discarded.`);
  };
  // Resume is the main action when there is something to resume: one white button per
  // unfinished deck or test, deck first like the mode buttons under them, with the minus that
  // discards it at its right end.
  const resumeRow = (kind, what, href) => h('div', { class: 'exam-resume' },
    h('a', { class: 'exam-resume-link', href }, `Resume ${what.toLowerCase()}`),
    discardButton({ what: what.toLowerCase(), className: 'exam-discard' }, () => afterDiscard(kind, what)),
  );
  const resume = [
    open.deck ? resumeRow('deck', 'Deck', pageUrl('flashcards.html', exam.id)) : null,
    open.test ? resumeRow('test', 'Test', pageUrl('practice.html', exam.id, { resume: '1' })) : null,
  ];
  const modeClass = open.deck || open.test ? 'btn' : 'btn btn-primary';
  // A mode with no content yet is shown, but it is not a link.
  const mode = (label, kind, ready, href) => (ready
    ? h('a', { class: modeClass, href, 'data-mode': kind }, label)
    : h('span', { class: 'btn is-soon' }, label, h('small', null, 'Coming soon')));

  const card = h('article', { class: `exam-card${live ? '' : ' is-planned'}`, 'data-theme-key': exam.theme || '' },
    h('div', { class: 'row spread' },
      h('span', { class: 'exam-code' }, exam.code),
      live ? null : h('span', { class: 'chip' }, 'Coming soon'),
    ),
    h('h2', null, exam.name),
    exam.blurb ? h('p', null, exam.blurb) : null,
    live
      ? h('div', { class: 'exam-actions' },
          resume,
          h('div', { class: 'exam-buttons' },
            // With a deck in progress, Flashcards opens the list of terms; Resume deck opens the deck.
            mode('Flashcards', 'deck', has.flashcards, pageUrl('flashcards.html', exam.id, open.deck ? { choose: '1' } : {})),
            mode('Practice test', 'test', has.questions, pageUrl('practice.html', exam.id)),
          ),
        )
      : null,
  );
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
