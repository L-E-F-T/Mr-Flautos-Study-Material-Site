/**
 * Quote helper (teacher tool, local only; not published to GitHub Pages).
 * Open a question pack, see each question's correct answer, reading section, and
 * "find" phrase, open that section's PDF, paste the sentence that answers it,
 * and save straight back into the pack file.
 *
 * Saving in place uses the File System Access API (Chrome or Edge). Other browsers
 * fall back to downloading the updated file.
 */
import { h, mount } from '../assets/js/lib/dom.js';
import { MAX_QUOTE_WORDS } from '../assets/js/lib/validate-core.js';
import { initThemeToggle } from '../assets/js/lib/theme.js';

initThemeToggle();

const app = document.getElementById('app');
const canPick = typeof window.showOpenFilePicker === 'function';

const state = {
  fileHandle: null,
  fileName: '',
  pack: null,
  modules: null, // directory handle of the CertMaster Modules folder (optional)
  onlyMissing: true,
  dirty: false,
};

window.addEventListener('beforeunload', (event) => {
  if (state.dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});

render();

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

/** Same compact layout as the site's data files: short objects and arrays stay on one line. */
export function formatJson(value, level = 0, width = 110) {
  const ind = '  '.repeat(level);
  const ind1 = '  '.repeat(level + 1);
  const simple = (v) => v === null || typeof v !== 'object';
  if (simple(value)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const parts = value.map((v) => formatJson(v, level + 1, width));
    const inline = `[${parts.join(', ')}]`;
    if (value.every(simple) && inline.length + ind.length <= width) return inline;
    return `[\n${parts.map((p) => ind1 + p).join(',\n')}\n${ind}]`;
  }
  const keys = Object.keys(value);
  if (!keys.length) return '{}';
  const parts = keys.map((k) => `${JSON.stringify(k)}: ${formatJson(value[k], level + 1, width)}`);
  const inline = `{ ${parts.join(', ')} }`;
  if (keys.every((k) => simple(value[k])) && inline.length + ind.length <= width) return inline;
  return `{\n${parts.map((p) => ind1 + p).join(',\n')}\n${ind}}`;
}

async function openPack() {
  try {
    let file;
    if (canPick) {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Question pack', accept: { 'application/json': ['.json'] } }],
        excludeAcceptAllOption: false,
      });
      state.fileHandle = handle;
      file = await handle.getFile();
    } else {
      file = await new Promise((resolve) => {
        const input = h('input', { type: 'file', accept: '.json,application/json' });
        input.addEventListener('change', () => resolve(input.files[0]));
        input.click();
      });
      if (!file) return;
    }
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.questions)) throw new Error('That file has no "questions" array. Pick a file from data/<exam>/questions/.');
    state.pack = data;
    state.fileName = file.name;
    state.dirty = false;
    render();
  } catch (error) {
    if (error && error.name === 'AbortError') return;
    alert(String(error.message || error));
  }
}

async function pickModules() {
  try {
    state.modules = await window.showDirectoryPicker({ id: 'certmaster-modules', mode: 'read' });
    render();
  } catch (error) {
    if (error && error.name !== 'AbortError') alert(String(error.message || error));
  }
}

async function openReading(section) {
  if (!state.modules) return;
  for await (const [name, handle] of state.modules.entries()) {
    if (handle.kind === 'file' && name.toLowerCase().endsWith('.pdf') && name.startsWith(`${section} `)) {
      const file = await handle.getFile();
      window.open(URL.createObjectURL(file), '_blank', 'noopener');
      return;
    }
  }
  alert(`No PDF starting with "${section} " in the folder you picked.`);
}

