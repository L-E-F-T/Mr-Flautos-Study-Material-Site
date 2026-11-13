/**
 * Practice test page.
 *  1. Setup: choose questions by textbook unit/lesson OR by exam domain/objective/
 *     sub-objective, and how many. Students pick topics, never exact questions.
 *  2. Quiz: random questions from the chosen pool, multiple choice (single answer
 *     or "choose two"), immediate right/wrong feedback, and instead of an
 *     explanation, the textbook section to read plus a quote from it.
 *  3. Results: score, then a review of every missed question (what the student
 *     picked, the right answer, the reading) with a "try these again" button that
 *     starts a new round of only the missed ones, then a breakdown by lesson or objective.
 * An unfinished test is saved on this device and can be resumed.
 */
import { bootExamPage, sourceTitle, queryFlag, pageUrl } from '../lib/boot.js';
import { h, mount, append, icon, announce, isTypingTarget, numberWord, plural } from '../lib/dom.js';
import { buildSelectionTree, itemIdsForLeaves, ancestorAtDepth, naturalCompare, tagChips, mostSpecificTags } from '../lib/taxonomy.js';
import { sample, shuffle } from '../lib/random.js';
import * as store from '../lib/storage.js';
import { createTreePicker, displayCode } from '../components/tree-picker.js';
import { segmented } from '../components/segmented.js';
import { discardButton } from '../components/discard-button.js';
import { openHistoryPanel, settleHistoryStep } from '../components/history-panel.js';
import { recordAnswer, recordTestResult, getExamStats } from '../lib/progress.js';
import { initThemeToggle } from '../lib/theme.js';

initThemeToggle();

// A page brought back by the Back button still holds its old test in memory. Load it fresh, so
// it never logs a test twice or writes an old copy over newer answers.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

const LETTERS = 'ABCDEFGHIJ';
const PRESETS = [10, 25, 50, 90];

const ctx = await bootExamPage('practice');
if (ctx) start(ctx);

