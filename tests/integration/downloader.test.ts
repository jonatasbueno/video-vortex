import { EventEmitter } from 'node:events';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/download/metadata.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/download/metadata.js')>(
    '../../src/download/metadata.js',
  );
  return {
    ...actual,
    isFfmpegAvailable: vi.fn(async () => false),
    stripMetadata: vi.fn(async (p: string) => p),
  };
});

import {
  downloadVideo,
  ensureDownloadDir,
  probeVideo,
  resetYtDlpClient,
  setYtDlpClient,
  type YtDlpLike,
} from '../../src/download/downloader.js';

function mockClient(handlers: {
  probe?: () => Promise<unknown>;
  download?: (url: string, flags?: Record<string, unknown>) => Promise<void>;
  progressChunks?: string[];
}): YtDlpLike {
  return Object.assign(
    async (url: string, flags?: Record<string, unknown>) => {
      if (flags?.dumpSingleJson) {
        return handlers.probe?.() ?? {};
      }
      await handlers.download?.(url, flags);
      return {};
    },
    {
      exec: (url: string, flags?: Record<string, unknown>) => {
        const stderr = new EventEmitter() as EventEmitter & NodeJS.ReadableStream;
        const promise = (async () => {
          await handlers.download?.(url, flags);
          // Let downloadVideo attach the stderr listener before emitting progress
          await new Promise<void>((resolve) => setImmediate(resolve));
          for (const chunk of handlers.progressChunks ?? []) {
            stderr.emit('data', Buffer.from(chunk));
          }
          return { stdout: '', stderr: '' };
        })();
        return Object.assign(promise, { stderr }) as ReturnType<YtDlpLike['exec']>;
      },
    },
  );
}

describe('downloader integration (mocked yt-dlp)', () => {
  afterEach(() => {
    resetYtDlpClient();
    vi.clearAllMocks();
  });

  it('probes formats from dump json', async () => {
    setYtDlpClient(
      mockClient({
        probe: async () => ({
          title: 'Demo Clip',
          webpage_url: 'https://youtube.com/watch?v=1',
          formats: [
            {
              format_id: '22',
              ext: 'mp4',
              height: 720,
              vcodec: 'avc1',
              acodec: 'mp4a',
              filesize: 12 * 1024 * 1024,
            },
          ],
        }),
      }),
    );

    const probe = await probeVideo('https://youtube.com/watch?v=1', 'n/a');
    expect(probe.title).toBe('Demo Clip');
    expect(probe.formats[0]?.resolutionLabel).toBe('720p');
    expect(probe.formats[0]?.label).toContain('mp4');
  });

  it('downloads into ensured directory with expected filename prefix', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'vv-'));
    setYtDlpClient(
      mockClient({
        download: async (_url, flags) => {
          const output = String(flags?.output ?? '');
          const file = output.replace('%(ext)s', 'mp4');
          await writeFile(file, 'fake-video');
        },
      }),
    );

    const result = await downloadVideo({
      url: 'https://youtube.com/watch?v=1',
      formatId: '22',
      outputDir: dir,
      filenameBase: '20260806120000_demo_clip',
    });

    expect(result.filePath).toContain('20260806120000_demo_clip');
    const content = await readFile(result.filePath, 'utf8');
    expect(content).toBe('fake-video');
  });

  it('reports progress callbacks from yt-dlp stderr', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'vv-'));
    const percents: number[] = [];
    setYtDlpClient(
      mockClient({
        download: async (_url, flags) => {
          const output = String(flags?.output ?? '');
          await writeFile(output.replace('%(ext)s', 'mp4'), 'x');
        },
        progressChunks: ['[download]  33.0% of 1MiB\n', '[download]  77.0% of 1MiB\n'],
      }),
    );

    await downloadVideo(
      {
        url: 'https://youtube.com/watch?v=1',
        formatId: '22',
        outputDir: dir,
        filenameBase: '20260806120000_progress',
      },
      { onProgress: (p) => percents.push(p) },
    );

    expect(percents).toContain(33);
    expect(percents).toContain(77);
    expect(percents.at(-1)).toBe(100);
  });

  it('creates missing download directories', async () => {
    const base = await mkdtemp(path.join(tmpdir(), 'vv-root-'));
    const nested = path.join(base, 'a', 'b', 'VideoVortex');
    const created = await ensureDownloadDir(nested);
    expect(created).toBe(path.resolve(nested));
  });
});
