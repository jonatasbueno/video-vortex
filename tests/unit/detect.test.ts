import { describe, expect, it } from 'vitest';
import { detectPlatform, isAdultPlatform, isValidHttpUrl } from '../../src/platforms/detect.js';

describe('isValidHttpUrl', () => {
  it('accepts http and https', () => {
    expect(isValidHttpUrl('https://youtube.com/watch?v=abc')).toBe(true);
    expect(isValidHttpUrl('http://example.com/v')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isValidHttpUrl('not-a-url')).toBe(false);
    expect(isValidHttpUrl('ftp://x.com')).toBe(false);
  });
});

describe('detectPlatform', () => {
  it('detects youtube', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.id).toBe('youtube');
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')?.id).toBe('youtube');
  });

  it('detects instagram and facebook', () => {
    expect(detectPlatform('https://www.instagram.com/reel/abc/')?.id).toBe('instagram');
    expect(detectPlatform('https://www.facebook.com/watch/?v=1')?.id).toBe('facebook');
  });

  it('detects adult platforms', () => {
    const p = detectPlatform('https://www.xvideos.com/video123/foo');
    expect(p?.id).toBe('xvideos');
    expect(isAdultPlatform(p)).toBe(true);
  });

  it('returns null when unknown', () => {
    expect(detectPlatform('https://example.com/video')).toBeNull();
  });
});
