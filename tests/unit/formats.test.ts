import { describe, expect, it } from 'vitest';
import { buildFormatOptions, bytesToMbLabel, resolutionLabel } from '../../src/download/formats.js';

describe('resolutionLabel', () => {
  it('maps heights without inventing higher tiers', () => {
    expect(resolutionLabel(720)).toBe('720p');
    expect(resolutionLabel(1080)).toBe('1080p');
    expect(resolutionLabel(2160)).toBe('4K');
    expect(resolutionLabel(null)).toBe('audio');
  });
});

describe('bytesToMbLabel', () => {
  it('formats MB and unavailable', () => {
    expect(bytesToMbLabel(10 * 1024 * 1024, false)).toBe('10.0 MB');
    expect(bytesToMbLabel(null, false, 'n/a')).toBe('n/a');
    expect(bytesToMbLabel(5 * 1024 * 1024, true)).toBe('~5.0 MB');
  });
});

describe('buildFormatOptions', () => {
  it('only offers heights that exist and includes format + size', () => {
    const options = buildFormatOptions(
      [
        {
          format_id: '18',
          ext: 'mp4',
          height: 360,
          vcodec: 'avc1',
          acodec: 'mp4a',
          filesize: 5 * 1024 * 1024,
        },
        {
          format_id: '22',
          ext: 'mp4',
          height: 720,
          vcodec: 'avc1',
          acodec: 'mp4a',
          filesize: 20 * 1024 * 1024,
        },
        {
          format_id: '137',
          ext: 'mp4',
          height: 1080,
          vcodec: 'avc1',
          acodec: 'none',
          filesize: 40 * 1024 * 1024,
        },
        {
          format_id: '140',
          ext: 'm4a',
          height: null,
          vcodec: 'none',
          acodec: 'mp4a',
          filesize: 3 * 1024 * 1024,
        },
      ],
      'tamanho indisponível',
    );

    const heights = options.map((o) => o.resolutionLabel);
    expect(heights).toContain('360p');
    expect(heights).toContain('720p');
    expect(heights).toContain('1080p');
    expect(heights).not.toContain('4K');

    const progressive720 = options.find((o) => o.resolutionLabel === '720p' && o.ext === 'mp4');
    expect(progressive720?.label).toContain('720p');
    expect(progressive720?.label).toContain('mp4');
    expect(progressive720?.label).toMatch(/MB/);

    const merge1080 = options.find((o) => o.resolutionLabel === '1080p');
    expect(merge1080?.formatId).toContain('+bestaudio');
  });

  it('does not invent 4k when missing', () => {
    const options = buildFormatOptions([
      {
        format_id: '22',
        ext: 'mp4',
        height: 720,
        vcodec: 'avc1',
        acodec: 'mp4a',
        filesize: 10,
      },
    ]);
    expect(options.every((o) => o.resolutionLabel !== '4K')).toBe(true);
  });
});
