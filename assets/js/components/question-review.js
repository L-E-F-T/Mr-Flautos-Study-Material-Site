/**
 * Questions reviewed after a test, each shown exactly as the student saw it: the same choice
 * order, their pick marked right or wrong, the right answer marked, and the reading to review.
 * Used by the practice page's results (Missed and Full test) and by Recent history's View, which
 * shows one past test in full. The quiz uses the marks, reading, and exhibit helpers too.
 */
import { h, icon } from '../lib/dom.js';
import { sourceTitle } from '../lib/boot.js';

export const LETTERS = 'ABCDEFGHIJ';

/**
 * Mark beside a graded choice. The icon shape (check or x) carries right/wrong without
 * relying on color; the hidden text says the same thing to screen readers.
 */
export function choiceMark(isAnswer, wasPicked) {
  if (isAnswer) {
    return [icon('check'), wasPicked ? 'Your answer' : 'Correct answer',
      wasPicked ? h('span', { class: 'visually-hidden' }, ' (correct)') : null];
  }
  if (wasPicked) return [icon('x'), 'Your answer', h('span', { class: 'visually-hidden' }, ' (incorrect)')];
  return null;
}

/** "Reading 3.2.4 Hard Disk Drives" (the class citation style) plus the quote from the book. */
export function referenceBlock(ctx, item) {
  const ref = item.reference;
  if (!ref || !ref.section) {
    return h('p', { class: 'reference-missing' }, 'No reading reference yet.');
  }
  return h('div', null,
    h('div', { class: 'reference-where', title: sourceTitle(ctx.exam, ref.source) },
      h('strong', null, `Reading ${ref.section}`),
      ref.title ? ` ${ref.title}` : '', ref.page ? ` (page ${ref.page})` : '',
    ),
    ref.quote
      ? h('blockquote', { class: 'reference-quote' }, `“${ref.quote}”`)
      : ctx.showDrafts ? h('p', { class: 'reference-missing' }, 'Quote not added yet.') : null,
  );
}

export function renderExhibit(exhibit) {
  if (!exhibit) return null;
  if (exhibit.type === 'image' && exhibit.src) {
    return h('figure', { class: 'q-exhibit', style: { fontFamily: 'inherit' } },
      h('img', { src: exhibit.src, alt: exhibit.alt || 'Exhibit' }),
      exhibit.caption ? h('figcaption', { class: 'small muted' }, exhibit.caption) : null);
  }
  if (exhibit.text) return h('pre', { class: 'q-exhibit' }, exhibit.text);
  return null;
}

/**
 * The choice order to show: the order the student saw, for the choices that still exist, then
 * any choice added since (a question can be edited after a test).
 */
function choiceOrderFor(question, savedOrder) {
  const current = question.choices.map((choice) => choice.id);
  const kept = Array.isArray(savedOrder) ? savedOrder.filter((cid) => current.includes(cid)) : [];
  return [...kept, ...current.filter((cid) => !kept.includes(cid))];
}

/** 'right', 'missed', or 'none' (not answered), graded against the question's current key. */
export function gradeOf(question, picked) {
  if (!Array.isArray(picked)) return 'none';
  const chosen = picked.filter((cid) => question.choices.some((choice) => choice.id === cid));
  const right = chosen.length === question.answer.length && chosen.every((cid) => question.answer.includes(cid));
  return right ? 'right' : 'missed';
}

const TAGS = {
  right: ['chip chip-good', 'Right'],
  missed: ['chip chip-bad', 'Missed'],
  none: ['chip', 'Not answered'],
};

/**
 * One review card. `number` is the question's place in the test, `order` the choice ids in the
 * order the student saw them, `picked` their choice ids (null when not answered), and `status`
 * ('right', 'missed', or 'none') adds the tag a full-test review shows; leave it out for Missed.
 */
export function reviewItem(ctx, { number, question, order, picked, status = null }) {
  const choiceById = new Map(question.choices.map((choice) => [choice.id, choice]));
  const pickedSet = new Set(picked || []);
  const answerSet = new Set(question.answer);
  const isMulti = question.answer.length > 1;
  const label = h('div', { class: 'missed-number' }, `Question ${number}`);
  const tag = status && TAGS[status] ? h('span', { class: TAGS[status][0] }, TAGS[status][1]) : null;
  return h('li', { class: 'missed-item' },
    tag ? h('div', { class: 'review-head' }, label, tag) : label,
    h('p', { class: 'q-stem' }, question.stem),
    renderExhibit(question.exhibit),
    h('ul', { class: `choices review-choices${isMulti ? ' is-multi' : ''}`, 'aria-label': 'Answer choices' },
      choiceOrderFor(question, order).map((cid, i) => {
        const isAnswer = answerSet.has(cid);
        const wasPicked = pickedSet.has(cid);
        const state = isAnswer ? ' is-correct' : wasPicked ? ' is-wrong' : '';
        return h('li', { class: `choice is-locked${state}` },
          h('span', { class: 'choice-letter', 'aria-hidden': 'true' }, LETTERS[i]),
          h('span', { class: 'choice-text' }, h('span', { class: 'visually-hidden' }, `${LETTERS[i]}. `), choiceById.get(cid).text),
          h('span', { class: 'choice-mark' }, choiceMark(isAnswer, wasPicked)),
        );
      }),
    ),
    h('div', { class: 'missed-ref' }, referenceBlock(ctx, question)),
  );
}
