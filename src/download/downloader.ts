import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import youtubeDl from 'youtube-dl-exec';
import type { DownloadRequest, DownloadResult, VideoProbeResult } from '../types.js';
import { buildFilenameBase } from './filename.js';
import { buildFormatOptions, type RawYtdlpInfo } from './formats.js';
import { isFfmpegAvailable, stripMetadata } from './metadata.js';
import { attachProgressListener } from './progress.js';

export type YtDlpExecResult = Promise<{ stdout?: string; stderr?: string }> & {
  stderr?: NodeJS.ReadableStream;
  stdout?: NodeJS.ReadableStream;
};

export type YtDlpLike = {
  (url: string, flags?: Record<string, unknown>): Promise<unknown>;
  exec: (
    url: string,
    flags?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YtDlpExecResult;
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

export interface DownloadOptions {
  onProgress?: (percent: number) => void;
}

export async function downloadVideo(
  request: DownloadRequest,
  options: DownloadOptions = {},
): Promise<DownloadResult> {
  const outputDir = await ensureDownloadDir(request.outputDir);
  const outputTemplate = path.join(outputDir, `${request.filenameBase}.%(ext)s`);

  const flags = {
    format: request.formatId,
    output: outputTemplate,
    noCheckCertificates: true,
    noWarnings: true,
    mergeOutputFormat: 'mp4',
    restrictFilenames: false,
    newline: true,
    progress: true,
  };

  const subprocess = client.exec(request.url, flags);
  const detach = options.onProgress
    ? attachProgressListener(subprocess.stderr, options.onProgress)
    : () => undefined;

  try {
    await subprocess;
    options.onProgress?.(100);
  } finally {
    detach();
  }

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
