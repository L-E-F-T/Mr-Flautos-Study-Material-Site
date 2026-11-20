/**
 * Browser front end for the content validator (tools/validate.html).
 * Same checks as `node tools/validate-cli.mjs`, which GitHub Actions runs before deploying.
 */
import { fetchJSON } from '../assets/js/lib/boot.js';
import { validateAll, caseTableLine } from '../assets/js/lib/validate-core.js';
import { SYSTEMS, VERDICTS, buildContext, matchSpec, specFromItem, systemName, wordsFor } from '../assets/js/lib/command-match.js';
import { h, mount, nextId, plural } from '../assets/js/lib/dom.js';
import { initThemeToggle } from '../assets/js/lib/theme.js';

initThemeToggle();

const app = document.getElementById('app');
let includePrivate = true;

run();

async function run() {
  mount(app, h('div', { class: 'wrap loading' }, 'Checking content…'));
  let report;
  try {
    report = await validateAll(fetchJSON, { includePrivate });
  } catch (error) {
    mount(app, h('div', { class: 'wrap error-box' }, h('div', { class: 'notice notice-bad' }, String(error.message || error))));
    return;
  }
  render(report);
}

function render(report) {
  const privateBox = h('input', { type: 'checkbox', checked: includePrivate });
  privateBox.addEventListener('change', () => {
    includePrivate = privateBox.checked;
    run();
  });
  const rerun = h('button', { type: 'button', class: 'btn btn-sm' }, 'Recheck');
  rerun.addEventListener('click', run);

  const ok = report.errors.length === 0;
  // A placeholder command pack counts only where command packs exist.
  const placeholderItems = report.exams.reduce((n, exam) => n + (exam.stats.placeholderItems || 0) + (exam.commandLine ? exam.commandLine.counts.placeholder : 0), 0);
  const verdict = h('div', { class: `notice ${!ok ? 'notice-bad' : placeholderItems ? 'notice-warn' : 'notice-good'}`, role: 'status' },
    h('strong', null, !ok ? 'Errors block publishing. ' : placeholderItems ? 'Not ready for students. ' : 'Ready to publish. '),
    `${plural(report.errors.length, 'error')}, ${plural(report.warnings.length, 'warning')}.`,
    placeholderItems ? ` ${plural(placeholderItems, 'placeholder item')} to replace.` : '',
  );

  const examSections = report.exams.map((exam) => {
    const s = exam.stats;
    const coverageTable = (rows, firstHeader) => h('div', { class: 'table-scroll' },
      h('table', { class: 'breakdown' },
        h('thead', null, h('tr', null,
          h('th', { scope: 'col' }, firstHeader),
          h('th', { scope: 'col', class: 'num' }, 'Questions'),
          h('th', { scope: 'col', class: 'num' }, 'Flashcards'),
        )),
        h('tbody', null, rows.map((row) => h('tr', null,
          h('td', null, h('span', { class: 'tree-id' }, row.id), ' ', row.title),
          h('td', { class: 'num', style: row.questions ? null : { color: 'var(--bad)', fontWeight: '700' } }, String(row.questions)),
          h('td', { class: 'num', style: row.flashcards ? null : { color: 'var(--text-faint)' } }, String(row.flashcards)),
        ))),
      ),
    );
    return h('section', { class: 'panel' },
      h('h2', null, `${exam.name} (${exam.code})`),
      h('div', { class: 'stat-grid', style: { marginBottom: '1rem' } },
        stat(s.questions, 'questions'),
        stat(s.multiAnswer, 'multi-answer'),
        stat(s.flashcards, 'flashcards'),
        stat(s.drafts, 'drafts'),
        stat(s.quotesMissing, 'missing a quote'),
        stat(s.privateItems, 'lab-only'),
        s.placeholderItems ? stat(s.placeholderItems, 'placeholder') : null,
      ),
      h('details', { class: 'disclosure' },
        h('summary', null, h('span', { class: 'chev', 'aria-hidden': 'true' }), 'Coverage by objective'),
        coverageTable(exam.coverage.byObjective, 'Objective'),
      ),
      h('details', { class: 'disclosure' },
        h('summary', null, h('span', { class: 'chev', 'aria-hidden': 'true' }), 'Coverage by lesson'),
        coverageTable(exam.coverage.byLesson, 'Lesson'),
      ),
      exam.commandLine ? commandLinePanel(exam.commandLine) : null,
    );
  });

  const list = (items, kind) => h('ul', { class: 'report-list' },
    items.map((item) => h('li', { class: `is-${kind}` }, h('div', { class: 'where' }, item.where), item.message)));

  mount(app,
    h('div', { class: 'wrap' },
      h('div', { class: 'page-head' },
        h('h1', null, 'Content check'),
        h('div', { class: 'toolbar' },
          h('label', { class: 'inline' }, privateBox, 'Include lab-only packs'),
          rerun,
        ),
      ),
      verdict,
      h('p', { class: 'muted small' }, caseTableLine(report)),
      report.errors.length ? h('section', { class: 'panel' }, h('h2', null, `Errors (${report.errors.length})`), list(report.errors, 'error')) : null,
      examSections,
      report.warnings.length
        ? h('section', { class: 'panel' },
            h('details', { class: 'disclosure' },
              h('summary', null, h('span', { class: 'chev', 'aria-hidden': 'true' }), `Warnings (${report.warnings.length})`),
              list(report.warnings, 'warning'),
            ),
          )
        : null,
    ),
  );
}

