import { h } from '../lib/dom.js';

/**
 * Segmented control built from native radio buttons (keyboard and screen-reader friendly).
 * options: [{ value, label }]
 */
export function segmented(groupLabel, name, options, value, onChange) {
  const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': groupLabel });
  for (const option of options) {
    const input = h('input', { type: 'radio', name, value: option.value, checked: option.value === value });
    input.addEventListener('change', () => {
      if (input.checked) onChange(option.value);
    });
    group.append(h('label', null, input, h('span', null, option.label)));
  }
  return group;
}
