import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, normalizeLocale, setLocale, t } from '../../src/i18n/index.js';

describe('i18n', () => {
  afterEach(() => {
    setLocale('pt');
  });

  it('defaults to pt and translates', () => {
    setLocale('pt');
    expect(t('promptUrl')).toMatch(/URL/);
    expect(getLocale()).toBe('pt');
  });

  it('switches to en', () => {
    setLocale('en');
    expect(t('promptUrl')).toMatch(/Paste/);
  });

  it('normalizes locale flags', () => {
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale('pt-BR')).toBe('pt');
    expect(normalizeLocale(undefined)).toBe('pt');
  });

  it('interpolates variables', () => {
    setLocale('en');
    expect(t('filterHint', { filter: 'you' })).toContain('you');
  });
});
