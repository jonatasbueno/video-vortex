import { describe, expect, it } from 'vitest';
import { parseDownloadPercent } from '../../src/download/progress.js';

describe('parseDownloadPercent', () => {
  it('parses yt-dlp download lines', () => {
    expect(parseDownloadPercent('[download]  12.3% of 10.00MiB at 1.00MiB/s ETA 00:08')).toBe(12.3);
    expect(parseDownloadPercent('[download] 100% of 10.00MiB')).toBe(100);
  });

  it('returns the latest percent in a chunk', () => {
    const chunk = '[download]  10.0%\n[download]  25.5%\n';
    expect(parseDownloadPercent(chunk)).toBe(25.5);
  });

  it('returns null when absent', () => {
    expect(parseDownloadPercent('Deleting original file')).toBeNull();
  });
});
