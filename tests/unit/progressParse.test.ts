import { describe, expect, it, vi } from 'vitest';
import {
  attachProgressListener,
  parseAllDownloadPercents,
  parseDownloadPercent,
} from '../../src/download/progress.js';
import { EventEmitter } from 'node:events';

describe('parseDownloadPercent', () => {
  it('parses yt-dlp download lines', () => {
    expect(parseDownloadPercent('[download]  12.3% of 10.00MiB at 1.00MiB/s ETA 00:08')).toBe(12.3);
    expect(parseDownloadPercent('[download] 100% of 10.00MiB')).toBe(100);
  });

  it('returns the latest percent in a chunk', () => {
    const chunk = '[download]  10.0%\n[download]  25.5%\n';
    expect(parseDownloadPercent(chunk)).toBe(25.5);
    expect(parseAllDownloadPercents(chunk)).toEqual([10, 25.5]);
  });

  it('returns null when absent', () => {
    expect(parseDownloadPercent('Deleting original file')).toBeNull();
  });
});

describe('attachProgressListener', () => {
  it('emits each percent on separate turns (not one batched dump)', async () => {
    const stderr = new EventEmitter();
    const seen: number[] = [];
    const sub = attachProgressListener(stderr as NodeJS.ReadableStream, (p) => seen.push(p));

    stderr.emit('data', Buffer.from('[download]  10.0%\n[download]  20.0%\n[download]  30.0%\n'));

    // Immediately after emit, chain has not finished — progressive, not instant final
    expect(seen.length).toBeLessThan(3);

    await sub.flush();
    expect(seen).toEqual([10, 20, 30]);

    sub.detach();
  });
});
