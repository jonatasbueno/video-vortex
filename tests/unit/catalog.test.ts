import { describe, expect, it } from 'vitest';
import {
  OTHERS_ID,
  filterPlatforms,
  getAdultPlatformList,
  getMainPlatformList,
  getOthersSubmenuList,
  sortByLabel,
} from '../../src/platforms/catalog.js';

describe('platform lists', () => {
  it('sorts main list alphabetically and includes Outros in order', () => {
    const labels = getMainPlatformList().map((p) => p.label);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    expect(labels).toEqual(sorted);
    expect(labels).toContain('Outros');
    const othersIndex = labels.indexOf('Outros');
    expect(othersIndex).toBeGreaterThan(-1);
    expect(getMainPlatformList()[othersIndex]?.id).toBe(OTHERS_ID);
  });

  it('sorts adult list alphabetically', () => {
    const labels = getAdultPlatformList().map((p) => p.label);
    expect(labels).toEqual(sortByLabel(getAdultPlatformList()).map((p) => p.label));
  });

  it('filters with autocomplete query', () => {
    const main = getMainPlatformList();
    const filtered = filterPlatforms(main, 'you');
    expect(filtered.every((p) => p.label.toLowerCase().includes('you'))).toBe(true);
    expect(filtered.some((p) => p.id === 'youtube')).toBe(true);
  });

  it('others submenu contains +18 and generic', () => {
    const ids = getOthersSubmenuList().map((p) => p.id);
    expect(ids).toContain('adult-menu');
    expect(ids).toContain('generic');
  });
});
