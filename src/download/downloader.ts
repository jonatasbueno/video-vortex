import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { DownloadRequest, DownloadResult, VideoProbeResult } from '../types.js';
import { buildFilenameBase } from './filename.js';
import { buildFormatOptions, type RawYtdlpInfo } from './formats.js';
import { isFfmpegAvailable, stripMetadata } from './metadata.js';
import { attachProgressListener } from './progress.js';
import { YtDlpError, parseJsonStdout, runYtDlp, summarizeStderr } from './runYtdlp.js';
import { spawnYtDlp, waitForProcess } from './spawnYtdlp.js';

/** Default probe timeout (90s). */
export const DEFAULT_PROBE_TIMEOUT_MS = 90_000;

export interface ProbeOptions {
  sizeUnavailableLabel?: string;
  timeoutMs?: number;
  timeoutMessage?: string;
  noFormatsMessage?: string;
}

export async function probeVideo(
  url: string,
  sizeUnavailableLabelOrOptions?: string | ProbeOptions,
): Promise<VideoProbeResult> {
  const options: ProbeOptions =
    typeof sizeUnavailableLabelOrOptions === 'string' || sizeUnavailableLabelOrOptions == null
      ? { sizeUnavailableLabel: sizeUnavailableLabelOrOptions }
      : sizeUnavailableLabelOrOptions;

  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;

  let stdout = '';
  let stderr = '';
  try {
    const result = await runYtDlp({
      url,
      flags: {
        dumpSingleJson: true,
        noCheckCertificates: true,
        // Do not pass noWarnings: false — dargs turns it into --no-no-warnings
        preferFreeFormats: false,
        skipDownload: true,
      },
      timeoutMs,
      timeoutMessage: options.timeoutMessage,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    if (error instanceof YtDlpError) throw error;
    throw error;
  }

  const raw = parseJsonStdout<RawYtdlpInfo>(stdout, stderr);
  const formats = buildFormatOptions(raw.formats ?? [], options.sizeUnavailableLabel);
  if (formats.length === 0) {
    const detail = summarizeStderr(stderr);
    throw new YtDlpError(
      detail
        ? `${options.noFormatsMessage ?? 'No downloadable formats found for this URL.'}\n${detail}`
        : (options.noFormatsMessage ?? 'No downloadable formats found for this URL.'),
      { stderr },
    );
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
    // Omit boolean false flags — dargs emits --no-* and some are invalid (e.g. --no-console-title)
    newline: true,
    progress: true,
  };

  const child = spawnYtDlp(request.url, flags);
  const progress = options.onProgress
    ? attachProgressListener(child.stderr, options.onProgress)
    : null;

  try {
    await waitForProcess(child);
    await progress?.flush();
    options.onProgress?.(100);
  } finally {
    progress?.detach();
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
  const probe = await probeVideo(url, { sizeUnavailableLabel });
  return {
    probe,
    filenameBase: buildFilenameBase(probe.title, now),
  };
}

export { YtDlpError, summarizeStderr };