function stat(n, label) {
  return h('div', { class: 'stat' }, h('div', { class: 'n' }, String(n)), h('div', { class: 'l' }, label));
}

/* ---------- Command line (docs/COMMAND-LINE-PLAN.md section 14) ---------- */

const FIELD_STYLE = { width: '100%' };
const LINES_STYLE = {
  display: 'block', width: '100%', minHeight: '8rem', padding: '0.45rem 0.7rem', resize: 'vertical',
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--surface)',
  color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem',
};
// A command line is typed as it is: no capital, no correction, no spelling marks. Written as
// text, because h() skips a value of false.
const LINE_SETTINGS = { autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' };

function field(label, control) {
  const id = nextId('cl-field');
  control.id = id;
  return h('div', { style: { flex: '1 1 14rem', minWidth: '0' } },
    h('label', { for: id, class: 'small', style: { display: 'block', fontWeight: '600', marginBottom: '0.25rem' } }, label),
    control,
  );
}

/** The Command line panel of an exam: the counts, every stored line under its system, and the try-a-line box. */
function commandLinePanel(commandLine) {
  const n = commandLine.counts;
  const notCounted = VERDICTS['not-counted'].label;
  const rows = [];
  for (const system of SYSTEMS) {
    const lines = commandLine.lines.filter((row) => row.system === system);
    if (!lines.length) continue;
    rows.push(h('tr', null, h('th', { scope: 'colgroup', colspan: '6' }, systemName(system))));
    for (const row of lines) {
      const w = row.weight;
      rows.push(h('tr', null,
        h('td', null, h('code', null, row.line)),
        h('td', null, row.id),
        h('td', null, row.group === null ? notCounted : String(row.group)),
        h('td', null, row.section),
        h('td', { class: 'num' }, String(w.weight)),
        h('td', null, w.from === 'origin' ? `origin: ${w.basedOn}` : w.from === 'partner' ? `${w.id}: ${w.basedOn}` : ''),
      ));
    }
  }
  return h('div', { style: { marginTop: '1.25rem' } },
    h('h3', null, 'Command line'),
    h('div', { class: 'stat-grid', style: { marginBottom: '1rem' } },
      stat(n.commands, 'commands'),
      stat(n.versions, 'versions'),
      stat(n.followUps, 'follow-ups'),
      stat(n.extra, 'extra'),
      n.drafts ? stat(n.drafts, 'drafts') : null,
      n.placeholder ? stat(n.placeholder, 'placeholder') : null,
    ),
    rows.length
      ? h('details', { class: 'disclosure' },
          h('summary', null, h('span', { class: 'chev', 'aria-hidden': 'true' }), 'Stored lines'),
          h('div', { class: 'table-scroll' },
            h('table', { class: 'breakdown', style: { whiteSpace: 'nowrap' } },
              h('thead', null, h('tr', null,
                h('th', { scope: 'col' }, 'Line'),
                h('th', { scope: 'col' }, 'Command'),
                h('th', { scope: 'col' }, 'Group'),
                h('th', { scope: 'col' }, 'Section'),
                h('th', { scope: 'col', class: 'num' }, 'Weight'),
                h('th', { scope: 'col' }, 'From'),
              )),
              h('tbody', null, rows),
            ),
          ),
        )
      : null,
    tryBox(commandLine.commands),
  );
}

/**
 * The try-a-line box: each typed line, read by the matcher against a command, or against a
 * stored line and an also-works line typed here, gets one row with the words the page would show.
 */
function tryBox(commands) {
  const usable = commands.filter((command) => SYSTEMS.includes(command.system));
  const ctx = buildContext(usable.map(specFromItem));
  const pick = h('select', { style: FIELD_STYLE },
    h('option', { value: '' }, 'None'),
    usable.map((command, i) => h('option', { value: String(i) }, `${command.id || '(no id)'} ${systemName(command.system)}`)),
  );
  const system = h('select', { style: FIELD_STYLE }, SYSTEMS.map((s) => h('option', { value: s }, systemName(s))));
  const stored = h('input', { type: 'text', style: FIELD_STYLE, ...LINE_SETTINGS });
  const also = h('input', { type: 'text', style: FIELD_STYLE, ...LINE_SETTINGS });
  const typed = h('textarea', { rows: '6', style: LINES_STYLE, ...LINE_SETTINGS });
  const own = [field('System', system), field('Stored line', stored), field('Also works', also)];
  const results = h('div');
  const tryButton = h('button', { type: 'button', class: 'btn btn-primary' }, 'Try');

  pick.addEventListener('change', () => {
    for (const el of own) el.hidden = pick.value !== '';
  });
  tryButton.addEventListener('click', () => {
    const spec = pick.value !== ''
      ? specFromItem(usable[Number(pick.value)])
      : {
          system: system.value,
          groups: stored.value.trim() ? [[stored.value.trim()]] : [],
          given: [],
          alsoWorks: also.value.trim() ? [also.value.trim()] : [],
        };
    const lines = typed.value.split('\n').filter((line) => line.trim());
    mount(results, lines.length
      ? h('div', { class: 'table-scroll', style: { marginTop: '0.75rem' } },
          h('table', { class: 'breakdown' },
            h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Line'), h('th', { scope: 'col' }, 'Result'))),
            h('tbody', null, lines.map((line) => {
              const r = matchSpec(spec, line, ctx);
              const words = wordsFor(r);
              return h('tr', null,
                h('td', null, h('code', null, line)),
                h('td', null, h('div', { class: 'row' },
                  words.label,
                  words.tag ? h('span', { class: 'chip' }, words.tag) : null,
                  r.code === 'accepted' && spec.groups.length > 1 ? h('span', { class: 'chip' }, `group ${r.group + 1}`) : null,
                  r.counts ? h('span', { class: 'chip' }, 'a try') : null,
                )),
              );
            })),
          ),
        )
      : null);
  });

  return h('div', { style: { marginTop: '1rem' } },
    h('div', { class: 'row', style: { alignItems: 'flex-end', marginBottom: '0.75rem' } }, field('Command', pick), own),
    field('Try lines', typed),
    h('div', { style: { marginTop: '0.75rem' } }, tryButton),
    results,
  );
}