async function save() {
  const text = `${formatJson(state.pack)}\n`;
  try {
    if (state.fileHandle && typeof state.fileHandle.createWritable === 'function') {
      const writable = await state.fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
    } else {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const link = h('a', { href: url, download: state.fileName || 'pack.json' });
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
    state.dirty = false;
    render();
  } catch (error) {
    alert(`Could not save: ${error.message || error}`);
  }
}

function render() {
  if (!state.pack) {
    const open = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Open question pack');
    open.addEventListener('click', openPack);
    mount(app,
      h('div', { class: 'wrap' },
        h('div', { class: 'page-head' },
          h('h1', null, 'Quote helper'),
          h('p', null, `Paste the sentence from the reading that answers each question. ${MAX_QUOTE_WORDS} words max.`),
        ),
        canPick ? null : h('div', { class: 'notice notice-warn', style: { marginBottom: '1rem' } }, 'This browser downloads the file on Save. Chrome and Edge save in place.'),
        open,
      ),
    );
    return;
  }

  const questions = state.pack.questions;
  const missing = questions.filter((q) => !(q.reference && String(q.reference.quote || '').trim())).length;
  const shown = state.onlyMissing ? questions.filter((q) => !(q.reference && String(q.reference.quote || '').trim())) : questions;

  const saveButton = h('button', { type: 'button', class: 'btn btn-primary', disabled: !state.dirty }, state.dirty ? 'Save changes' : 'Saved');
  saveButton.addEventListener('click', save);
  const filter = h('input', { type: 'checkbox', checked: state.onlyMissing });
  filter.addEventListener('change', () => { state.onlyMissing = filter.checked; render(); });
  const modulesButton = h('button', { type: 'button', class: 'btn btn-sm' }, state.modules ? `Readings: ${state.modules.name}` : 'Choose Modules folder');
  modulesButton.addEventListener('click', pickModules);
  const other = h('button', { type: 'button', class: 'btn btn-sm btn-ghost' }, 'Other pack');
  other.addEventListener('click', () => {
    if (state.dirty && !confirm('Unsaved quotes will be lost. Continue?')) return;
    state.pack = null;
    state.fileHandle = null;
    render();
  });

  const cards = shown.map((q) => {
    const ref = q.reference || (q.reference = { source: 'certmaster', section: '' });
    const answerText = (q.answer || [])
      .map((id) => (q.choices || []).find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => c.text)
      .join('  +  ');
    const count = h('span', { class: 'word-count small' });
    const box = h('textarea', { 'aria-label': `Quote for ${q.id}`, placeholder: 'Quote from the reading' });
    box.value = ref.quote || '';
    const updateCount = () => {
      const n = wordCount(box.value);
      count.textContent = `${n} / ${MAX_QUOTE_WORDS} words`;
      count.classList.toggle('is-over', n > MAX_QUOTE_WORDS);
    };
    box.addEventListener('input', () => {
      ref.quote = box.value.replace(/\s+/g, ' ').trim();
      state.dirty = true;
      saveButton.disabled = false;
      saveButton.textContent = 'Save changes';
      updateCount();
    });
    updateCount();

    const copyFind = h('button', { type: 'button', class: 'btn btn-sm btn-ghost', title: 'Copy the search phrase' }, 'Copy');
    copyFind.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(ref.find || ''); copyFind.textContent = 'Copied'; } catch { /* ignore */ }
    });
    const openPdf = h('button', { type: 'button', class: 'btn btn-sm', disabled: !state.modules || !ref.section }, `Open ${ref.section || 'reading'} PDF`);
    openPdf.addEventListener('click', () => openReading(ref.section));

    return h('section', { class: 'panel quote-card' },
      h('div', { class: 'row spread' },
        h('strong', null, q.id),
        h('span', { class: 'muted small' }, `Reading ${ref.section || '?'} ${ref.title || ''}`),
      ),
      h('p', { style: { margin: 0 } }, q.stem),
      h('p', { style: { margin: 0 } }, 'Answer: ', h('span', { class: 'answer' }, answerText || '(no answer key)')),
      ref.find
        ? h('div', { class: 'row' }, h('span', { class: 'small muted' }, 'Find:'), h('span', { class: 'find' }, ref.find), copyFind, openPdf)
        : h('div', { class: 'row' }, openPdf),
      box,
      count,
    );
  });

  mount(app,
    h('div', { class: 'wrap' },
      h('div', { class: 'page-head', style: { paddingBottom: '0.5rem' } },
        h('h1', null, 'Quote helper'),
        h('p', null, `${state.fileName}: ${questions.length} questions, ${missing} missing a quote`),
      ),
      h('div', { class: 'sticky-bar' },
        h('div', { class: 'toolbar' },
          h('label', { class: 'inline' }, filter, 'Missing quotes only'),
          modulesButton,
          h('span', { class: 'spacer' }),
          other,
          saveButton,
        ),
      ),
      h('div', { class: 'stack', style: { marginTop: '1rem' } },
        cards.length ? cards : h('div', { class: 'notice notice-good' }, 'All quotes added.'),
      ),
    ),
  );
}
