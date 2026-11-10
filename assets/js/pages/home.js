/**
 * Home page: one card per exam from data/exams.json. Live exams link to their two study
 * modes, and offer to resume a deck or test the student left unfinished on this device.
 * An exam that is not built yet, or a study mode with no content yet, is labeled "Coming soon".
 */
import { fetchJSON, applySiteChrome, showFatal, pageUrl, includePrivatePacks } from '../lib/boot.js';
import { loadRegistry, contentAvailable } from '../lib/content.js';
import { h, mount } from '../lib/dom.js';
import * as store from '../lib/storage.js';
import { initThemeToggle } from '../lib/theme.js';

initThemeToggle();

/** What is unfinished for an exam on this device (saved by the flashcards and practice pages). */
function unfinished(examId) {
  const cards = store.load(`flashcards:${examId}`, null);
  const run = store.load(`practice-run:${examId}`, null);
  return {
    deck: Boolean(cards && cards.deck && Array.isArray(cards.deck.queue) && cards.deck.queue.length),
    test: Boolean(run && !run.finished && Array.isArray(run.questionIds) && run.questionIds.length),
  };
}

/** `has` says which study modes have content: { flashcards, questions }. */
function examCard(exam, has) {
  // A live exam with no packs at all looks the same as one that is not built yet.
  const live = exam.status === 'live' && (has.flashcards || has.questions);
  const saved = live ? unfinished(exam.id) : { deck: false, test: false };
  const open = { deck: saved.deck && has.flashcards, test: saved.test && has.questions };
  // Resume buttons are the main action when there is something to resume. They sit in the
  // same order as the two mode buttons under them.
  const resume = [
    open.deck ? h('a', { class: 'btn btn-primary', href: pageUrl('flashcards.html', exam.id) }, 'Resume deck') : null,
    open.test ? h('a', { class: 'btn btn-primary', href: pageUrl('practice.html', exam.id, { resume: '1' }) }, 'Resume test') : null,
  ].filter(Boolean);
  const modeClass = resume.length ? 'btn' : 'btn btn-primary';
  // A mode with no content yet is shown, but it is not a link.
  const mode = (label, ready, href) => (ready
    ? h('a', { class: modeClass, href }, label)
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
          resume.length ? h('div', { class: 'exam-buttons' }, resume) : null,
          h('div', { class: 'exam-buttons' },
            // With a deck in progress, Flashcards opens the list of terms; Resume deck opens the deck.
            mode('Flashcards', has.flashcards, pageUrl('flashcards.html', exam.id, open.deck ? { choose: '1' } : {})),
            mode('Practice test', has.questions, pageUrl('practice.html', exam.id)),
          ),
        )
      : null,
  );
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
