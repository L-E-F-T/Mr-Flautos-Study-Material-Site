/**
 * History side panel: the log of finished practice tests kept on this device, turned into
 * something a student can act on:
 *   - recent scores, to see the trend;
 *   - a breakdown by unit and lesson, with the weakest lesson called out;
 *   - the list of tests, each with its score per unit (or per lesson, for a one-unit test).
 * Retry rounds (only previously missed questions) are listed but left out of the averages
 * and trends, because they would skew them.
 *
 * The log itself is written by the practice page through recordTestResult() in
 * assets/js/lib/progress.js.
 */
import { h, mount, nextId } from '../lib/dom.js';
import { getHistory, clearHistory } from '../lib/progress.js';
import { naturalCompare } from '../lib/taxonomy.js';
import { displayCode } from './tree-picker.js';

const RECENT_TESTS = 5; // "Last 5" in the summary, and the overall trend
const RECENT_PER_TOPIC = 3; // tests compared with earlier ones for a unit or lesson trend
const CHART_TESTS = 10; // bars in the recent-scores chart
const LOG_LIMIT = 30; // tests listed
const MIN_FOR_WEAKEST = 4; // answers a lesson needs before it can be called the weakest
const TREND_TITLE = 'Latest tests compared with the ones before';

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

/** Totals per unit or lesson id across tests: Map(id → { id, correct, total, pairs }). */
function collect(tests, bucket) {
  const rows = new Map();
  for (const test of tests) {
    for (const [id, pair] of pairsOf(test[bucket])) {
      const row = rows.get(id) || { id, correct: 0, total: 0, pairs: [] };
      row.correct += pair[0];
      row.total += pair[1];
      row.pairs.push([pair[0], pair[1]]);
      rows.set(id, row);
    }
  }
  return rows;
}

function formatWhen(iso) {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return '';
  return when.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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

function renderBody(body, ctx, onClear) {
  const history = getHistory(ctx.exam.id);
  if (history.length === 0) {
    mount(body, h('p', { class: 'muted' }, 'No finished tests yet.'));
    return;
  }

  const firstTries = history.filter((test) => !test.retry);
  const titleOf = (id) => {
    const entry = ctx.unitIndex.get(id);
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

    /* ---- By unit, with lessons inside ---- */
    const unitRows = collect(firstTries, 'units');
    const lessonRows = collect(firstTries, 'lessons');

    const lessonsOf = (unitId) => [...lessonRows.values()]
      .filter((lesson) => {
        const entry = ctx.unitIndex.get(lesson.id);
        return entry ? entry.parentId === unitId : `${lesson.id.split('.')[0]}.0` === unitId;
      })
      .sort((a, b) => naturalCompare(a.id, b.id));

    const units = [...unitRows.values()].sort((a, b) => naturalCompare(a.id, b.id));
    const candidates = [...lessonRows.values()].filter((lesson) => lesson.total >= MIN_FOR_WEAKEST);
    const weakest = candidates.length >= 2
      ? candidates.reduce((low, lesson) => (pct(lesson.correct, lesson.total) < pct(low.correct, low.total) ? lesson : low))
      : null;

    if (units.length) {
      sections.push(h('section', { class: 'panel', 'aria-labelledby': 'hist-units' },
        h('h3', { id: 'hist-units' }, 'By unit'),
        weakest && pct(weakest.correct, weakest.total) < 100
          ? h('p', { class: 'notice hist-weakest' },
              h('strong', null, 'Weakest lesson: '),
              `${weakest.id} ${titleOf(weakest.id)}, ${pct(weakest.correct, weakest.total)}%`)
          : null,
        h('div', { class: 'hist-units' },
          units.map((unit) => {
            const entry = ctx.unitIndex.get(unit.id);
            const lessons = lessonsOf(unit.id);
            // The grid lives on a span inside <summary>: Safari does not lay out a summary as a grid.
            return h('details', { class: 'hist-unit', open: units.length <= 3 },
              h('summary', null,
                h('span', { class: 'hist-row hist-row-unit' },
                  h('span', { class: 'chev', 'aria-hidden': 'true' }),
                  scoreRow({
                    code: entry ? displayCode(entry.node) : `Unit ${unit.id}`,
                    title: titleOf(unit.id),
                    correct: unit.correct,
                    total: unit.total,
                    delta: trendDelta(unit.pairs, RECENT_PER_TOPIC),
                  }),
                ),
              ),
              lessons.length
                ? h('ul', { class: 'hist-lessons' },
                    lessons.map((lesson) => h('li', { class: 'hist-row' },
                      scoreRow({
                        code: lesson.id,
                        title: titleOf(lesson.id),
                        correct: lesson.correct,
                        total: lesson.total,
                        delta: trendDelta(lesson.pairs, RECENT_PER_TOPIC),
                      }))))
                : null,
            );
          }),
        ),
      ));
    }
  }

  /* ---- The log, newest first ---- */
  const shown = history.slice(-LOG_LIMIT).reverse();
  sections.push(h('section', { class: 'panel', 'aria-labelledby': 'hist-log' },
    h('h3', { id: 'hist-log' }, history.length > LOG_LIMIT ? `Tests (last ${LOG_LIMIT} of ${history.length})` : 'Tests'),
    h('ul', { class: 'hist-tests' },
      shown.map((test) => {
        // A test on one unit lists its lessons; a test across units lists the units.
        const units = pairsOf(test.units);
        const parts = units.length > 1
          ? units.map(([id, pair]) => ({ id, label: `Unit ${id}`, pair }))
          : pairsOf(test.lessons).map(([id, pair]) => ({ id, label: id, pair }));
        return h('li', { class: 'hist-test' },
          h('div', { class: 'row spread' },
            h('span', null, formatWhen(test.at)),
            h('strong', null, `${pct(test.correct, test.total)}%`),
          ),
          h('div', { class: 'row small muted' },
            h('span', null, `${test.correct} of ${test.total}`),
            test.retry ? h('span', { class: 'chip chip-accent' }, 'Retry') : null,
            Number.isFinite(test.planned) && test.planned > test.total ? h('span', { class: 'chip' }, 'Ended early') : null,
          ),
          parts.length
            ? h('div', { class: 'hist-chips' },
                parts.map((part) => h('span', { class: 'chip', title: titleOf(part.id) },
                  `${part.label}: ${part.pair[0]}/${part.pair[1]}`)))
            : null,
        );
      }),
    ),
  ));

  const clear = h('button', { type: 'button', class: 'btn btn-sm btn-ghost' }, 'Clear history');
  clear.addEventListener('click', () => {
    if (window.confirm('Delete the test history on this device?')) onClear();
  });
  sections.push(h('div', { class: 'hist-foot' }, clear));

  mount(body, sections);
}

/**
 * Open the panel. `opener` is the button that opened it; focus returns there on close.
 * While it is open the rest of the page is inert, so the keyboard and screen readers
 * stay inside the panel. Escape, the Close button, a click outside, or the browser's
 * Back button (the Back gesture on a phone) closes it.
 */
export function openHistoryPanel(ctx, opener) {
  if (isOpen) return;
  isOpen = true;

  const titleId = nextId('history');
  const body = h('div', { class: 'drawer-body' });
  const closeButton = h('button', { type: 'button', class: 'btn btn-sm' }, 'Close');
  const panel = h('div', { class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
    h('div', { class: 'drawer-head' }, h('h2', { id: titleId }, 'History'), closeButton),
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

  const render = () => renderBody(body, ctx, () => {
    clearHistory(ctx.exam.id);
    render();
    closeButton.focus(); // the Clear button is gone; keep focus inside the panel
  });

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
