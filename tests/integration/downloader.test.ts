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

import { downloadVideo, ensureDownloadDir, probeVideo, YtDlpError } from '../../src/download/downloader.js';
import { resetYtDlpSpawner, setYtDlpSpawner } from '../../src/download/spawnYtdlp.js';

function mockProcess(options: {
  stdout?: string;
  stderr?: string;
  progressChunks?: string[];
  exitCode?: number;
  hangMs?: number;
  writeFileFromArgs?: (args: string[]) => Promise<void>;
}): Parameters<typeof setYtDlpSpawner>[0] {
  return (_cmd, args) => {
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    const child = Object.assign(new EventEmitter(), {
      stdout,
      stderr,
      stdin: new EventEmitter(),
      kill: vi.fn(() => {
        queueMicrotask(() => child.emit('close', 1, 'SIGTERM'));
        return true;
      }),
    });

    queueMicrotask(async () => {
      if (options.hangMs) {
        await new Promise((r) => setTimeout(r, options.hangMs));
        return; // wait for kill from timeout
      }
      await options.writeFileFromArgs?.(args);
      if (options.stdout) stdout.emit('data', Buffer.from(options.stdout));
      if (options.stderr) stderr.emit('data', Buffer.from(options.stderr));
      for (const chunk of options.progressChunks ?? []) {
        stderr.emit('data', Buffer.from(chunk));
        await new Promise<void>((r) => setImmediate(r));
      }
      stdout.emit('end');
      stderr.emit('end');
      child.emit('close', options.exitCode ?? 0, null);
    });

    return child as ReturnType<Parameters<typeof setYtDlpSpawner>[0]>;
  };
}

describe('downloader integration (mocked yt-dlp)', () => {
  afterEach(() => {
    resetYtDlpSpawner();
    vi.clearAllMocks();
  });

  it('probes formats from dump json', async () => {
    setYtDlpSpawner(
      mockProcess({
        stdout: JSON.stringify({
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

  it('surfaces yt-dlp stderr on probe failure', async () => {
    setYtDlpSpawner(
      mockProcess({
        exitCode: 1,
        stderr: 'ERROR: Sign in to confirm you’re not a bot',
      }),
    );

    await expect(probeVideo('https://youtube.com/watch?v=1', { timeoutMs: 5_000 })).rejects.toThrow(
      /bot|ERROR/i,
    );
  });

  it('times out hanging probes and reports failure', async () => {
    setYtDlpSpawner(
      mockProcess({
        // Never closes unless kill() is called by the timeout path
        hangMs: 60_000,
      }),
    );

    await expect(
      probeVideo('https://youtube.com/watch?v=1', {
        timeoutMs: 100,
        timeoutMessage: 'Tempo esgotado ao consultar formatos (0s).',
      }),
    ).rejects.toThrow(/Tempo esgotado/);
  }, 3_000);

  it('downloads into ensured directory with expected filename prefix', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'vv-'));
    setYtDlpSpawner(
      mockProcess({
        writeFileFromArgs: async (args) => {
          const outputIdx = args.indexOf('--output');
          const output = outputIdx >= 0 ? args[outputIdx + 1]! : '';
          await writeFile(output.replace('%(ext)s', 'mp4'), 'fake-video');
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

  it('reports progress callbacks incrementally from yt-dlp stderr', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'vv-'));
    const percents: number[] = [];

    setYtDlpSpawner(
      mockProcess({
        writeFileFromArgs: async (args) => {
          const outputIdx = args.indexOf('--output');
          const output = outputIdx >= 0 ? args[outputIdx + 1]! : '';
          await writeFile(output.replace('%(ext)s', 'mp4'), 'x');
        },
        progressChunks: [
          '[download]  10.0% of 1MiB\n',
          '[download]  40.0% of 1MiB\n',
          '[download]  80.0% of 1MiB\n',
        ],
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

    expect(percents.filter((p) => p < 100)).toEqual([10, 40, 80]);
    expect(percents.at(-1)).toBe(100);
  });

  it('creates missing download directories', async () => {
    const base = await mkdtemp(path.join(tmpdir(), 'vv-root-'));
    const nested = path.join(base, 'a', 'b', 'VideoVortex');
    const created = await ensureDownloadDir(nested);
    expect(created).toBe(path.resolve(nested));
  });
});
