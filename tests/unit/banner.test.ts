import { describe, expect, it } from 'vitest';
import { getAsciiArt, renderBanner } from '../../src/ui/banner.js';

describe('banner', () => {
  it('contains Video Vortex ASCII identity', () => {
    const art = getAsciiArt();
    expect(art).toContain('██');
    expect(renderBanner('sub')).toContain('Video Vortex');
  });
});
