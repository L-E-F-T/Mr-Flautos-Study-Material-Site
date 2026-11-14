/**
 * Flashcards page.
 *  1. Picker: a table of terms grouped by exam objective or by textbook unit,
 *     with checkboxes per term and per group, plus search.
 *  2. Deck: a virtual deck built from the selection. Flip, keep (send to the
 *     back), take out, shuffle, put cards back. Saved on this device.
 */
import { bootExamPage, sourceTitle, queryFlag, pageUrl } from '../lib/boot.js';
import { h, mount, announce, plural, nextId } from '../lib/dom.js';
import { buildSelectionTree, tagChips, naturalCompare, leavesUnder } from '../lib/taxonomy.js';
import { shuffle } from '../lib/random.js';
import * as store from '../lib/storage.js';
import { displayCode } from '../components/tree-picker.js';
import { segmented } from '../components/segmented.js';
import { initThemeToggle } from '../lib/theme.js';

initThemeToggle();

// A page brought back by the Back button still holds its old deck in memory. Load it fresh, so
// it never writes that old deck over cards taken out since.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

const ctx = await bootExamPage('flashcards');
if (ctx) start(ctx);

function start(ctx) {
  const app = document.getElementById('app');
  const storeKey = `flashcards:${ctx.exam.id}`;
  const valid = (id) => ctx.flashcardById.has(id);

  const saved = store.load(storeKey, {}) || {};
  const state = {
    groupBy: saved.groupBy === 'unit' ? 'unit' : 'objective',
    frontSide: saved.frontSide === 'definition' ? 'definition' : 'term',
    shuffleOnBuild: saved.shuffleOnBuild !== false,
    selected: new Set((saved.selected || []).filter(valid)),
    search: '',
    deck: null,
  };
  if (saved.deck) {
    const queue = (saved.deck.queue || []).filter(valid);
    const removed = (saved.deck.removed || []).filter(valid);
    if (queue.length || removed.length) state.deck = { queue, removed, flipped: false };
  }

  const persist = () => {
    store.save(storeKey, {
      groupBy: state.groupBy,
      frontSide: state.frontSide,
      shuffleOnBuild: state.shuffleOnBuild,
      selected: [...state.selected],
      deck: state.deck ? { queue: state.deck.queue, removed: state.deck.removed } : null,
    });
  };

  // Cards can disappear from the content (the placeholder pack, for one, will be replaced). Save
  // the cleaned-up deck right away, so the home page stops offering to resume cards that are gone.
  const savedDeck = saved.deck || null;
  if (savedDeck && (!state.deck
    || state.deck.queue.length !== (savedDeck.queue || []).length
    || state.deck.removed.length !== (savedDeck.removed || []).length)) {
    persist();
  }

  let pileOpen = false; // remembers whether the taken-out list is expanded across re-renders

  // A saved deck opens straight away. The home page's Flashcards button adds ?choose=1 when a
  // deck is in progress, to open the list of terms instead (Resume deck opens the deck).
  const choose = queryFlag('choose');
  if (state.deck && !choose) renderDeck();
  else renderPicker();
  // Drop ?choose=1 from the address, so reloading later (phones do this on their own) opens the deck.
  if (choose) window.history.replaceState(window.history.state, '', pageUrl('flashcards.html', ctx.exam.id));

  /* ------------------------------------------------------------------ */
  /* Picker                                                              */
  /* ------------------------------------------------------------------ */

  function renderPicker({ focusHeading = false } = {}) {
    if (ctx.flashcards.length === 0) {
      mount(app,
        h('div', { class: 'wrap' },
          h('div', { class: 'page-head' }, h('h1', null, 'Flashcards')),
          h('div', { class: 'notice' }, 'Coming soon'),
        ),
      );
      return;
    }

    // Count + Build live in a bar docked to the bottom of the screen, so they stay in reach
    // however long the list of terms gets (important on phones).
    const selectedText = h('span', { class: 'action-bar-text', role: 'status' });
    const buildButton = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Build deck');
    const tableHost = h('div', { class: 'table-scroll' });
    // Persistent status region: its text changes, so screen readers hear "No terms match".
    const emptySearch = h('p', { class: 'muted', role: 'status', style: { margin: '0.5rem 0 0' } });

    const groupToggle = segmented('Group terms by', 'fc-group', [
      { value: 'objective', label: 'Exam objective' },
      { value: 'unit', label: 'Textbook unit' },
    ], state.groupBy, (value) => {
      state.groupBy = value;
      persist();
      drawTable();
    });

    const search = h('input', {
      type: 'search',
      placeholder: 'Search terms…',
      'aria-label': 'Search terms',
      value: state.search,
    });
    search.addEventListener('input', () => {
      state.search = search.value;
      drawTable();
    });

    const shuffleBox = h('input', { type: 'checkbox', checked: state.shuffleOnBuild });
    shuffleBox.addEventListener('change', () => {
      state.shuffleOnBuild = shuffleBox.checked;
      persist();
    });

    buildButton.addEventListener('click', () => {
      const ids = [...state.selected].filter(valid);
      if (!ids.length) return;
      // Keep the table's reading order when not shuffling.
      const order = new Map(ctx.flashcards.map((card, index) => [card.id, index]));
      ids.sort((a, b) => order.get(a) - order.get(b));
      // Cards already taken out of the previous deck stay out if they are still selected,
      // unless that would leave nothing to study: then the whole selection goes back in.
      const alreadyOut = new Set(state.deck ? state.deck.removed : []);
      let removed = ids.filter((id) => alreadyOut.has(id));
      let queue = ids.filter((id) => !alreadyOut.has(id));
      if (queue.length === 0) {
        queue = ids;
        removed = [];
      }
      state.deck = { queue: state.shuffleOnBuild ? shuffle(queue) : queue, removed, flipped: false };
      persist();
      renderDeck();
      window.scrollTo({ top: 0 }); // the term list was longer; start the deck at the top
      focusCard();
    });

    const backToDeck = state.deck
      ? h('button', { type: 'button', class: 'btn' }, 'Back to deck')
      : null;
    if (backToDeck) {
      backToDeck.addEventListener('click', () => {
        renderDeck();
        window.scrollTo({ top: 0 });
        focusCard();
      });
    }

    let table = null;
    const syncFooter = () => {
      const n = state.selected.size;
      selectedText.textContent = `${n} selected`;
      buildButton.disabled = n === 0;
      buildButton.textContent = n ? `Build deck (${n})` : 'Build deck';
    };

    const drawTable = () => {
      table = renderGroupedTable({
        ctx,
        groupBy: state.groupBy,
        selected: state.selected,
        query: state.search,
        onChange: () => {
          persist();
          syncFooter();
        },
      });
      mount(tableHost, table.element);
      emptySearch.textContent = table.visibleCount > 0 ? '' : 'No matches.';
      tableHost.hidden = table.visibleCount === 0;
      syncFooter();
    };

    const selectShown = h('button', { type: 'button', class: 'btn btn-sm' }, 'Select all');
    selectShown.addEventListener('click', () => table && table.setAllVisible(true));
    const clearAll = h('button', { type: 'button', class: 'btn btn-sm btn-ghost' }, 'Uncheck all');
    clearAll.addEventListener('click', () => {
      state.selected.clear();
      persist();
      drawTable();
    });

    mount(app,
      h('div', { class: 'wrap' },
        h('div', { class: 'page-head' },
          h('div', { class: 'row spread' },
            h('h1', { id: 'picker-heading', tabindex: '-1', style: { margin: 0 } }, 'Flashcards'),
            backToDeck,
          ),
        ),
        h('section', { class: 'panel', 'aria-label': 'Choose terms' },
          h('div', { class: 'toolbar', style: { marginBottom: '0.9rem' } },
            groupToggle, search, h('span', { class: 'spacer' }),
            h('label', { class: 'inline' }, shuffleBox, 'Shuffle deck'),
            selectShown, clearAll,
          ),
          tableHost,
          emptySearch,
        ),
        h('div', { class: 'action-bar', role: 'region', 'aria-label': 'Build deck' },
          h('div', { class: 'action-bar-inner' }, selectedText, buildButton),
        ),
      ),
    );
    drawTable();
    if (focusHeading) {
      window.scrollTo({ top: 0 });
      const heading = document.getElementById('picker-heading');
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Deck                                                                */
  /* ------------------------------------------------------------------ */

  function renderDeck() {
    const deck = state.deck;

    // Going back to the picker keeps this deck (and its taken-out pile) until a new one is built.
    const changeCards = h('button', { type: 'button', class: 'btn' }, 'Choose cards');
    changeCards.addEventListener('click', () => renderPicker({ focusHeading: true }));
    const shuffleButton = h('button', { type: 'button', class: 'btn', disabled: deck.queue.length < 2 }, 'Shuffle');
    shuffleButton.addEventListener('click', doShuffle);
    const putAllBack = h('button', { type: 'button', class: 'btn', disabled: deck.removed.length === 0 }, 'Put all back');
    putAllBack.addEventListener('click', () => {
      deck.queue.push(...deck.removed);
      deck.removed = [];
      shuffle(deck.queue);
      deck.flipped = false;
      persist();
      renderDeck();
      focusCard();
      announce('All cards are back in the deck, shuffled.');
    });

    const frontSelect = h('select', { 'aria-label': 'Side to show first' },
      h('option', { value: 'term', selected: state.frontSide === 'term' }, 'Term first'),
      h('option', { value: 'definition', selected: state.frontSide === 'definition' }, 'Definition first'),
    );
    frontSelect.addEventListener('change', () => {
      state.frontSide = frontSelect.value;
      deck.flipped = false;
      persist();
      renderDeck();
      const select = app.querySelector('.deck-tools select');
      if (select) select.focus();
    });

    // Title and counts on one line so the card itself starts near the top of a phone screen.
    const header = h('div', { class: 'page-head deck-head' },
      h('div', { class: 'row spread' },
        h('h1', { style: { margin: 0 } }, 'Your deck'),
        h('div', { class: 'deck-stats' },
          h('span', null, h('strong', null, String(deck.queue.length)), ' in deck'),
          h('span', null, h('strong', null, String(deck.removed.length)), ' taken out'),
        ),
      ),
    );
    // Secondary actions sit below the card, out of the way of the four main buttons.
    const tools = h('div', { class: 'deck-tools', role: 'group', 'aria-label': 'Deck options' },
      frontSelect, shuffleButton, putAllBack, changeCards);

    const pile = renderPile();

    if (deck.queue.length === 0) {
      const again = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Put all back');
      again.addEventListener('click', () => putAllBack.click());
      const choose = h('button', { type: 'button', class: 'btn btn-lg' }, 'Choose cards');
      choose.addEventListener('click', () => changeCards.click());
      mount(app,
        h('div', { class: 'wrap' },
          header,
          h('section', { class: 'panel deck-done' },
            h('h2', null, 'Deck finished'),
            h('div', { class: 'row', style: { justifyContent: 'center' } }, again, choose),
          ),
          pile,
        ),
      );
      again.focus();
      return;
    }

    const card = ctx.flashcardById.get(deck.queue[0]);
    const showTermFirst = state.frontSide === 'term';
    const frontText = showTermFirst ? card.term : card.definition;
    const backText = showTermFirst ? card.definition : card.term;
    const chips = tagChips(card, ctx.objectiveIndex, ctx.unitIndex);

    const reference = card.reference && card.reference.section
      ? h('div', { class: 'card-ref', title: sourceTitle(ctx.exam, card.reference.source) },
          `Reading ${card.reference.section}`,
          card.reference.title ? ` ${card.reference.title}` : '')
      : null;

    const front = h('div', { class: 'card-face front', 'aria-hidden': String(deck.flipped) },
      h('span', { class: 'card-side-label' }, showTermFirst ? 'Term' : 'Definition'),
      h('span', { class: 'card-tags' }, chips.map((chip) => h('span', { class: 'chip', title: chip.title }, chip.label))),
      h('div', { class: 'card-text' }, frontText),
      card.status === 'draft' ? h('span', { class: 'badge' }, 'Draft') : null,
    );
    const back = h('div', { class: 'card-face back', 'aria-hidden': String(!deck.flipped) },
      h('span', { class: 'card-side-label' }, showTermFirst ? 'Definition' : 'Term'),
      h('div', { class: 'card-text' }, backText),
      reference,
    );
    // The accessible name is the visible side's text, so screen readers hear the term itself.
    // The back also carries the reading reference, which is shown on that face.
    const refText = card.reference && card.reference.section
      ? `. Reading ${card.reference.section}${card.reference.title ? ` ${card.reference.title}` : ''}`
      : '';
    const sideName = (flipped) => (flipped
      ? `${showTermFirst ? 'Definition' : 'Term'}: ${backText}${refText}`
      : `${showTermFirst ? 'Term' : 'Definition'}: ${frontText}`);
    const cardButton = h('button', {
      type: 'button',
      class: `flashcard${deck.flipped ? ' is-flipped' : ''}`,
      'aria-label': sideName(deck.flipped),
    }, front, back);
    cardButton.addEventListener('click', flip);
    // Shortcuts only while the card has focus (WCAG 2.1.4). Space/Enter flip natively (it is a button).
    cardButton.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key;
      if (key === 'ArrowRight' || key === 'k' || key === 'K') { event.preventDefault(); keep(); }
      else if (key === 'ArrowDown' || key === 'x' || key === 'X') { event.preventDefault(); takeOut(); }
      else if (key === 'ArrowLeft' || key === 'j' || key === 'J') { event.preventDefault(); previous(); }
      else if (key === 's' || key === 'S') { event.preventDefault(); doShuffle(); }
    });

    // Keyboard shortcuts (with the card focused) are listed only in these tooltips.
    const prevButton = h('button', { type: 'button', class: 'btn', disabled: deck.queue.length < 2, title: 'Left arrow' }, 'Previous');
    prevButton.addEventListener('click', previous);
    const flipButton = h('button', { type: 'button', class: 'btn', title: 'Space' }, 'Flip');
    flipButton.addEventListener('click', flip);
    const keepButton = h('button', { type: 'button', class: 'btn btn-primary', title: 'Keeps the card in the deck. Right arrow' }, 'Next');
    keepButton.addEventListener('click', keep);
    const takeOutButton = h('button', { type: 'button', class: 'btn btn-outline', title: 'Removes the card from the deck. Down arrow or X' }, 'Take out');
    takeOutButton.addEventListener('click', takeOut);

    mount(app,
      h('div', { class: 'wrap deck-layout' },
        header,
        h('div', { class: 'flashcard-stage' }, cardButton),
        h('div', { class: 'deck-controls' }, prevButton, flipButton, keepButton, takeOutButton),
        tools,
        pile,
      ),
    );

    function flip() {
      deck.flipped = !deck.flipped;
      cardButton.classList.toggle('is-flipped', deck.flipped);
      front.setAttribute('aria-hidden', String(deck.flipped));
      back.setAttribute('aria-hidden', String(!deck.flipped));
      cardButton.setAttribute('aria-label', sideName(deck.flipped));
      announce(deck.flipped ? `${backText}${refText}` : frontText);
    }
  }

  function keep() {
    const deck = state.deck;
    if (!deck || deck.queue.length === 0) return;
    deck.queue.push(deck.queue.shift());
    deck.flipped = false;
    persist();
    renderDeck();
    focusCard();
  }

  function previous() {
    const deck = state.deck;
    if (!deck || deck.queue.length < 2) return;
    deck.queue.unshift(deck.queue.pop());
    deck.flipped = false;
    persist();
    renderDeck();
    focusCard();
  }

  function takeOut() {
    const deck = state.deck;
    if (!deck || deck.queue.length === 0) return;
    const id = deck.queue.shift();
    deck.removed.push(id);
    deck.flipped = false;
    persist();
    renderDeck();
    const card = ctx.flashcardById.get(id);
    announce(`Took out ${card ? card.term : 'card'}. ${plural(deck.queue.length, 'card')} left.`);
    focusCard();
  }

  function doShuffle() {
    const deck = state.deck;
    if (!deck || deck.queue.length < 2) return;
    shuffle(deck.queue);
    deck.flipped = false;
    persist();
    renderDeck();
    announce('Deck shuffled.');
    focusCard();
  }

  function focusCard() {
    const card = app.querySelector('.flashcard');
    if (card) card.focus({ preventScroll: true });
  }

  function renderPile() {
    const deck = state.deck;
    if (!deck || deck.removed.length === 0) return null;
    const items = deck.removed.map((id, index) => {
      const card = ctx.flashcardById.get(id);
      const back = h('button', { type: 'button', class: 'btn btn-sm', 'aria-label': `Put ${card.term} back in the deck` }, 'Put back');
      back.addEventListener('click', () => {
        deck.removed = deck.removed.filter((x) => x !== id);
        deck.queue.push(id);
        persist();
        renderDeck();
        announce(`${card.term} is back in the deck.`);
        // Keep the student in the list: focus the next "Put back" button, or the card if the list is gone.
        const buttons = app.querySelectorAll('.pile-list button');
        const nextButton = buttons[Math.min(index, buttons.length - 1)];
        if (nextButton) nextButton.focus();
        else focusCard();
      });
      return h('li', null, h('span', null, card.term), back);
    });
    const details = h('details', { class: 'panel disclosure', open: pileOpen },
      h('summary', null, h('span', { class: 'chev', 'aria-hidden': 'true' }), `Taken out (${deck.removed.length})`),
      h('ul', { class: 'pile-list' }, items),
    );
    details.addEventListener('toggle', () => { pileOpen = details.open; });
    return details;
  }
}

