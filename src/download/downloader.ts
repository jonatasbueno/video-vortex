import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import youtubeDl from 'youtube-dl-exec';
import type { DownloadRequest, DownloadResult, VideoProbeResult } from '../types.js';
import { buildFilenameBase } from './filename.js';
import { buildFormatOptions, type RawYtdlpInfo } from './formats.js';
import { isFfmpegAvailable, stripMetadata } from './metadata.js';

export type YtDlpLike = {
  (url: string, flags?: Record<string, unknown>): Promise<unknown>;
  exec: (
    url: string,
    flags?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => Promise<{ stdout: string }>;
};

let client: YtDlpLike = youtubeDl as unknown as YtDlpLike;

/** Allow tests to inject a mock client. */
export function setYtDlpClient(next: YtDlpLike): void {
  client = next;
}

export function resetYtDlpClient(): void {
  client = youtubeDl as unknown as YtDlpLike;
}

export async function probeVideo(url: string, sizeUnavailableLabel?: string): Promise<VideoProbeResult> {
  const raw = (await client(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: false,
    skipDownload: true,
  })) as RawYtdlpInfo;

  const formats = buildFormatOptions(raw.formats ?? [], sizeUnavailableLabel);
  if (formats.length === 0) {
    throw new Error('No downloadable formats found for this URL.');
  }

  return {
    title: raw.title?.trim() || 'video',
    webpageUrl: raw.webpage_url || url,
    formats,
  };
}

export async function ensureDownloadDir(dir: string): Promise<string> {
  const resolved = path.resolve(dir);
  await mkdir(resolved, { recursive: true });
  return resolved;
}

export async function downloadVideo(request: DownloadRequest): Promise<DownloadResult> {
  const outputDir = await ensureDownloadDir(request.outputDir);
  const outputTemplate = path.join(outputDir, `${request.filenameBase}.%(ext)s`);

  await client(request.url, {
    format: request.formatId,
    output: outputTemplate,
    noCheckCertificates: true,
    noWarnings: true,
    mergeOutputFormat: 'mp4',
    restrictFilenames: false,
  });

  // Resolve actual file: yt-dlp replaces %(ext)s
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(outputDir);
  const match = files
    .filter((f) => f.startsWith(request.filenameBase))
    .sort((a, b) => b.length - a.length)[0];

  if (!match) {
    throw new Error(`Downloaded file not found in ${outputDir}`);
  }

  let filePath = path.join(outputDir, match);

  if (await isFfmpegAvailable()) {
    filePath = await stripMetadata(filePath);
  }

  return {
    filePath,
    title: request.filenameBase,
  };
}

export async function probeAndPrepareFilename(
  url: string,
  sizeUnavailableLabel?: string,
  now: Date = new Date(),
): Promise<{ probe: VideoProbeResult; filenameBase: string }> {
  const probe = await probeVideo(url, sizeUnavailableLabel);
  return {
    probe,
    filenameBase: buildFilenameBase(probe.title, now),
  };
}
