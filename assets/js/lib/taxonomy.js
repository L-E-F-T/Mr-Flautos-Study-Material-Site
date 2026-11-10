/**
 * Taxonomies: the two ways students slice content.
 *   Objectives: domain (1.0) → objective (1.1) → sub-objective (1.1.a)
 *   Units:      unit (3.0)   → lesson (3.2)    → section (3.2.4)
 *
 * Content items carry tags that may point at ANY level:
 *   "objectives": ["3.4"] or ["3.4.c"]      "units": ["3.2"] or ["3.2.4"]
 * When building a selection tree we cut it at a chosen depth. A tag deeper than
 * the cut is lifted to its ancestor; a tag on a node that still has children is
 * placed in a synthetic "General" leaf under that node, so every item lives in
 * exactly the leaves it was tagged with.
 */

export function objectiveTaxonomy(doc) {
  return (doc.domains || []).map((domain) => ({
    id: domain.id,
    code: domain.id,
    title: domain.title,
    kind: 'domain',
    weight: domain.weight,
    children: (domain.objectives || []).map((objective) => ({
      id: objective.id,
      code: objective.id,
      title: objective.title,
      kind: 'objective',
      children: (objective.subobjectives || []).map((sub) => ({
        id: sub.id,
        code: sub.id,
        title: sub.title,
        kind: 'subobjective',
        details: sub.details || [],
        children: [],
      })),
    })),
  }));
}

export function unitTaxonomy(doc) {
  return (doc.units || []).map((unit) => ({
    id: unit.id,
    code: unit.id,
    title: unit.title,
    kind: 'unit',
    children: (unit.subunits || []).map((lesson) => ({
      id: lesson.id,
      code: lesson.id,
      title: lesson.title,
      kind: 'lesson',
      objectives: lesson.objectives || [],
      children: (lesson.sections || []).map((section) => ({
        id: section.id,
        code: section.id,
        title: section.title,
        kind: 'section',
        children: [],
      })),
    })),
  }));
}

/** Map id → { node, parentId, depth } for a taxonomy (roots have depth 1). */
export function indexTaxonomy(roots) {
  const index = new Map();
  const walk = (nodes, parentId, depth) => {
    for (const node of nodes) {
      index.set(node.id, { node, parentId, depth });
      walk(node.children || [], node.id, depth + 1);
    }
  };
  walk(roots, null, 1);
  return index;
}

/** Nodes from the root down to `id` (empty when unknown). */
export function ancestry(index, id) {
  const chain = [];
  let entry = index.get(id);
  while (entry) {
    chain.unshift(entry.node);
    entry = entry.parentId ? index.get(entry.parentId) : null;
  }
  return chain;
}

/**
 * Keep only the most specific known tags: ["2.0", "2.1", "2.1.a"] → ["2.1.a"].
 * Unknown tags are dropped. Same rule the selection trees use.
 */
export function mostSpecificTags(index, tags) {
  const known = [...new Set((tags || []).filter((tag) => index.has(tag)))];
  return known.filter((id) => !known.some(
    (other) => other !== id && ancestry(index, other).some((node) => node.id === id),
  ));
}

/** Node at a given depth on the path to `id`, or the node itself if it is shallower. */
export function ancestorAtDepth(index, id, depth) {
  const chain = ancestry(index, id);
  if (!chain.length) return null;
  return chain[Math.min(chain.length, depth) - 1];
}

const GENERAL_TITLES = {
  domain: 'General: whole domain',
  objective: 'General: not tied to one sub-objective',
  unit: 'General: whole unit',
  lesson: 'General: whole lesson',
};

/**
 * Build a selection tree with items attached to leaves.
 * Returns { roots, nodes: Map(id → node), leaves: Map(id → leaf), unknown: [{ item, tag }] }.
 * Every node gets `total` (unique items in its subtree); leaves get `itemIds` (Set).
 */