function start(ctx) {
  const app = document.getElementById('app');
  const examId = ctx.exam.id;
  const setupKey = `practice-setup:${examId}`;
  const runKey = `practice-run:${examId}`;

  const trees = {
    unit: buildSelectionTree(ctx.unitRoots, ctx.questions, (q) => q.units, { maxDepth: 2 }),
    objective: buildSelectionTree(ctx.objectiveRoots, ctx.questions, (q) => q.objectives, { maxDepth: 3 }),
  };

  const savedSetup = store.load(setupKey, {}) || {};
  const keepLeaves = (ids, tree) => (Array.isArray(ids) ? ids.filter((id) => tree.leaves.has(id)) : []);
  const setup = {
    mode: savedSetup.mode === 'objective' ? 'objective' : 'unit',
    selected: {
      unit: new Set(keepLeaves(savedSetup.unit, trees.unit)),
      objective: new Set(keepLeaves(savedSetup.objective, trees.objective)),
    },
    count: clampInt(savedSetup.count, 1, 1000, 10),
    shuffleChoices: savedSetup.shuffleChoices !== false,
  };
  const saveSetup = () => store.save(setupKey, {
    mode: setup.mode,
    unit: [...setup.selected.unit],
    objective: [...setup.selected.objective],
    count: setup.count,
    shuffleChoices: setup.shuffleChoices,
  });

  let run = loadRun();
  const saveRun = () => (run ? store.save(runKey, run) : store.remove(runKey));

  const poolIds = () => [...itemIdsForLeaves(trees[setup.mode], setup.selected[setup.mode])];

  /**
   * Opens the Recent history side panel (the log of finished tests, with trends by unit). It is
   * "recent" because it lives in this browser's saved data, which a device can clear.
   */
  const historyButton = () => {
    const button = h('button', { type: 'button', class: 'btn' }, 'Recent history');
    // The breakdown starts in the outline the setup picks topics by, until the student switches it.
    button.addEventListener('click', () => openHistoryPanel(ctx, button, { view: setup.mode }));
    return button;
  };

  settleHistoryStep();

  // "Resume test" on the home page links here with ?resume=1, and a test in progress keeps it in
  // the address, so a reload goes straight back into the test.
  if (run && !run.finished && queryFlag('resume')) renderQuestion();
  else renderSetup();

  function loadRun() {
    const saved = store.load(runKey, null);
    if (!saved || !Array.isArray(saved.questionIds) || saved.questionIds.length === 0) return null;
    if (!saved.questionIds.every((id) => ctx.questionById.has(id))) {
      store.remove(runKey); // questions changed since this test was saved
      return null;
    }
    saved.answers = saved.answers && typeof saved.answers === 'object' ? saved.answers : {};
    saved.choiceOrder = saved.choiceOrder && typeof saved.choiceOrder === 'object' ? saved.choiceOrder : {};
    // Questions may have been edited since this test was saved (the teacher's review workflow).
    // Keep the student's order for choices that still exist, add any new choices, and
    // re-grade saved answers against the current key.
    for (const id of saved.questionIds) {
      const question = ctx.questionById.get(id);
      const current = question.choices.map((choice) => choice.id);
      const kept = Array.isArray(saved.choiceOrder[id]) ? saved.choiceOrder[id].filter((cid) => current.includes(cid)) : [];
      saved.choiceOrder[id] = [...kept, ...current.filter((cid) => !kept.includes(cid))];
      const answer = saved.answers[id];
      if (answer) {
        const selected = Array.isArray(answer.selected) ? answer.selected.filter((cid) => current.includes(cid)) : [];
        answer.selected = selected;
        answer.correct = selected.length === question.answer.length && selected.every((cid) => question.answer.includes(cid));
      }
    }
    saved.index = clampInt(saved.index, 0, saved.questionIds.length - 1, 0);
    return saved;
  }

  /* ------------------------------------------------------------------ */
  /* Setup                                                               */
  /* ------------------------------------------------------------------ */

  function renderSetup({ focusHeading = false } = {}) {

    if (ctx.questions.length === 0) {
      mount(app,
        h('div', { class: 'wrap' },
          h('div', { class: 'page-head' }, h('h1', null, 'Practice test')),
          h('div', { class: 'notice' }, 'Coming soon'),
        ),
      );
      return;
    }

    const tree = trees[setup.mode];
    const availableText = h('p', { class: 'muted small', role: 'status', style: { margin: '0.6rem 0 0' } });
    const countInput = h('input', {
      type: 'number', min: '1', step: '1', inputmode: 'numeric',
      value: String(setup.count), 'aria-label': 'Number of questions', style: { width: '7rem' },
    });
    const presetBox = h('div', { class: 'count-presets', role: 'group', 'aria-label': 'Quick picks' });
    const startButton = h('button', { type: 'button', class: 'btn btn-primary btn-lg start-inline', style: { width: '100%' } }, 'Start');
    // Phones and tablets: the Start button is docked to the bottom of the screen instead
    // (CSS hides .start-inline there), so it is in reach while scrolling the topic list.
    const barText = h('span', { class: 'action-bar-text' });
    const barStart = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Start');

    const update = () => {
      const available = poolIds().length;
      const effective = Math.min(setup.count, available);
      availableText.textContent = `${available} available`;
      countInput.max = String(Math.max(available, 1));
      startButton.disabled = available === 0;
      startButton.textContent = available === 0 ? 'Select a topic' : `Start ${plural(effective, 'question')}`;
      barStart.disabled = available === 0;
      barStart.textContent = available === 0 ? 'Start' : `Start ${plural(effective, 'question')}`;
      barText.textContent = available === 0 ? 'Select a topic' : `${available} available`;
      const picks = [...new Set([...PRESETS.filter((n) => n < available), available])].filter((n) => n > 0);
      mount(presetBox, picks.map((n) => {
        const active = n === effective;
        const button = h('button', { type: 'button', class: `btn btn-sm${active ? ' btn-primary' : ''}`, 'aria-pressed': String(active) },
          n === available && !PRESETS.includes(n) ? `All (${n})` : String(n));
        button.addEventListener('click', () => {
          setup.count = n;
          countInput.value = String(n);
          saveSetup();
          update();
          // update() rebuilt the buttons; keep keyboard focus on the one just chosen.
          const pressed = presetBox.querySelector('button[aria-pressed="true"]');
          if (pressed) pressed.focus();
        });
        return button;
      }));
    };

    countInput.addEventListener('input', () => {
      const value = parseInt(countInput.value, 10);
      if (Number.isFinite(value) && value > 0) {
        setup.count = value;
        saveSetup();
        update();
      }
    });

    const modeToggle = segmented('Choose questions by', 'practice-mode', [
      { value: 'unit', label: 'Textbook unit' },
      { value: 'objective', label: 'Exam objective' },
    ], setup.mode, (value) => {
      setup.mode = value;
      saveSetup();
      renderSetup();
      // The page was rebuilt; return focus to the toggle so arrow keys keep working.
      const checked = app.querySelector('input[name="practice-mode"]:checked');
      if (checked) checked.focus();
    });

    const picker = createTreePicker({
      tree,
      selected: setup.selected[setup.mode],
      itemNoun: 'question',
      onChange: () => {
        saveSetup();
        update();
      },
    });

    const button = (label, onClick, cls = 'btn btn-sm') => {
      const b = h('button', { type: 'button', class: cls }, label);
      b.addEventListener('click', onClick);
      return b;
    };

    // One button that flips between "Expand all" and "Collapse all" (one less control on a phone).
    let allExpanded = false;
    const expandToggle = button('Expand all', () => {
      allExpanded = !allExpanded;
      picker.expandAll(allExpanded);
      expandToggle.textContent = allExpanded ? 'Collapse all' : 'Expand all';
    }, 'btn btn-sm btn-ghost');

    const shuffleBox = h('input', { type: 'checkbox', checked: setup.shuffleChoices });
    shuffleBox.addEventListener('change', () => {
      setup.shuffleChoices = shuffleBox.checked;
      saveSetup();
    });

    const begin = () => {
      const ids = poolIds();
      if (!ids.length) return;
      if (run && !run.finished && Object.keys(run.answers).length > 0
        && !window.confirm('Start a new test? The test in progress will be lost.')) return;
      startRun(sample(ids, Math.min(setup.count, ids.length)), setup.mode);
    };
    startButton.addEventListener('click', begin);
    barStart.addEventListener('click', begin);

    mount(app,
      h('div', { class: 'wrap' },
        h('div', { class: 'page-head' },
          h('div', { class: 'row spread' },
            h('h1', { id: 'setup-heading', tabindex: '-1', style: { margin: 0 } }, 'Practice test'),
            historyButton(),
          ),
        ),
        resumeBanner(),
        h('div', { class: 'setup-grid' },
          h('section', { class: 'panel', 'aria-labelledby': 'pick-heading' },
            h('div', { class: 'panel-title' },
              h('h2', { id: 'pick-heading' }, 'Topics'),
              modeToggle,
            ),
            h('div', { class: 'toolbar', style: { marginBottom: '0.6rem' } },
              button('Select all', () => picker.selectAll()),
              button('Uncheck all', () => picker.clear(), 'btn btn-sm btn-ghost'),
              h('span', { class: 'spacer' }),
              expandToggle,
            ),
            picker.element,
          ),
          h('aside', { class: 'setup-side' },
            h('section', { class: 'panel', 'aria-labelledby': 'count-heading' },
              h('h2', { id: 'count-heading' }, 'Questions'),
              h('div', { class: 'row' }, countInput, presetBox),
              availableText,
              h('div', { style: { margin: '0.9rem 0' } },
                h('label', { class: 'inline' }, shuffleBox, 'Shuffle answers')),
              startButton,
            ),
          ),
        ),
        h('div', { class: 'action-bar only-narrow', role: 'region', 'aria-label': 'Start the test' },
          h('div', { class: 'action-bar-inner' }, barText, barStart),
        ),
      ),
    );
    update();
    if (focusHeading) {
      window.scrollTo({ top: 0 });
      const heading = document.getElementById('setup-heading');
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  function resumeBanner() {
    if (!run) return null;
    const answeredCount = Object.keys(run.answers).length;
    if (!run.finished) {
      const resume = h('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Resume');
      resume.addEventListener('click', () => renderQuestion());
      const discard = h('button', { type: 'button', class: 'btn btn-sm btn-ghost' }, 'Discard');
      discard.addEventListener('click', () => {
        if (answeredCount > 0 && !window.confirm('Discard the test in progress?')) return;
        run = null;
        saveRun();
        renderSetup({ focusHeading: true });
      });
      return h('div', { class: 'notice', role: 'status', style: { marginBottom: '1rem' } },
        h('div', { class: 'row spread' },
          h('span', null, h('strong', null, 'Test in progress: '),
            `${answeredCount} of ${run.questionIds.length} answered`),
          h('span', { class: 'row' }, resume, discard),
        ),
      );
    }
    const correct = Object.values(run.answers).filter((a) => a.correct).length;
    const view = h('button', { type: 'button', class: 'btn btn-sm' }, 'Results');
    view.addEventListener('click', () => renderResults());
    // The two-click minus (as on the home card) drops this saved test, which only feeds this
    // banner and its Results page. The test stays in Recent history.
    const dismiss = discardButton({ verb: 'Dismiss', what: 'last test', className: 'discard-btn' }, () => {
      run = null;
      saveRun();
      banner.remove();
      const heading = document.getElementById('setup-heading');
      if (heading) heading.focus({ preventScroll: true });
      announce('Last test dismissed.');
    });
    const banner = h('div', { class: 'notice', style: { marginBottom: '1rem' } },
      h('div', { class: 'row spread' },
        h('span', null, h('strong', null, 'Last test: '), `${correct} of ${answeredCount} correct`),
        h('span', { class: 'row' }, view, dismiss),
      ),
    );
    return banner;
  }

  /* ------------------------------------------------------------------ */
  /* Quiz                                                                */
  /* ------------------------------------------------------------------ */

  /**
   * `retry` marks a round made of only the questions missed in the round before. `before` is that
   * finished round, kept so that quitting the retry round goes back to its results.
   */
  function startRun(questionIds, mode, { retry = false, before = null } = {}) {
    const choiceOrder = {};
    for (const id of questionIds) {
      const question = ctx.questionById.get(id);
      const ids = question.choices.map((choice) => choice.id);
      choiceOrder[id] = setup.shuffleChoices && question.shuffleChoices !== false ? shuffle([...ids]) : ids;
    }
    run = {
      version: 1,
      examId,
      mode,
      retry,
      // Only one level is kept, so a chain of retry rounds does not keep growing in storage.
      before: before ? { ...before, before: null } : null,
      questionIds,
      choiceOrder,
      answers: {},
      index: 0,
      startedAt: new Date().toISOString(),
      finished: false,
    };
    saveRun();
    // Reloading the page during the test (phones do this on their own) goes straight back to it.
    window.history.replaceState(window.history.state, '', pageUrl('practice.html', examId, { resume: '1' }));
    renderQuestion();
    window.scrollTo({ top: 0 });
  }

  function renderQuestion() {
    const qid = run.questionIds[run.index];
    const question = ctx.questionById.get(qid);
    const answered = run.answers[qid] || null;
    const answerSet = new Set(question.answer);
    const isMulti = question.answer.length > 1;
    const order = (run.choiceOrder[qid] || question.choices.map((c) => c.id)).filter((id) => question.choices.some((c) => c.id === id));
    const choiceById = new Map(question.choices.map((choice) => [choice.id, choice]));
    const selected = new Set(answered ? answered.selected : []);
    const total = run.questionIds.length;
    const answers = Object.values(run.answers);
    const right = answers.filter((a) => a.correct).length;
    const wrong = answers.length - right;
    const stats = getExamStats(examId);

    const endButton = h('button', { type: 'button', class: 'btn btn-sm btn-ghost' }, answers.length ? 'End test' : 'Quit');
    endButton.addEventListener('click', () => {
      if (Object.keys(run.answers).length > 0) {
        finish();
        return;
      }
      // Quitting a retry round before answering anything goes back to the results it came from.
      if (run.before) {
        run = run.before;
        saveRun();
        run = loadRun(); // checks the saved results against the current questions again
        if (run && run.finished) {
          renderResults();
          return;
        }
      }
      run = null;
      saveRun();
      renderSetup({ focusHeading: true });
    });

    const top = h('div', null,
      h('div', { class: 'quiz-top' },
        h('span', { class: 'row' },
          h('strong', null, `Question ${run.index + 1} of ${total}`),
          run.retry ? h('span', { class: 'chip chip-accent' }, 'Missed questions') : null,
        ),
        h('span', { class: 'row' },
          h('span', { class: 'quiz-score', role: 'img', 'aria-label': `${right} correct, ${wrong} incorrect` },
            h('span', { class: 'ok' }, icon('check'), String(right)),
            h('span', { class: 'no' }, icon('x'), String(wrong)),
          ),
          stats && stats.streak >= 3 ? h('span', { class: 'chip', title: 'Correct answers in a row' }, `Streak ${stats.streak}`) : null,
        ),
        endButton,
      ),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(answers.length), 'aria-label': 'Questions answered' },
        h('span', { style: { width: `${(answers.length / total) * 100}%` } })),
    );

    const name = `q-${run.index}`;
    const choiceViews = order.map((cid, i) => {
      const choice = choiceById.get(cid);
      const input = h('input', { type: isMulti ? 'checkbox' : 'radio', name, value: cid, checked: selected.has(cid), disabled: Boolean(answered) });
      const mark = h('span', { class: 'choice-mark' });
      const label = h('label', { class: `choice${answered ? ' is-locked' : ''}` },
        input,
        h('span', { class: 'choice-letter', 'aria-hidden': 'true' }, LETTERS[i]),
        h('span', { class: 'choice-text' }, h('span', { class: 'visually-hidden' }, `${LETTERS[i]}. `), choice.text),
        mark,
      );
      input.addEventListener('change', () => {
        if (isMulti) {
          if (input.checked) selected.add(cid);
          else selected.delete(cid);
        } else {
          selected.clear();
          selected.add(cid);
        }
        syncChoices();
      });
      return { cid, input, label, mark, letter: LETTERS[i] };
    });

    const checkButton = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Check');
    checkButton.addEventListener('click', check);
    const selectHint = h('span', { class: 'muted small' });

    const syncChoices = () => {
      for (const view of choiceViews) view.label.classList.toggle('is-selected', !answered && selected.has(view.cid));
      checkButton.disabled = selected.size !== question.answer.length;
      selectHint.textContent = isMulti ? `${selected.size} of ${question.answer.length} selected` : '';
    };

    let feedback = null;
    let nextButton = null;
    if (answered) {
      for (const view of choiceViews) {
        const isAnswer = answerSet.has(view.cid);
        const wasPicked = selected.has(view.cid);
        if (isAnswer) view.label.classList.add('is-correct');
        else if (wasPicked) view.label.classList.add('is-wrong');
        append(view.mark, choiceMark(isAnswer, wasPicked));
      }
      const correctLetters = choiceViews.filter((view) => answerSet.has(view.cid)).map((view) => view.letter);
      const headline = answered.correct
        ? 'Correct'
        : `Incorrect. ${correctLetters.length > 1 ? 'Answers' : 'Answer'}: ${joinLetters(correctLetters)}`;
      const chips = tagChips(question, ctx.objectiveIndex, ctx.unitIndex);
      feedback = h('section', { class: `feedback ${answered.correct ? 'is-good' : 'is-bad'}`, 'aria-label': 'Feedback' },
        h('div', { class: 'feedback-head', tabindex: '-1' }, headline),
        h('div', { class: 'feedback-body' },
          referenceBlock(ctx, question),
          chips.length ? h('div', { class: 'q-meta', style: { margin: '0.8rem 0 0' } },
            chips.map((chip) => h('span', { class: 'chip', title: chip.title }, chip.label))) : null,
        ),
      );
      const isLast = run.index >= total - 1;
      nextButton = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, isLast ? 'Results' : 'Next');
      nextButton.addEventListener('click', next);
    }

    const exhibit = renderExhibit(question.exhibit);
    const stemId = `stem-${run.index}`;

    mount(app,
      h('div', { class: 'wrap' },
        h('div', { class: 'page-head', style: { paddingBottom: 0 } }, top),
        h('article', { class: 'panel question', 'aria-labelledby': stemId },
          h('div', { class: 'q-meta' },
            question.status === 'draft' ? h('span', { class: 'badge' }, 'Draft') : null,
            question.sample ? h('span', { class: 'badge' }, 'Sample') : null,
          ),
          h('p', { class: 'q-stem', id: stemId, tabindex: '-1' }, question.stem),
          exhibit,
          isMulti ? h('p', { class: 'q-instruction' }, `Choose ${numberWord(question.answer.length)}.`) : null,
          h('fieldset', { class: `choices${isMulti ? ' is-multi' : ''}` },
            h('legend', { class: 'visually-hidden' }, isMulti ? `Choose ${question.answer.length} answers` : 'Choose one answer'),
            choiceViews.map((view) => view.label),
          ),
          // Feedback (with the reading to review) comes before the Next button so it is not skipped.
          feedback,
          h('div', { class: 'quiz-actions' }, answered ? nextButton : [checkButton, selectHint]),
        ),
      ),
    );
    syncChoices();

    if (answered) {
      nextButton.focus({ preventScroll: true });
      // On a phone the result and Next land below the screen after Check. Scroll just enough to
      // show Next, with the result and the reading right above it. Nothing moves when it shows.
      nextButton.scrollIntoView({ block: 'nearest' });
    } else {
      const stem = document.getElementById(stemId);
      if (stem) stem.focus({ preventScroll: true });
    }

    // Shortcuts only while focus is inside the question (WCAG 2.1.4), never page-wide.
    app.querySelector('article.question').addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event)) return;
      const onButton = event.target instanceof HTMLElement && event.target.closest('button, a, summary');
      const key = event.key;
      if (!answered) {
        const index = letterIndex(key);
        if (index >= 0 && index < choiceViews.length) {
          event.preventDefault();
          choiceViews[index].input.click();
          return;
        }
        if (key === 'Enter' && !onButton) {
          event.preventDefault();
          check();
        }
      } else if ((key === 'Enter' && !onButton) || key === 'ArrowRight') {
        event.preventDefault();
        next();
      }
    });

    function check() {
      if (run.answers[qid] || selected.size !== question.answer.length) return;
      const correct = selected.size === answerSet.size && [...selected].every((id) => answerSet.has(id));
      run.answers[qid] = { selected: [...selected], correct };
      // The last answer logs the test, even if Results is never tapped.
      if (Object.keys(run.answers).length === run.questionIds.length) logRun();
      saveRun();
      recordAnswer({ examId, questionId: qid, correct });
      renderQuestion();
      const letters = choiceViews.filter((view) => answerSet.has(view.cid)).map((view) => view.letter);
      announce(correct
        ? 'Correct.'
        : `Incorrect. The correct ${letters.length > 1 ? 'answers are' : 'answer is'} ${joinLetters(letters)}.`);
    }
  }

  function next() {
    if (run.index < run.questionIds.length - 1) {
      run.index += 1;
      saveRun();
      renderQuestion();
      window.scrollTo({ top: 0 });
    } else {
      finish();
    }
  }

  function finish() {
    run.finished = true;
    run.finishedAt = new Date().toISOString();
    logRun();
    saveRun();
    renderResults();
  }

  /** Add the test to the Recent history log, once (the logged flag is saved with the run). */
  function logRun() {
    if (run.logged) return;
    run.logged = true;
    const tally = tallyRun();
    recordTestResult({
      examId,
      entry: {
        at: run.finishedAt || new Date().toISOString(),
        mode: run.mode,
        retry: Boolean(run.retry),
        planned: run.questionIds.length,
        total: tally.total,
        correct: tally.correct,
        units: tally.units,
        lessons: tally.lessons,
        domains: tally.domains,
        objectives: tally.objectives,
      },
    });
  }

  /**
   * Count the answered questions of the current test by unit, lesson, domain, and objective
   * (each as [correct, total]). Both outlines are always tallied, whichever way the student
   * picked topics, so Recent history can show a breakdown by either one.
   */
  function tallyRun() {
    const tally = { total: 0, correct: 0, units: {}, lessons: {}, domains: {}, objectives: {} };
    const add = (bucket, id, correct) => {
      const counts = bucket[id] || (bucket[id] = [0, 0]);
      counts[1] += 1;
      if (correct) counts[0] += 1;
    };
    for (const id of run.questionIds) {
      const answer = run.answers[id];
      if (!answer) continue;
      const question = ctx.questionById.get(id);
      tally.total += 1;
      if (answer.correct) tally.correct += 1;
      // A question counts once per unit, lesson, or objective, even if it has several tags there.
      const seen = new Set();
      const once = (bucket, name, node) => {
        if (!node || seen.has(`${name}:${node.id}`)) return;
        seen.add(`${name}:${node.id}`);
        add(bucket, node.id, answer.correct);
      };
      for (const tag of mostSpecificTags(ctx.unitIndex, question.units)) {
        once(tally.units, 'unit', ancestorAtDepth(ctx.unitIndex, tag, 1));
        const lesson = ancestorAtDepth(ctx.unitIndex, tag, 2);
        if (lesson && lesson.kind === 'lesson') once(tally.lessons, 'lesson', lesson);
      }
      for (const tag of mostSpecificTags(ctx.objectiveIndex, question.objectives)) {
        once(tally.domains, 'domain', ancestorAtDepth(ctx.objectiveIndex, tag, 1));
        const objective = ancestorAtDepth(ctx.objectiveIndex, tag, 2);
        if (objective && objective.kind === 'objective') once(tally.objectives, 'objective', objective);
      }
    }
    return tally;
  }

  /* ------------------------------------------------------------------ */
  /* Results                                                             */
  /* ------------------------------------------------------------------ */

  function renderResults() {
    const answeredIds = run.questionIds.filter((id) => run.answers[id]);
    const total = answeredIds.length;
    const correct = answeredIds.filter((id) => run.answers[id].correct).length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const missed = answeredIds.filter((id) => !run.answers[id].correct);
    const skipped = run.questionIds.length - total;

    const byObjective = run.mode === 'objective';
    const index = byObjective ? ctx.objectiveIndex : ctx.unitIndex;
    const groups = new Map();
    for (const id of answeredIds) {
      const question = ctx.questionById.get(id);
      const seen = new Set();
      for (const tag of mostSpecificTags(index, byObjective ? question.objectives : question.units)) {
        const node = ancestorAtDepth(index, tag, 2);
        if (!node || seen.has(node.id)) continue;
        seen.add(node.id);
        const group = groups.get(node.id) || { node, correct: 0, total: 0 };
        group.total += 1;
        if (run.answers[id].correct) group.correct += 1;
        groups.set(node.id, group);
      }
    }
    const rows = [...groups.values()].sort((a, b) => naturalCompare(a.node.id, b.node.id)).map((group) => {
      const pct = Math.round((group.correct / group.total) * 100);
      return h('tr', null,
        h('td', null, h('span', { class: 'tree-id' }, displayCode(group.node)), ' ', group.node.title),
        h('td', { class: 'num' }, `${group.correct}/${group.total}`),
        h('td', { class: 'num' }, `${pct}%`),
        // Green = share correct, red = share missed (see .bar in site.css).
        h('td', { style: { width: '30%' } }, h('div', { class: 'bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${pct}%` } }))),
      );
    });

    // "Retry missed": a new round made of only the questions just missed, in a new order
    // and with the answer choices reshuffled.
    const retryButton = (cls) => {
      const button = h('button', { type: 'button', class: cls }, 'Retry missed');
      button.addEventListener('click', () => startRun(shuffle([...missed]), run.mode, { retry: true, before: run }));
      return button;
    };
    const again = h('button', { type: 'button', class: 'btn', title: 'Same topics, new questions' }, 'New test');
    again.addEventListener('click', () => {
      const ids = poolIds();
      if (!ids.length) {
        renderSetup();
        return;
      }
      startRun(sample(ids, Math.min(setup.count, ids.length)), setup.mode);
    });
    const change = h('button', { type: 'button', class: 'btn btn-ghost' }, 'Change topics');
    change.addEventListener('click', () => renderSetup({ focusHeading: true }));

    // Each question exactly as the student saw it: same choice order, their pick marked right or
    // wrong, the right answer marked, and the reading to review. In the full test each one is also
    // tagged Right, Missed, or Not answered (a test ended early leaves some unanswered).
    const reviewItem = (id, tagged) => {
      const question = ctx.questionById.get(id);
      const answer = run.answers[id];
      const choiceById = new Map(question.choices.map((choice) => [choice.id, choice]));
      const order = (run.choiceOrder[id] || question.choices.map((c) => c.id)).filter((cid) => choiceById.has(cid));
      const picked = new Set(answer ? answer.selected : []);
      const answerSet = new Set(question.answer);
      const isMulti = question.answer.length > 1;
      const number = h('div', { class: 'missed-number' }, `Question ${run.questionIds.indexOf(id) + 1}`);
      let tag = null;
      if (tagged) {
        if (!answer) tag = h('span', { class: 'chip' }, 'Not answered');
        else if (answer.correct) tag = h('span', { class: 'chip chip-good' }, 'Right');
        else tag = h('span', { class: 'chip chip-bad' }, 'Missed');
      }
      return h('li', { class: 'missed-item' },
        tag ? h('div', { class: 'review-head' }, number, tag) : number,
        h('p', { class: 'q-stem' }, question.stem),
        renderExhibit(question.exhibit),
        h('ul', { class: `choices review-choices${isMulti ? ' is-multi' : ''}`, 'aria-label': 'Answer choices' },
          order.map((cid, i) => {
            const isAnswer = answerSet.has(cid);
            const wasPicked = picked.has(cid);
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
    };

    // Review: the missed questions first, or the full test with every question in order. The
    // switch redraws only the list, so focus and the page position stay put.
    let reviewView = 'missed';
    const reviewList = h('div');
    const drawReview = () => {
      const all = reviewView === 'all';
      const ids = all ? run.questionIds : missed;
      mount(reviewList,
        ids.length
          ? h('ol', { class: 'missed-list' }, ids.map((id) => reviewItem(id, all)))
          : h('p', { style: { margin: 0 } }, 'Nothing missed.'),
        missed.length && (all || missed.length > 1) ? h('div', { class: 'review-foot' }, retryButton('btn btn-primary btn-lg')) : null,
      );
    };
    const reviewSwitch = segmented('Questions to show', 'review-view', [
      { value: 'missed', label: `Missed (${missed.length})` },
      { value: 'all', label: `Full test (${run.questionIds.length})` },
    ], reviewView, (value) => {
      reviewView = value;
      drawReview();
    });
    drawReview();
    const review = h('section', { class: 'panel', 'aria-labelledby': 'review-heading' },
      h('div', { class: 'panel-title' },
        h('div', { class: 'row review-title' }, h('h2', { id: 'review-heading' }, 'Review'), reviewSwitch),
        missed.length ? retryButton('btn btn-primary') : null,
      ),
      reviewList,
    );

    mount(app,
      h('div', { class: 'wrap' },
        h('div', { class: 'page-head' }, h('h1', { id: 'results-heading', tabindex: '-1' }, 'Results')),
        h('section', { class: 'panel' },
          h('div', { class: 'score-hero' },
            h('div', { class: 'score-big' }, `${percent}%`),
            h('div', { class: 'score-detail' },
              h('div', null, h('strong', null, `${correct} of ${total}`), ' correct'),
              run.retry ? h('div', { class: 'small' }, 'Retry of missed questions') : null,
              skipped > 0 ? h('div', { class: 'small' }, `${skipped} not answered`) : null,
            ),
            h('div', { class: 'score-actions' }, again, change, historyButton()),
          ),
        ),
        // The review comes right after the score: it is the point of the results page.
        review,
        rows.length
          ? h('section', { class: 'panel' },
              h('h2', null, byObjective ? 'By objective' : 'By lesson'),
              h('div', { class: 'table-scroll', style: { border: 0 } },
                h('table', { class: 'breakdown has-bar' },
                  h('thead', null, h('tr', null,
                    h('th', { scope: 'col' }, byObjective ? 'Objective' : 'Lesson'),
                    h('th', { scope: 'col', class: 'num' }, 'Score'),
                    h('th', { scope: 'col', class: 'num' }, '%'),
                    h('th', { scope: 'col' }, h('span', { class: 'visually-hidden' }, 'Bar')),
                  )),
                  h('tbody', null, rows),
                ),
              ),
            )
          : null,
      ),
    );
    window.scrollTo({ top: 0 });
    const heading = document.getElementById('results-heading');
    if (heading) heading.focus({ preventScroll: true });
    announce(`Results: ${correct} of ${total} correct, ${percent} percent.${missed.length ? ` ${missed.length} missed, listed below.` : ''}`);
  }
}

/* -------------------------------------------------------------------- */
/* Helpers                                                              */
/* -------------------------------------------------------------------- */

/**
 * Mark beside a graded choice. The icon shape (check or x) carries right/wrong without
 * relying on color; the hidden text says the same thing to screen readers.
 */
function choiceMark(isAnswer, wasPicked) {
  if (isAnswer) {
    return [icon('check'), wasPicked ? 'Your answer' : 'Correct answer',
      wasPicked ? h('span', { class: 'visually-hidden' }, ' (correct)') : null];
  }
  if (wasPicked) return [icon('x'), 'Your answer', h('span', { class: 'visually-hidden' }, ' (incorrect)')];
  return null;
}

/** "Reading 3.2.4 Hard Disk Drives" (the class citation style) plus the quote from the book. */
function referenceBlock(ctx, item) {
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

function renderExhibit(exhibit) {
  if (!exhibit) return null;
  if (exhibit.type === 'image' && exhibit.src) {
    return h('figure', { class: 'q-exhibit', style: { fontFamily: 'inherit' } },
      h('img', { src: exhibit.src, alt: exhibit.alt || 'Exhibit' }),
      exhibit.caption ? h('figcaption', { class: 'small muted' }, exhibit.caption) : null);
  }
  if (exhibit.text) return h('pre', { class: 'q-exhibit' }, exhibit.text);
  return null;
}

function letterIndex(key) {
  if (!key || key.length !== 1) return -1;
  const upper = key.toUpperCase();
  const letter = LETTERS.indexOf(upper);
  if (letter >= 0) return letter;
  if (/^[1-9]$/.test(key)) return Number(key) - 1;
  return -1;
}

function joinLetters(letters) {
  if (letters.length <= 1) return letters.join('');
  return `${letters.slice(0, -1).join(', ')} and ${letters[letters.length - 1]}`;
}

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
