/**
 * Command line tool: the answer and reading shown when a command ends, and the review card on
 * the results screen (docs/COMMAND-LINE-PLAN.md sections 7 and 14). A view only: the page
 * (assets/js/pages/commands.js) grades the drill and passes in what to show. Text from a pack
 * and a typed line go in as text nodes.
 * A review card shows a command as the screen showed it when it ended: the task, the box (each
 * counted miss, the line that printed, and its output), every right line, the reading, and a
 * follow-up question with the student's pick marked, as on the practice page's review.
 */
import { h } from '../lib/dom.js';
import { tagChips } from '../lib/taxonomy.js';
import { referenceOf } from '../lib/command-items.js';
import { LETTERS, choiceMark, referenceBlock } from './question-review.js';
import { terminalBox, endedBody } from './command-terminal.js';

/** The line shown as the answer: the first line of the first answer group. */
export function firstLine(command) {
  return command.accept[0].lines.find((line) => typeof line === 'string' && line.trim() !== '');
}

/** Every right line, as code: "ip addr or ifconfig", "a, b, or c". */
export function answerCodes(command) {
  const lines = [];
  for (const group of command.accept) {
    for (const line of group.lines) if (typeof line === 'string' && line.trim() !== '' && !lines.includes(line)) lines.push(line);
  }
  const out = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push(i < lines.length - 1 ? ', ' : lines.length > 2 ? ', or ' : ' or ');
    out.push(h('code', null, line));
  });
  return out;
}

/**
 * What a command teaches once it has ended: `label` (Answer: or, under a follow-up question,
 * Command:) with every right line, then its reading and its chips.
 */
export function commandFacts(ctx, command, label) {
  const chips = tagChips(command, ctx.objectiveIndex, ctx.unitIndex);
  return [
    h('p', { class: 'cl-answer' }, label, answerCodes(command)),
    referenceBlock(ctx, { reference: referenceOf(command, ctx.questionById) }),
    chips.length ? h('div', { class: 'q-meta', style: { margin: '0.8rem 0 0' } },
      chips.map((chip) => h('span', { class: 'chip', title: chip.title }, chip.label))) : null,
  ];
}

const TAGS = {
  right: ['chip chip-good', 'Right'],
  missed: ['chip chip-bad', 'Missed'],
  question: ['chip chip-bad', 'Question missed'],
  none: ['chip', 'Not answered'],
};

/**
 * One review card.
 *   number   the command's place in the drill
 *   graded   its graded answer (gradeAnswer); a command left open reads as after Show answer
 *   output   the text the line that printed it printed, as the screen showed it
 *   question the follow-up question that was asked, or null
 *   order    the follow-up's choice ids in the order shown; picked: the ids checked, or null
 *   status   'right', 'missed', 'question' (only the question was missed), or 'none' (not answered)
 */
export function reviewCard(ctx, { number, command, graded, output, question = null, order = null, picked = null, status }) {
  const tag = TAGS[status] || TAGS.none;
  const { body } = endedBody(command.system, graded, { answer: firstLine(command), output });
  return h('li', { class: 'missed-item cl-review' },
    h('div', { class: 'review-head' },
      h('div', { class: 'missed-number' }, `Command ${number}`),
      h('span', { class: tag[0] }, tag[1]),
    ),
    h('p', { class: 'q-stem' }, command.task),
    terminalBox({ system: command.system, labelId: `review-sys-${number}`, body }),
    h('p', { class: 'cl-answer' }, 'Answer: ', answerCodes(command)),
    h('div', { class: 'missed-ref' }, referenceBlock(ctx, { reference: referenceOf(command, ctx.questionById) })),
    question ? followUpReview(ctx, question, order, picked) : null,
  );
}

/** The follow-up as the practice page's review shows a question: the choices in the order shown, the pick and the key marked, and its reading. */
function followUpReview(ctx, question, order, picked) {
  const choiceById = new Map(question.choices.map((choice) => [choice.id, choice]));
  const pickedSet = new Set(picked || []);
  const answerSet = new Set(question.answer);
  const isMulti = question.answer.length > 1;
  const ids = (order || []).filter((cid) => choiceById.has(cid));
  return [
    h('p', { class: 'q-stem cl-review-question' }, question.stem),
    h('ul', { class: `choices review-choices${isMulti ? ' is-multi' : ''}`, 'aria-label': 'Answer choices' },
      ids.map((cid, i) => {
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
  ];
}
