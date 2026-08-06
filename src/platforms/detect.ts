import type { Platform } from '../types.js';
import { getAllDetectablePlatforms } from './catalog.js';

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function detectPlatform(url: string, platforms = getAllDetectablePlatforms()): Platform | null {
  const trimmed = url.trim();
  for (const platform of platforms) {
    if (platform.match.some((re) => re.test(trimmed))) {
      return platform;
    }
  }
  return null;
}

export function isAdultPlatform(platform: Platform | null | undefined): boolean {
  return platform?.category === 'adult';
}
