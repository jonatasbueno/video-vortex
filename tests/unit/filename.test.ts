import { describe, expect, it } from 'vitest';
import { buildFilenameBase, formatTimestamp, toSnakeCase } from '../../src/download/filename.js';

describe('toSnakeCase', () => {
  it('normalizes accents and punctuation', () => {
    expect(toSnakeCase('Olá Mundo! Vídeo 4K')).toBe('ola_mundo_video_4k');
  });

  it('falls back to video for empty', () => {
    expect(toSnakeCase('!!!')).toBe('video');
  });

  it('truncates long titles', () => {
    expect(toSnakeCase('a'.repeat(200), 20).length).toBeLessThanOrEqual(20);
  });
});

describe('formatTimestamp', () => {
  it('uses YYYYMMDDHHmmss', () => {
    const d = new Date(2026, 7, 6, 13, 5, 9); // month is 0-based → August
    expect(formatTimestamp(d)).toBe('20260806130509');
  });
});

describe('buildFilenameBase', () => {
  it('prefixes timestamp', () => {
    const d = new Date(2026, 0, 2, 3, 4, 5);
    expect(buildFilenameBase('My Video', d)).toBe('20260102030405_my_video');
  });
});
