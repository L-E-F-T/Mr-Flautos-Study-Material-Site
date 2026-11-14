/**
 * Recent history side panel: the log of finished practice tests kept on this device, turned
 * into something a student can act on:
 *   - recent scores, to see the trend;
 *   - a breakdown by textbook unit and lesson, or by exam domain and objective (a switch, as
 *     on the practice setup), with the weakest lesson or objective called out;
 *   - the list of tests by date, each with its time, score, and the lessons (or objectives)
 *     it covered, a View button that shows the whole test again (for the latest tests, which
 *     keep their questions), and the two-click minus that discards that one test.
 * It is labeled "Recent" because it lives in the browser's saved data, which a device can
 * clear, so students do not count on it lasting.
 * Retry rounds (only previously missed questions) are listed but left out of the averages
 * and trends, because they would skew them.
 *
 * The log itself is written by the practice page through recordTestResult() in
 * assets/js/lib/progress.js.
 */
import { h, mount, nextId, announce, plural } from '../lib/dom.js';
import { getHistory, clearHistory, removeTest } from '../lib/progress.js';
import { naturalCompare } from '../lib/taxonomy.js';
import * as store from '../lib/storage.js';
import { displayCode } from './tree-picker.js';
import { segmented } from './segmented.js';
import { discardButton } from './discard-button.js';
import { reviewItem, gradeOf } from './question-review.js';

const RECENT_TESTS = 5; // "Last 5" in the summary, and the overall trend
const RECENT_PER_TOPIC = 3; // tests compared with earlier ones for a unit or lesson trend
const CHART_TESTS = 10; // bars in the recent-scores chart
const LOG_LIMIT = 30; // tests listed
const MIN_FOR_WEAKEST = 4; // answers a lesson or objective needs before it can be called the weakest
const TREND_TITLE = 'Latest tests compared with the ones before';

/**
 * The two outlines the breakdown can follow, as on the practice setup. Every logged test keeps a
 * tally for both, so switching needs nothing new from the student.
 */
const VIEWS = {
  unit: { label: 'Textbook unit', heading: 'By unit', top: 'units', inner: 'lessons', topNoun: 'Unit', innerNoun: 'Lesson' },
  objective: { label: 'Exam objective', heading: 'By domain', top: 'domains', inner: 'objectives', topNoun: 'Domain', innerNoun: 'Objective' },
};
const isView = (value) => value === 'unit' || value === 'objective';
/** Where the student's choice of outline is remembered, per exam. */
const viewKey = (examId) => `history-view:${examId}`;

/** The top of an outline for an id: "3.4" → "3.0". */
const topIdOf = (id) => `${String(id).split('.')[0]}.0`;

/** The unit of a lesson, or the domain of an objective, from the outline when it is known. */
function parentOf(index, id) {
  const entry = index.get(id);
  return entry && entry.parentId ? entry.parentId : topIdOf(id);
}

let isOpen = false;

function onPanelStep() {
  return Boolean(window.history.state && window.history.state.historyPanel);
}

/**
 * Call once when the page starts. The panel's history step can outlive the panel: a reload while
 * it is open, or Forward after closing it with Back. Either way the next Back press would do
 * nothing, so step back off it.
 */
export function settleHistoryStep() {
  if (onPanelStep()) window.history.back();
  window.addEventListener('popstate', () => {
    if (!isOpen && onPanelStep()) window.history.back();
  });
}

function pct(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0;
}

function addPairs(pairs) {
  return pairs.reduce((sum, pair) => [sum[0] + pair[0], sum[1] + pair[1]], [0, 0]);
}

/** Percentage-point change of the latest `recentCount` tests against the earlier ones, or null. */
function trendDelta(pairs, recentCount) {
  if (pairs.length <= recentCount) return null;
  const recent = addPairs(pairs.slice(-recentCount));
  const earlier = addPairs(pairs.slice(0, -recentCount));
  if (recent[1] < 3 || earlier[1] < 3) return null;
  return pct(recent[0], recent[1]) - pct(earlier[0], earlier[1]);
}

/** "Up 12", "Down 8", or "Steady": the word carries the direction, not just the color. */
function trendChip(delta) {
  if (delta === null) return null;
  if (delta >= 5) return h('span', { class: 'chip chip-good', title: TREND_TITLE }, `Up ${delta}`);
  if (delta <= -5) return h('span', { class: 'chip chip-bad', title: TREND_TITLE }, `Down ${Math.abs(delta)}`);
  return h('span', { class: 'chip', title: TREND_TITLE }, 'Steady');
}

