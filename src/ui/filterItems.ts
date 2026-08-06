import type { SelectItem } from '../types.js';

export function filterItems(items: SelectItem[], query: string): SelectItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.label.toLowerCase().includes(q));
}