/* -------------------------------------------------------------------- */
/* Grouped table of terms                                               */
/* -------------------------------------------------------------------- */

function renderGroupedTable({ ctx, groupBy, selected, query, onChange }) {
  const byObjective = groupBy === 'objective';
  const tree = buildSelectionTree(
    byObjective ? ctx.objectiveRoots : ctx.unitRoots,
    ctx.flashcards,
    (card) => (byObjective ? card.objectives : card.units),
    { maxDepth: 2 },
  );

  const needle = query.trim().toLowerCase();
  const matches = (card) => !needle
    || card.term.toLowerCase().includes(needle)
    || (card.aliases || []).some((alias) => String(alias).toLowerCase().includes(needle));

  const itemBoxes = new Map(); // card id → checkboxes (a term can appear in several groups)
  const groupControls = []; // { checkbox, ids }
  const tbodies = [];
  let visibleCount = 0;
  const allVisible = new Set();

  const refresh = () => {
    for (const [id, boxes] of itemBoxes) for (const box of boxes) box.checked = selected.has(id);
    for (const { checkbox, ids } of groupControls) {
      const on = ids.filter((id) => selected.has(id)).length;
      checkbox.checked = ids.length > 0 && on === ids.length;
      checkbox.indeterminate = on > 0 && on < ids.length;
    }
  };

  const setMany = (ids, on) => {
    for (const id of ids) {
      if (on) selected.add(id);
      else selected.delete(id);
    }
    refresh();
    onChange();
  };

  const cardsIn = (node) => {
    const ids = new Set();
    for (const leaf of leavesUnder(node)) for (const id of leaf.itemIds) ids.add(id);
    return [...ids].map((id) => ctx.flashcardById.get(id)).filter(Boolean).filter(matches)
      .sort((a, b) => naturalCompare(a.term, b.term));
  };

  const groupHeader = (node, level, ids, controlsId) => {
    const checkbox = h('input', { type: 'checkbox', disabled: ids.length === 0 });
    checkbox.addEventListener('change', () => setMany(ids, checkbox.checked));
    groupControls.push({ checkbox, ids });
    const code = displayCode(node);
    const toggle = h('button', {
      type: 'button',
      class: 'tree-toggle',
      'aria-controls': controlsId,
      'aria-label': `Expand ${[code, node.title].filter(Boolean).join(' ')}`,
      'aria-expanded': 'false',
    }, h('span', { class: 'chev', 'aria-hidden': 'true' }));
    const row = h('tr', { class: `group-row level-${level}` },
      h('th', { colspan: '4', scope: 'rowgroup' },
        h('div', { class: 'group-inner' },
          toggle,
          h('label', null, checkbox,
            h('span', null, code ? [h('span', { class: 'tree-id' }, code), ' '] : null, node.title)),
          h('span', { class: 'group-count' }, String(ids.length)),
        ),
      ),
    );
    return { row, toggle };
  };

  const itemRow = (card) => {
    // The term is the checkbox's label, so tapping anywhere on the term selects it.
    const boxId = nextId('fc');
    const box = h('input', { type: 'checkbox', id: boxId, checked: selected.has(card.id) });
    box.addEventListener('change', () => setMany([card.id], box.checked));
    if (!itemBoxes.has(card.id)) itemBoxes.set(card.id, []);
    itemBoxes.get(card.id).push(box);
    const objectiveChips = tagChips({ objectives: card.objectives }, ctx.objectiveIndex, ctx.unitIndex);
    const unitChips = tagChips({ units: card.units }, ctx.objectiveIndex, ctx.unitIndex);
    return h('tr', { class: 'item-row' },
      h('td', { class: 'col-check' }, box),
      h('td', { class: 'term' },
        h('label', { for: boxId }, card.term, card.status === 'draft' ? [' ', h('span', { class: 'badge' }, 'Draft')] : null)),
      h('td', null, h('div', { class: 'tags' }, objectiveChips.map((c) => h('span', { class: 'chip', title: c.title }, c.label)))),
      h('td', { class: 'col-unit' }, h('div', { class: 'tags' }, unitChips.map((c) => h('span', { class: 'chip', title: c.title }, c.label)))),
    );
  };

  // The column headings label the term rows. With every group collapsed no terms show, so the
  // headings would line up with nothing: they show only while some term rows are showing.
  const thead = h('thead', null,
    h('tr', null,
      h('th', { class: 'col-check', scope: 'col' }, h('span', { class: 'visually-hidden' }, 'Select')),
      h('th', { scope: 'col' }, 'Term'),
      h('th', { scope: 'col' }, 'Objective'),
      h('th', { scope: 'col', class: 'col-unit' }, 'Unit / lesson'),
    ),
  );
  const syncHeader = () => {
    thead.hidden = !tbodies.some((body) => !body.hidden
      && [...body.children].some((row) => row.classList.contains('item-row') && !row.hidden));
  };

  // A domain, objective, unit, or lesson with no cards yet: one greyed row labeled
  // "Coming soon", so the outline is complete. Left out while searching.
  const soonRow = (node, level) => {
    const code = displayCode(node);
    return h('tr', { class: `group-row level-${level} is-soon` },
      h('th', { colspan: '4', scope: 'row' },
        h('div', { class: 'group-inner' },
          h('span', { class: 'tree-spacer', 'aria-hidden': 'true' }),
          h('label', null, h('input', { type: 'checkbox', disabled: true }),
            h('span', { class: 'group-name', title: [code, node.title].filter(Boolean).join(' ') },
              code ? [h('span', { class: 'tree-id' }, code), ' '] : null,
              h('span', { class: 'tree-title' }, node.title)),
            h('span', { class: 'chip' }, 'Coming soon')),
        ),
      ),
    );
  };

  for (const root of tree.roots) {
    const rootCards = cardsIn(root);
    if (rootCards.length === 0) {
      if (!needle && root.total === 0) tbodies.push(h('tbody', null, soonRow(root, 0)));
      continue;
    }
    const rootIds = rootCards.map((card) => card.id);
    const rootBodyId = nextId('grp');
    const rootHeader = groupHeader(root, 0, rootIds, rootBodyId);
    const rootBody = h('tbody', { id: rootBodyId }, rootHeader.row);
    tbodies.push(rootBody);
    const childBodies = [];

    const children = root.children.length ? root.children : [root];
    for (const child of children) {
      const cards = child === root ? rootCards : cardsIn(child);
      if (cards.length === 0) {
        if (!needle && child !== root && child.total === 0) {
          const body = h('tbody', null, soonRow(child, 1));
          childBodies.push(body);
          tbodies.push(body);
        }
        continue;
      }
      const rows = cards.map(itemRow);
      cards.forEach((card) => allVisible.add(card.id));
      visibleCount += cards.length;
      if (child === root) {
        rootBody.append(...rows);
        continue;
      }
      const bodyId = nextId('grp');
      const childHeader = groupHeader(child, 1, cards.map((card) => card.id), bodyId);
      const body = h('tbody', { id: bodyId }, childHeader.row, rows);
      // Collapsed unless searching, so the outline is easy to scan.
      const startOpen = Boolean(needle);
      setRowsHidden(rows, !startOpen);
      setToggle(childHeader.toggle, startOpen);
      childHeader.toggle.addEventListener('click', () => {
        const open = childHeader.toggle.getAttribute('aria-expanded') !== 'true';
        setRowsHidden(rows, !open);
        setToggle(childHeader.toggle, open);
        syncHeader();
      });
      childBodies.push(body);
      tbodies.push(body);
    }

    const showRoot = (open) => {
      for (const body of childBodies) body.hidden = !open;
      setRowsHidden([...rootBody.querySelectorAll('tr.item-row')], !open);
      setToggle(rootHeader.toggle, open);
      syncHeader();
    };
    // Each domain or unit starts collapsed too, unless searching, so the table opens as a short list.
    showRoot(Boolean(needle));
    rootHeader.toggle.addEventListener('click', () => {
      showRoot(rootHeader.toggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  const table = h('table', { class: 'fc-table' }, thead, tbodies);
  syncHeader();
  refresh();

  return {
    element: table,
    visibleCount,
    setAllVisible(on) { setMany([...allVisible], on); },
  };
}

function setRowsHidden(rows, hidden) {
  for (const row of rows) row.hidden = hidden;
}

function setToggle(button, open) {
  button.setAttribute('aria-expanded', String(open));
  const label = button.getAttribute('aria-label') || '';
  button.setAttribute('aria-label', label.replace(/^(Expand|Collapse)/, open ? 'Collapse' : 'Expand'));
}