function isPair(pair) {
  return Array.isArray(pair) && Number.isFinite(pair[0]) && Number.isFinite(pair[1]) && pair[1] > 0;
}

/** The [id, [correct, total]] entries of one tally of a test, in outline order. */
function pairsOf(counts) {
  if (!counts || typeof counts !== 'object') return [];
  return Object.entries(counts).filter(([, pair]) => isPair(pair)).sort((a, b) => naturalCompare(a[0], b[0]));
}

/**
 * A test's tally at the top of an outline: its units, or its domains. Tests logged before
 * 2026-11-12 kept no domain tally, so their objectives are added up by domain instead (a question
 * tagged with two objectives of one domain then counts twice there, which is close enough).
 */
function topPairs(test, view, index) {
  if (view === 'unit' || test.domains) return pairsOf(test[VIEWS[view].top]);
  const sums = {};
  for (const [id, pair] of pairsOf(test.objectives)) {
    const domain = parentOf(index, id);
    const sum = sums[domain] || (sums[domain] = [0, 0]);
    sum[0] += pair[0];
    sum[1] += pair[1];
  }
  return pairsOf(sums);
}

/** Totals per id across tests: Map(id → { id, correct, total, pairs }). `pairsFor(test)` is one test's tally. */
function collect(tests, pairsFor) {
  const rows = new Map();
  for (const test of tests) {
    for (const [id, pair] of pairsFor(test)) {
      const row = rows.get(id) || { id, correct: 0, total: 0, pairs: [] };
      row.correct += pair[0];
      row.total += pair[1];
      row.pairs.push([pair[0], pair[1]]);
      rows.set(id, row);
    }
  }
  return rows;
}

/** "Tue, Nov 10", with the year added for a test from another year. */
function dayLabel(iso) {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return 'No date';
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  if (when.getFullYear() !== new Date().getFullYear()) options.year = 'numeric';
  return when.toLocaleDateString(undefined, options);
}

