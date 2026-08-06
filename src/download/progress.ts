const PERCENT_RE = /\[download\]\s+(\d+(?:\.\d+)?)%/g;

/**
 * Extract the latest download percentage from a yt-dlp progress chunk.
 * Returns null when the chunk has no percent information.
 */
export function parseDownloadPercent(chunk: string): number | null {
  let last: number | null = null;
  for (const match of chunk.matchAll(PERCENT_RE)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      last = Math.min(100, Math.max(0, value));
    }
  }
  return last;
}

export function attachProgressListener(
  stream: NodeJS.ReadableStream | null | undefined,
  onProgress: (percent: number) => void,
): () => void {
  if (!stream || typeof stream.on !== 'function') {
    return () => undefined;
  }

  const handler = (buf: Buffer | string) => {
    const text = typeof buf === 'string' ? buf : buf.toString('utf8');
    const percent = parseDownloadPercent(text);
    if (percent != null) onProgress(percent);
  };

  stream.on('data', handler);
  return () => {
    stream.off?.('data', handler);
  };
}
