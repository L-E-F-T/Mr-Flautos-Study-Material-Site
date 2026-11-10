/**
 * Tree picker: nested checkboxes with item counts and expand/collapse.
 * Selection is a Set of LEAF ids; parent checkboxes show checked / mixed states.
 * A topic with no items yet is greyed out and labeled "Coming soon" (and does not open),
 * so students still see the whole outline.
 */
import { h, nextId } from '../lib/dom.js';
import { leavesUnder } from '../lib/taxonomy.js';

/**
 * Code shown before a node's title. Sub-objective ids (1.1.a) are internal to this
 * site (CompTIA does not number its bullets), so students only see the bullet text.
 */
export function displayCode(node) {
  if (!node.code || node.kind === 'subobjective') return '';
  return node.kind === 'unit' ? `Unit ${node.code}` : node.code;
}

/**
 * @param {object} options
 * @param {{roots: object[]}} options.tree   result of buildSelectionTree
 * @param {Set<string>} options.selected     leaf ids (mutated in place)
 * @param {(selected:Set<string>) => void} options.onChange
 * @param {string} [options.itemNoun]        "question" → used in count tooltips
 */
export function createTreePicker({ tree, selected, onChange, itemNoun = 'item' }) {
  const rows = [];

  const selectableLeaves = (node) => leavesUnder(node).filter((leaf) => leaf.total > 0).map((leaf) => leaf.id);

  const refresh = () => {
    for (const { checkbox, leafIds } of rows) {
      const count = leafIds.filter((id) => selected.has(id)).length;
      checkbox.checked = leafIds.length > 0 && count === leafIds.length;
      checkbox.indeterminate = count > 0 && count < leafIds.length;
    }
  };

  const setLeaves = (leafIds, on) => {
    for (const id of leafIds) {
      if (on) selected.add(id);
      else selected.delete(id);
    }
    refresh();
    onChange(selected);
  };

  const setExpanded = (button, list, expanded, label) => {
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} ${label}`);
    list.hidden = !expanded;
  };

  const renderNode = (node, depth) => {
    const leafIds = selectableLeaves(node);
    // Nothing written for this topic yet: one "Coming soon" row, with nothing to open.
    const soon = node.total === 0;
    const hasChildren = node.children.length > 0 && !soon;
    const code = displayCode(node);
    const plainLabel = [code, node.title].filter(Boolean).join(' ');

    const checkbox = h('input', { type: 'checkbox', disabled: leafIds.length === 0 });
    checkbox.addEventListener('change', () => setLeaves(leafIds, checkbox.checked));

    // A "Coming soon" row stays on one line: its number always shows, and its title is cut
    // short on a narrow screen (the full name is in the tooltip). A long run of them then
    // does not push the topics that can be picked off a phone screen.
    const label = h('label', null,
      checkbox,
      h('span', { class: 'tree-label', title: soon ? plainLabel : null },
        code ? [h('span', { class: 'tree-id' }, code), ' '] : null,
        soon ? h('span', { class: 'tree-title' }, node.title) : node.title),
      soon ? h('span', { class: 'chip' }, 'Coming soon') : null,
    );
    const noun = node.total === 1 ? itemNoun : `${itemNoun}s`;
    const count = soon ? null : h('span', { class: 'tree-count', title: `${node.total} ${noun}` }, String(node.total));

    let toggle = h('span', { class: 'tree-spacer', 'aria-hidden': 'true' });
    let childList = null;
    if (hasChildren) {
      const listId = nextId('tree');
      toggle = h('button', { type: 'button', class: 'tree-toggle', 'aria-controls': listId },
        h('span', { class: 'chev', 'aria-hidden': 'true' }));
      childList = h('ul', { id: listId }, node.children.map((child) => renderNode(child, depth + 1)));
      setExpanded(toggle, childList, false, plainLabel);
      toggle.addEventListener('click', () => {
        setExpanded(toggle, childList, toggle.getAttribute('aria-expanded') !== 'true', plainLabel);
      });
    }

    const row = h('div', { class: `tree-row${soon ? ' is-empty' : ''}` }, toggle, label, count);
    rows.push({ checkbox, leafIds, toggle, childList, plainLabel });
    return h('li', { class: `tree-node tree-depth-${depth}` }, row, childList);
  };

  const element = h('ul', { class: 'tree' }, tree.roots.map((root) => renderNode(root, 0)));
  refresh();

  const allLeafIds = tree.roots.flatMap(selectableLeaves);

  return {
    element,
    refresh,
    selectAll() { setLeaves(allLeafIds, true); },
    clear() { setLeaves(allLeafIds, false); },
    expandAll(expanded = true) {
      for (const { toggle, childList, plainLabel } of rows) {
        if (childList) setExpanded(toggle, childList, expanded, plainLabel);
      }
    },
  };
}
