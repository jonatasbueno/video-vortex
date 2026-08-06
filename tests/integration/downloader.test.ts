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

describe('downloader integration (mocked yt-dlp)', () => {
  afterEach(() => {
    resetYtDlpClient();
    vi.clearAllMocks();
  });

  it('probes formats from dump json', async () => {
    const mock: YtDlpLike = Object.assign(
      async () => ({
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
      { exec: async () => ({ stdout: '' }) },
    );
    setYtDlpClient(mock);

    const probe = await probeVideo('https://youtube.com/watch?v=1', 'n/a');
    expect(probe.title).toBe('Demo Clip');
    expect(probe.formats[0]?.resolutionLabel).toBe('720p');
    expect(probe.formats[0]?.label).toContain('mp4');
  });

  it('downloads into ensured directory with expected filename prefix', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'vv-'));
    const mock: YtDlpLike = Object.assign(
      async (_url: string, flags?: Record<string, unknown>) => {
        const output = String(flags?.output ?? '');
        const file = output.replace('%(ext)s', 'mp4');
        await writeFile(file, 'fake-video');
        return {};
      },
      { exec: async () => ({ stdout: '' }) },
    );
    setYtDlpClient(mock);

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

  it('creates missing download directories', async () => {
    const base = await mkdtemp(path.join(tmpdir(), 'vv-root-'));
    const nested = path.join(base, 'a', 'b', 'VideoVortex');
    const created = await ensureDownloadDir(nested);
    expect(created).toBe(path.resolve(nested));
  });
});
