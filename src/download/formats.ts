import type { FormatOption } from '../types.js';
import { t } from '../i18n/index.js';

export interface RawYtdlpFormat {
  format_id?: string;
  format_note?: string;
  ext?: string;
  height?: number | null;
  width?: number | null;
  vcodec?: string | null;
  acodec?: string | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  protocol?: string;
  resolution?: string;
}

export interface RawYtdlpInfo {
  title?: string;
  webpage_url?: string;
  formats?: RawYtdlpFormat[];
  requested_formats?: RawYtdlpFormat[];
}

function hasVideo(f: RawYtdlpFormat): boolean {
  return Boolean(f.vcodec && f.vcodec !== 'none');
}

function hasAudio(f: RawYtdlpFormat): boolean {
  return Boolean(f.acodec && f.acodec !== 'none');
}

export function bytesToMbLabel(bytes: number | null, approx: boolean, unavailableLabel?: string): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) {
    return unavailableLabel ?? t('sizeUnavailable');
  }
  const mb = bytes / (1024 * 1024);
  const value = mb >= 100 ? mb.toFixed(0) : mb.toFixed(1);
  return approx ? `~${value} MB` : `${value} MB`;
}

export function resolutionLabel(height: number | null): string {
  if (height == null || height <= 0) return 'audio';
  if (height >= 2160) return '4K';
  if (height >= 1440) return '1440p';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  if (height >= 360) return '360p';
  if (height >= 240) return '240p';
  return `${height}p`;
}

function pickSize(f: RawYtdlpFormat): { bytes: number | null; approx: boolean } {
  if (f.filesize != null && f.filesize > 0) return { bytes: f.filesize, approx: false };
  if (f.filesize_approx != null && f.filesize_approx > 0) {
    return { bytes: f.filesize_approx, approx: true };
  }
  return { bytes: null, approx: false };
}

/**
 * Build selectable download options from yt-dlp formats.
 * Only heights that actually exist are offered. Prefers progressive (video+audio)
 * when present; otherwise offers mergeable video-only heights with +bestaudio.
 */
export function buildFormatOptions(
  formats: RawYtdlpFormat[],
  sizeUnavailableLabel?: string,
): FormatOption[] {
  const usable = formats.filter((f) => f.format_id && (hasVideo(f) || hasAudio(f)));

  const progressive = usable.filter((f) => hasVideo(f) && hasAudio(f) && f.height);
  const videoOnly = usable.filter((f) => hasVideo(f) && !hasAudio(f) && f.height);
  const audioOnly = usable.filter((f) => hasAudio(f) && !hasVideo(f));

  const byKey = new Map<string, FormatOption>();

  const consider = (
    f: RawYtdlpFormat,
    formatId: string,
    height: number | null,
    ext: string,
    hasV: boolean,
    hasA: boolean,
    extraBytes: number | null = null,
  ) => {
    const { bytes: ownBytes, approx } = pickSize(f);
    const bytes =
      ownBytes != null && extraBytes != null
        ? ownBytes + extraBytes
        : ownBytes ?? extraBytes;
    const res = resolutionLabel(height);
    const key = `${res}|${ext}|${hasV ? 'v' : ''}${hasA ? 'a' : ''}`;
    const existing = byKey.get(key);
    const labelParts = [res, ext, bytesToMbLabel(bytes, approx || Boolean(extraBytes && !ownBytes), sizeUnavailableLabel)];
    const option: FormatOption = {
      id: key,
      formatId,
      height,
      resolutionLabel: res,
      ext,
      filesizeBytes: bytes,
      filesizeApprox: approx || Boolean(extraBytes && ownBytes == null),
      hasVideo: hasV,
      hasAudio: hasA,
      label: labelParts.join(' · '),
    };

    if (!existing) {
      byKey.set(key, option);
      return;
    }
    // Prefer larger / more accurate size or higher format specificity
    const existingScore = (existing.filesizeBytes ?? 0) + (existing.hasAudio && existing.hasVideo ? 1e12 : 0);
    const newScore = (option.filesizeBytes ?? 0) + (option.hasAudio && option.hasVideo ? 1e12 : 0);
    if (newScore > existingScore) byKey.set(key, option);
  };

  for (const f of progressive) {
    consider(f, f.format_id!, f.height ?? null, (f.ext || 'mp4').toLowerCase(), true, true);
  }

  const bestAudio = audioOnly
    .slice()
    .sort((a, b) => (b.filesize ?? b.filesize_approx ?? 0) - (a.filesize ?? a.filesize_approx ?? 0))[0];
  const audioExtra = bestAudio ? pickSize(bestAudio).bytes : null;

  const heightsSeen = new Set(progressive.map((f) => f.height).filter(Boolean));

  for (const f of videoOnly) {
    if (heightsSeen.has(f.height)) {
      // Still allow alternate containers for same height when progressive exists
    }
    const ext = (f.ext || 'mp4').toLowerCase();
    const formatId = bestAudio ? `${f.format_id}+bestaudio` : f.format_id!;
    consider(f, formatId, f.height ?? null, ext, true, Boolean(bestAudio), audioExtra);
  }

  // Audio-only option if no video formats
  if (byKey.size === 0 && bestAudio) {
    const { bytes, approx } = pickSize(bestAudio);
    consider(
      bestAudio,
      bestAudio.format_id!,
      null,
      (bestAudio.ext || 'm4a').toLowerCase(),
      false,
      true,
    );
    void bytes;
    void approx;
  }

  const options = [...byKey.values()];
  options.sort((a, b) => {
    const ha = a.height ?? -1;
    const hb = b.height ?? -1;
    if (hb !== ha) return hb - ha;
    return a.ext.localeCompare(b.ext);
  });

  return options;
}

export function formatOptionLabel(option: FormatOption, sizeUnavailableLabel?: string): string {
  return [
    option.resolutionLabel,
    option.ext,
    bytesToMbLabel(option.filesizeBytes, option.filesizeApprox, sizeUnavailableLabel),
  ].join(' · ');
}
