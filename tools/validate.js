/**
 * Browser front end for the content validator (tools/validate.html).
 * Same checks as `node tools/validate-cli.mjs`, which GitHub Actions runs before deploying.
 */
import { fetchJSON } from '../assets/js/lib/boot.js';
import { validateAll } from '../assets/js/lib/validate-core.js';
import { h, mount, plural } from '../assets/js/lib/dom.js';
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
  const placeholderItems = report.exams.reduce((n, exam) => n + (exam.stats.placeholderItems || 0), 0);
  const verdict = h('div', { class: `notice ${!ok ? 'notice-bad' : placeholderItems ? 'notice-warn' : 'notice-good'}`, role: 'status' },
    h('strong', null, !ok ? 'Errors block publishing. ' : placeholderItems ? 'Not ready for students. ' : 'Ready to publish. '),
    `${plural(report.errors.length, 'error')}, ${plural(report.warnings.length, 'warning')}.`,
    placeholderItems ? ` ${plural(placeholderItems, 'placeholder item')} to replace.` : '',
  );

  const examSections = report.exams.map((exam) => {
    const s = exam.stats;
    const stat = (n, label) => h('div', { class: 'stat' }, h('div', { class: 'n' }, String(n)), h('div', { class: 'l' }, label));
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
