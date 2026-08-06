const PERCENT_RE = /\[download\]\s+(\d+(?:\.\d+)?)%/g;

/**
 * Extract all download percentages from a yt-dlp progress chunk (in order).
 */
export function parseAllDownloadPercents(chunk: string): number[] {
  const values: number[] = [];
  for (const match of chunk.matchAll(PERCENT_RE)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      values.push(Math.min(100, Math.max(0, value)));
    }
  }
  return values;
}

/**
 * Extract the latest download percentage from a yt-dlp progress chunk.
 * Returns null when the chunk has no percent information.
 */
export function parseDownloadPercent(chunk: string): number | null {
  const all = parseAllDownloadPercents(chunk);
  return all.length > 0 ? all[all.length - 1]! : null;
}

export interface ProgressSubscription {
  /** Stop listening for new stderr data. Already queued updates still flush. */
  detach: () => void;
  /** Wait until all queued progressive updates have been delivered. */
  flush: () => Promise<void>;
}

/**
 * Attach a live progress listener.
 * Each percent is emitted on a separate turn of the event loop so React/Ink
 * can paint intermediate frames instead of batching to the last value.
 */
export function attachProgressListener(
  stream: NodeJS.ReadableStream | null | undefined,
  onProgress: (percent: number) => void,
): ProgressSubscription {
  if (!stream || typeof stream.on !== 'function') {
    return {
      detach: () => undefined,
      flush: async () => undefined,
    };
  }

  let chain: Promise<void> = Promise.resolve();
  let lastEmitted = -1;
  let listening = true;

  const handler = (buf: Buffer | string) => {
    if (!listening) return;
    const text = typeof buf === 'string' ? buf : buf.toString('utf8');
    const percents = parseAllDownloadPercents(text);
    for (const percent of percents) {
      if (percent < lastEmitted && percent < 5) {
        // New yt-dlp phase (e.g. audio after video) — allow reset
        lastEmitted = -1;
      }
      if (percent === lastEmitted) continue;
      lastEmitted = percent;
      const value = percent;
      chain = chain.then(
        () =>
          new Promise<void>((resolve) => {
            setImmediate(() => {
              onProgress(value);
              resolve();
            });
          }),
      );
    }
  };

  stream.on('data', handler);
  return {
    detach: () => {
      listening = false;
      stream.off?.('data', handler);
    },
    flush: () => chain,
  };
}
