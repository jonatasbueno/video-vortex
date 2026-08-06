import { describe, expect, it } from 'vitest';
import { filterItems } from '../../src/ui/filterItems.js';

describe('filterItems', () => {
  const items = [
    { value: 'a', label: 'Facebook' },
    { value: 'b', label: 'Outros' },
    { value: 'c', label: 'YouTube' },
  ];

  it('returns all when filter empty', () => {
    expect(filterItems(items, '')).toHaveLength(3);
  });

  it('filters case-insensitively', () => {
    expect(filterItems(items, 'you').map((i) => i.value)).toEqual(['c']);
    expect(filterItems(items, 'outros').map((i) => i.label)).toEqual(['Outros']);
    expect(filterItems(items, 'FACE').map((i) => i.label)).toEqual(['Facebook']);
  });
});