export function buildSelectionTree(taxonomyRoots, items, getTags, { maxDepth = Infinity } = {}) {
  const index = indexTaxonomy(taxonomyRoots);
  const nodes = new Map();

  const clone = (node, depth) => {
    const copy = {
      id: node.id,
      code: node.code,
      title: node.title,
      kind: node.kind,
      depth,
      general: false,
      children: [],
      itemIds: new Set(),
      total: 0,
    };
    nodes.set(copy.id, copy);
    if (depth < maxDepth) copy.children = (node.children || []).map((child) => clone(child, depth + 1));
    return copy;
  };
  const roots = taxonomyRoots.map((root) => clone(root, 1));

  const unknown = [];
  for (const item of items) {
    const tags = getTags(item) || [];
    // Resolve every tag to a visible node, then keep only the most specific ones:
    // ["2.1", "2.1.a"] means "sub-objective 2.1.a", not "2.1.a AND general 2.1".
    const targets = new Map();
    for (const tag of tags) {
      if (!index.has(tag)) {
        unknown.push({ item, tag });
        continue;
      }
      const target = ancestorAtDepth(index, tag, maxDepth);
      targets.set(target.id, target);
    }
    const targetIds = [...targets.keys()];
    const mostSpecific = targetIds.filter((id) => !targetIds.some(
      (other) => other !== id && ancestry(index, other).some((node) => node.id === id),
    ));
    for (const targetId of mostSpecific) {
      const visible = nodes.get(targetId);
      let leaf = visible;
      if (visible.children.length > 0) {
        leaf = visible.children.find((child) => child.general);
        if (!leaf) {
          leaf = {
            id: `${visible.id}#general`,
            code: '',
            title: GENERAL_TITLES[visible.kind] || 'General',
            kind: 'general',
            depth: visible.depth + 1,
            general: true,
            children: [],
            itemIds: new Set(),
            total: 0,
          };
          visible.children.push(leaf);
          nodes.set(leaf.id, leaf);
        }
      }
      leaf.itemIds.add(item.id);
    }
  }

  const leaves = new Map();
  const collect = (node) => {
    if (node.children.length === 0) {
      node.total = node.itemIds.size;
      leaves.set(node.id, node);
      return node.itemIds;
    }
    const all = new Set();
    for (const child of node.children) for (const id of collect(child)) all.add(id);
    node.total = all.size;
    return all;
  };
  roots.forEach(collect);

  return { roots, nodes, leaves, unknown };
}

/** All leaves under a node (the node itself if it is a leaf). */
export function leavesUnder(node) {
  if (node.children.length === 0) return [node];
  return node.children.flatMap(leavesUnder);
}

/** Union of item ids for a set of selected leaf ids. */
export function itemIdsForLeaves(tree, leafIds) {
  const ids = new Set();
  for (const leafId of leafIds) {
    const leaf = tree.leaves.get(leafId);
    if (leaf) for (const id of leaf.itemIds) ids.add(id);
  }
  return ids;
}

/** Short label for chips: "Obj 3.4", "Lesson 3.2". Sub-objective and section tags collapse to their parent. */
export function tagChips(item, objectiveIndex, unitIndex) {
  const chips = [];
  const seen = new Set();
  for (const tag of mostSpecificTags(objectiveIndex, item.objectives)) {
    const node = ancestorAtDepth(objectiveIndex, tag, 2);
    if (!node) continue;
    const label = node.kind === 'domain' ? `Domain ${node.code}` : `Obj ${node.code}`;
    if (!seen.has(label)) { seen.add(label); chips.push({ kind: 'objective', label, title: node.title }); }
  }
  for (const tag of mostSpecificTags(unitIndex, item.units)) {
    const node = ancestorAtDepth(unitIndex, tag, 2);
    if (!node) continue;
    const label = node.kind === 'unit' ? `Unit ${node.code}` : `Lesson ${node.code}`;
    if (!seen.has(label)) { seen.add(label); chips.push({ kind: 'unit', label, title: node.title }); }
  }
  return chips;
}

/** Natural sort for ids like 1.2, 1.10, 10.1 and for terms. */
export function naturalCompare(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
