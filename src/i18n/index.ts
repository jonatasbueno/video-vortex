import type { Locale } from '../types.js';
import { en } from './locales/en.js';
import { pt, type MessageKey } from './locales/pt.js';

const catalogs = { pt, en } as const;

let currentLocale: Locale = 'pt';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function normalizeLocale(value: string | undefined): Locale {
  if (!value) return 'pt';
  const v = value.toLowerCase();
  if (v === 'en' || v === 'en-us' || v === 'english') return 'en';
  return 'pt';
}

export function t(key: MessageKey, vars?: Record<string, string>): string {
  const catalog = catalogs[currentLocale] ?? catalogs.pt;
  let text: string = catalog[key] ?? catalogs.pt[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v);
    }
  }
  return text;
}

export type { MessageKey };