/** "2:35 PM". */
function timeLabel(iso) {
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "Tue, Nov 10, 2:35 PM". */
function formatWhen(iso) {
  return [dayLabel(iso), timeLabel(iso)].filter(Boolean).join(', ');
}

/** One line of the breakdown: name, percent, then the bar, the count, and the trend. */
function scoreRow({ code, title, correct, total, delta }) {
  const percent = pct(correct, total);
  return [
    h('span', { class: 'hist-name' }, code ? [h('span', { class: 'tree-id' }, code), ' '] : null, title),
    h('strong', { class: 'hist-score' }, `${percent}%`),
    h('span', { class: 'hist-meta' },
      h('span', { class: 'bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${percent}%` } })),
      h('span', { class: 'small muted nowrap' }, `${correct} of ${total}`),
      trendChip(delta),
    ),
  ];
}

/**
 * Draw the panel. `view` is 'unit' or 'objective': the outline the breakdown and the test rows
 * follow. `onView(next)` switches it; `onClear()` empties the log; `onOpenTest(test)` shows one
 * test in full; `onDiscardTest(test)` takes one test out of the log.
 */
function renderBody(body, ctx, { view, onView, onClear, onOpenTest, onDiscardTest }) {
  const history = getHistory(ctx.exam.id);
  if (history.length === 0) {
    mount(body, h('p', { class: 'muted' }, 'No finished tests yet.'));
    return;
  }

  const outline = VIEWS[view];
  const index = view === 'objective' ? ctx.objectiveIndex : ctx.unitIndex;
  const firstTries = history.filter((test) => !test.retry);
  const titleOf = (id) => {
    const entry = index.get(id);
    return entry ? entry.node.title : '';
  };

  const sections = [];
  if (firstTries.length) {
    /* ---- Summary ---- */
    const scores = firstTries.map((test) => [test.correct, test.total]);
    const overall = addPairs(scores);
    const stat = (value, label, extra) => h('div', { class: 'stat' },
      h('div', { class: 'n' }, value), h('div', { class: 'l' }, label), extra || null);
    // "Last 5" only says something once there are more than five tests; before that, the latest one.
    let third;
    if (scores.length > RECENT_TESTS) {
      const recent = addPairs(scores.slice(-RECENT_TESTS));
      third = stat(`${pct(recent[0], recent[1])}%`, `Last ${RECENT_TESTS}`, trendChip(trendDelta(scores, RECENT_TESTS)));
    } else {
      const latest = scores[scores.length - 1];
      third = stat(`${pct(latest[0], latest[1])}%`, 'Latest');
    }
    sections.push(h('div', { class: 'hist-stats' },
      stat(String(scores.length), scores.length === 1 ? 'Test' : 'Tests'),
      stat(`${pct(overall[0], overall[1])}%`, 'Average'),
      third,
    ));

    /* ---- Recent scores (needs at least two tests to show a trend) ---- */
    const chart = firstTries.slice(-CHART_TESTS);
    if (chart.length >= 2) {
      sections.push(h('section', { class: 'panel', 'aria-labelledby': 'hist-recent' },
        h('h3', { id: 'hist-recent' }, 'Recent scores'),
        h('ol', { class: 'trend-bars' },
          chart.map((test) => {
            const percent = pct(test.correct, test.total);
            return h('li', { title: `${formatWhen(test.at)}: ${test.correct} of ${test.total}` },
              h('span', { class: 'trend-track' },
                h('span', { class: 'trend-bar', style: { height: `${Math.max(percent, 3)}%` } })),
              h('span', { class: 'trend-value' },
                h('span', { class: 'visually-hidden' }, `${formatWhen(test.at)}: `), `${percent}`,
                h('span', { class: 'visually-hidden' }, ' percent')),
            );
          }),
        ),
        h('p', { class: 'small muted', style: { margin: '0.4rem 0 0' } }, 'Percent correct, oldest first'),
      ));
    }

    /* ---- By unit (lessons inside) or by domain (objectives inside), with the switch ---- */
    const topRows = collect(firstTries, (test) => topPairs(test, view, index));
    const innerRows = collect(firstTries, (test) => pairsOf(test[outline.inner]));
    const childrenOf = (topId) => [...innerRows.values()]
      .filter((row) => parentOf(index, row.id) === topId)
      .sort((a, b) => naturalCompare(a.id, b.id));

    const tops = [...topRows.values()].sort((a, b) => naturalCompare(a.id, b.id));
    const candidates = [...innerRows.values()].filter((row) => row.total >= MIN_FOR_WEAKEST);
    const weakest = candidates.length >= 2
      ? candidates.reduce((low, row) => (pct(row.correct, row.total) < pct(low.correct, low.total) ? row : low))
      : null;

    const viewSwitch = segmented('Show scores by', 'hist-view', [
      { value: 'objective', label: VIEWS.objective.label },
      { value: 'unit', label: VIEWS.unit.label },
    ], view, onView);

    sections.push(h('section', { class: 'panel', 'aria-labelledby': 'hist-topics' },
      h('div', { class: 'panel-title' }, h('h3', { id: 'hist-topics' }, outline.heading), viewSwitch),
      tops.length ? null : h('p', { class: 'muted', style: { margin: 0 } }, `No scores by ${outline.label.toLowerCase()} yet.`),
      weakest && pct(weakest.correct, weakest.total) < 100
        ? h('p', { class: 'notice hist-weakest' },
            h('strong', null, `Weakest ${outline.innerNoun.toLowerCase()}: `),
            // Objective titles are CompTIA's sentences; drop the final period before ", 17%".
            `${weakest.id} ${titleOf(weakest.id).replace(/\.$/, '')}, ${pct(weakest.correct, weakest.total)}%`)
        : null,
      tops.length
        ? h('div', { class: 'hist-units' },
            tops.map((top) => {
              const entry = index.get(top.id);
              const children = childrenOf(top.id);
              // Collapsed, like every outline on the site: the student opens the unit or domain they want.
              // The grid lives on a span inside <summary>: Safari does not lay out a summary as a grid.
              return h('details', { class: 'hist-unit' },
                h('summary', null,
                  h('span', { class: 'hist-row hist-row-unit' },
                    h('span', { class: 'chev', 'aria-hidden': 'true' }),
                    scoreRow({
                      code: entry ? displayCode(entry.node) : (view === 'unit' ? `Unit ${top.id}` : top.id),
                      title: titleOf(top.id),
                      correct: top.correct,
                      total: top.total,
                      delta: trendDelta(top.pairs, RECENT_PER_TOPIC),
                    }),
                  ),
                ),
                children.length
                  ? h('ul', { class: 'hist-lessons' },
                      children.map((row) => h('li', { class: 'hist-row' },
                        scoreRow({
                          code: row.id,
                          title: titleOf(row.id),
                          correct: row.correct,
                          total: row.total,
                          delta: trendDelta(row.pairs, RECENT_PER_TOPIC),
                        }))))
                  : null,
              );
            }),
          )
        : null,
    ));
  }

  /* ---- Tests by date, newest first: a heading per day, then one row per test ---- */
  const testRow = (test) => {
    // A test on one unit (or domain) names its lessons (or objectives); a test across several
    // names those instead. The score for each is in the tooltip: the section above shows them.
    const tops = topPairs(test, view, index);
    const inners = pairsOf(test[outline.inner]);
    const byTop = tops.length > 1 || inners.length === 0;
    const parts = byTop ? tops : inners;
    const topics = parts.length
      ? `${byTop ? outline.topNoun : outline.innerNoun}${parts.length > 1 ? 's' : ''} ${parts.map(([id]) => id).join(', ')}`
      : '';
    const scores = parts.map(([id, pair]) => `${id}: ${pair[0]} of ${pair[1]}`).join(', ');
    const when = formatWhen(test.at);
    // View: only tests that kept their questions (the latest ones, logged since 2026-11-13).
    const viewButton = Array.isArray(test.questions) && test.questions.length
      ? h('button', { type: 'button', class: 'btn btn-sm', 'data-at': test.at, 'aria-label': `View the test from ${when}`, onClick: () => onOpenTest(test) }, 'View')
      : null;
    const discard = discardButton({ what: `test from ${when}`, className: 'discard-btn' }, () => onDiscardTest(test));
    return h('li', { class: 'hist-test' },
      h('span', { class: 'hist-time' }, timeLabel(test.at)),
      h('strong', { class: 'hist-pct' }, `${pct(test.correct, test.total)}%`),
      h('span', { class: 'hist-actions' }, viewButton, discard),
      h('div', { class: 'hist-detail small muted' },
        h('span', null, `${test.correct} of ${test.total}`),
        topics ? h('span', { title: scores }, topics) : null,
        test.retry ? h('span', { class: 'chip chip-accent' }, 'Retry') : null,
        Number.isFinite(test.planned) && test.planned > test.total ? h('span', { class: 'chip' }, 'Ended early') : null,
      ),
    );
  };
  const days = [];
  for (const test of history.slice(-LOG_LIMIT).reverse()) {
    const label = dayLabel(test.at);
    const last = days[days.length - 1];
    if (last && last.label === label) last.tests.push(test);
    else days.push({ label, tests: [test] });
  }
  sections.push(h('section', { class: 'panel', 'aria-labelledby': 'hist-log' },
    h('h3', { id: 'hist-log', tabindex: '-1' }, history.length > LOG_LIMIT ? `Tests by date (last ${LOG_LIMIT} of ${history.length})` : 'Tests by date'),
    days.map((day) => h('div', { class: 'hist-day' },
      h('h4', null, day.label),
      h('ul', { class: 'hist-tests' }, day.tests.map(testRow)),
    )),
  ));

  const clear = h('button', { type: 'button', class: 'btn btn-sm btn-ghost' }, 'Clear history');
  clear.addEventListener('click', () => {
    if (window.confirm('Delete the test history on this device?')) onClear();
  });
  sections.push(h('div', { class: 'hist-foot' }, clear));

  mount(body, sections);
}

/**
 * One past test in full, in place of the list: every question as the student saw it, tagged
 * Right, Missed, or Not answered, with the right answer marked and the reading. Graded against
 * the current answer key, like the results page. Questions taken off the site since are skipped.
 */
function renderTestView(body, ctx, test, onBack) {
  const back = h('button', { type: 'button', class: 'btn btn-sm', onClick: onBack }, 'Back');
  const cards = [];
  let gone = 0;
  test.questions.forEach((saved, i) => {
    const question = saved && ctx.questionById.get(saved.id);
    if (!question) {
      gone += 1;
      return;
    }
    const picked = Array.isArray(saved.picked) ? saved.picked : null;
    cards.push(reviewItem(ctx, { number: i + 1, question, order: saved.order, picked, status: gradeOf(question, picked) }));
  });
  const skipped = Number.isFinite(test.planned) ? test.planned - test.total : 0;
  mount(body,
    h('div', { class: 'hist-past-head' }, back),
    h('section', { class: 'panel', 'aria-labelledby': 'hist-past' },
      h('div', { class: 'panel-title' },
        h('h3', { id: 'hist-past', tabindex: '-1' }, formatWhen(test.at)),
        h('strong', { class: 'hist-pct' }, `${pct(test.correct, test.total)}%`),
      ),
      h('p', { class: 'small muted hist-past-meta' },
        `${test.correct} of ${test.total} correct`,
        skipped > 0 ? `, ${skipped} not answered` : '',
        test.retry ? ', a retry of missed questions' : ''),
      gone ? h('p', { class: 'small muted' }, `${plural(gone, 'question')} from this test ${gone === 1 ? 'is' : 'are'} no longer on the site.`) : null,
      h('ol', { class: 'missed-list' }, cards),
    ),
  );
}

/**
 * Open the panel. `opener` is the button that opened it; focus returns there on close.
 * `view` ('unit' or 'objective') is the outline to start with when the student has not picked
 * one in this panel yet; their pick is remembered on this device, per exam.
 * While it is open the rest of the page is inert, so the keyboard and screen readers
 * stay inside the panel. Escape, the Close button, a click outside, or the browser's
 * Back button (the Back gesture on a phone) closes it.
 */
export function openHistoryPanel(ctx, opener, { view: startView = 'objective' } = {}) {
  if (isOpen) return;
  isOpen = true;

  const titleId = nextId('history');
  const body = h('div', { class: 'drawer-body' });
  const closeButton = h('button', { type: 'button', class: 'btn btn-sm' }, 'Close');
  const panel = h('div', { class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
    h('div', { class: 'drawer-head' }, h('h2', { id: titleId }, 'Recent history'), closeButton),
    body,
  );
  const backdrop = h('div', { class: 'drawer-backdrop' });

  const rest = [...document.body.children];
  const previousOverflow = document.body.style.overflow;

  // Opening adds one browser-history step, so Back closes the panel instead of leaving the page.
  // (If the browser is already on such a step, it is reused instead of stacking another one.)
  let ownsHistoryStep = false;
  try {
    if (!onPanelStep()) window.history.pushState({ historyPanel: true }, '');
    ownsHistoryStep = true;
  } catch (error) {
    // No history access (unusual): the panel still closes every other way.
  }

  const onKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };
  const onBack = () => close({ wentBack: true });

  function close({ wentBack = false } = {}) {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('popstate', onBack);
    for (const element of rest) element.inert = false;
    document.body.style.overflow = previousOverflow;
    backdrop.remove();
    panel.remove();
    isOpen = false;
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    // Closed some other way than Back: drop the step this panel added.
    if (ownsHistoryStep && !wentBack) window.history.back();
  }

  const saved = store.load(viewKey(ctx.exam.id), null);
  let view = isView(saved) ? saved : (isView(startView) ? startView : 'objective');
  const switchView = (next) => {
    view = next;
    store.save(viewKey(ctx.exam.id), next);
    render();
    // The panel was drawn again: keep focus on the switch so arrow keys keep working.
    const checked = body.querySelector('input[name="hist-view"]:checked');
    if (checked) checked.focus();
  };
  const render = () => renderBody(body, ctx, {
    view,
    onView: switchView,
    onClear: () => {
      clearHistory(ctx.exam.id);
      render();
      closeButton.focus(); // the Clear button is gone; keep focus inside the panel
    },
    onOpenTest: (test) => openTest(test),
    onDiscardTest: (test) => discardTest(test),
  });
  // View: one test in full, in place of the list. Back returns to the list where it was, with
  // focus on that test's View button.
  const openTest = (test) => {
    const scrollTop = body.scrollTop;
    renderTestView(body, ctx, test, () => {
      render();
      body.scrollTop = scrollTop;
      const button = [...body.querySelectorAll('button[data-at]')].find((b) => b.dataset.at === test.at);
      (button || closeButton).focus({ preventScroll: true });
    });
    body.scrollTop = 0;
    const heading = body.querySelector('#hist-past');
    if (heading) heading.focus({ preventScroll: true });
  };
  // The two-click minus on a test row: take that test out of the log and draw the panel again.
  const discardTest = (test) => {
    removeTest(ctx.exam.id, test.at);
    const scrollTop = body.scrollTop;
    render();
    body.scrollTop = scrollTop;
    const heading = body.querySelector('#hist-log');
    (heading || closeButton).focus({ preventScroll: true });
    announce('Test discarded.');
  };

  closeButton.addEventListener('click', () => close());
  backdrop.addEventListener('click', () => close());
  document.addEventListener('keydown', onKey);
  window.addEventListener('popstate', onBack);

  for (const element of rest) element.inert = true;
  document.body.style.overflow = 'hidden';
  document.body.append(backdrop, panel);
  render();
  closeButton.focus();
}
