/**
 * Command line page: a typed command drill for an exam that has the tool ("commandUnits" in
 * data/exams.json). It is built one push at a time (docs/COMMAND-LINE-PLAN.md section 14).
 * This is its start-up: boot.js picks the exam, or sends the browser to the home page for an
 * exam without the tool, before any pack loads. Then the page shows its heading, with Coming
 * soon while no command pack is listed, or the could-not-load notice that names a commands
 * manifest that cannot be read. The drill, and the Test content banner with the command packs
 * counted, come in the next push.
 */
import { bootExamPage, fetchJSON, includePrivatePacks, showFatal } from '../lib/boot.js';
import { commandState } from '../lib/content.js';
import { h, mount } from '../lib/dom.js';
import { initThemeToggle } from '../lib/theme.js';

initThemeToggle();

const ctx = await bootExamPage('commands');
if (ctx) await start(ctx);

async function start(ctx) {
  let state;
  try {
    state = await commandState(fetchJSON, ctx.exam, { includePrivate: includePrivatePacks(), preview: ctx.showDrafts });
  } catch (error) {
    showFatal(error);
    return;
  }
  mount(document.getElementById('app'),
    h('div', { class: 'wrap' },
      h('div', { class: 'page-head' }, h('h1', null, 'Command line')),
      state === 'ready' ? null : h('div', { class: 'notice' }, 'Coming soon'),
    ),
  );
}
