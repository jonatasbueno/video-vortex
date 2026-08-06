import { spawnYtDlp, waitForProcess } from './spawnYtdlp.js';

export class YtDlpError extends Error {
  readonly stderr: string;
  readonly code: number | null;
  readonly timedOut: boolean;

  constructor(message: string, options: { stderr?: string; code?: number | null; timedOut?: boolean } = {}) {
    super(message);
    this.name = 'YtDlpError';
    this.stderr = options.stderr?.trim() ?? '';
    this.code = options.code ?? null;
    this.timedOut = Boolean(options.timedOut);
  }
}

export interface RunYtDlpOptions {
  url: string;
  flags: Record<string, unknown>;
  /** Abort / kill after this many ms. Default: no timeout. */
  timeoutMs?: number;
  timeoutMessage?: string;
}

export interface RunYtDlpResult {
  stdout: string;
  stderr: string;
}

function collectStream(stream: NodeJS.ReadableStream | null | undefined): {
  text: () => string;
  done: Promise<void>;
} {
  const chunks: Buffer[] = [];
  if (!stream || typeof stream.on !== 'function') {
    return { text: () => '', done: Promise.resolve() };
  }
  let settled = false;
  const done = new Promise<void>((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    stream.on('data', (buf: Buffer | string) => {
      chunks.push(typeof buf === 'string' ? Buffer.from(buf) : buf);
    });
    stream.on('end', finish);
    stream.on('close', finish);
  });
  return {
    text: () => Buffer.concat(chunks).toString('utf8'),
    done,
  };
}

function summarizeStderr(stderr: string, maxLen = 800): string {
  const cleaned = stderr
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith('[download]'))
    .join('\n')
    .trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen)}…`;
}

/**
 * Run yt-dlp, capture stdout/stderr, optional timeout with process kill.
 */
export async function runYtDlp(options: RunYtDlpOptions): Promise<RunYtDlpResult> {
  const child = spawnYtDlp(options.url, options.flags);
  const out = collectStream(child.stdout);
  const err = collectStream(child.stderr);

  let timedOut = false;
  let timer: NodeJS.Timeout | undefined;

  const processDone = waitForProcess(child).finally(async () => {
    // Streams may not emit end after kill — don't block forever
    await Promise.race([
      Promise.all([out.done, err.done]),
      new Promise<void>((resolve) => setTimeout(resolve, 25)),
    ]);
  });

  try {
    if (options.timeoutMs && options.timeoutMs > 0) {
      await new Promise<void>((resolve, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          try {
            child.kill('SIGTERM');
          } catch {
            /* ignore */
          }
          reject(
            new YtDlpError(
              options.timeoutMessage ?? `yt-dlp timed out after ${options.timeoutMs}ms`,
              { stderr: err.text(), timedOut: true },
            ),
          );
        }, options.timeoutMs);

        processDone.then(
          () => {
            if (!timedOut) resolve();
          },
          (error: unknown) => {
            if (timedOut) return;
            const stderr = err.text();
            const base = error instanceof Error ? error.message : String(error);
            const detail = summarizeStderr(stderr);
            reject(
              new YtDlpError(detail ? `${base}\n${detail}` : base, {
                stderr,
                timedOut: false,
              }),
            );
          },
        );
      });
    } else {
      try {
        await processDone;
      } catch (error) {
        const stderr = err.text();
        const base = error instanceof Error ? error.message : String(error);
        const detail = summarizeStderr(stderr);
        throw new YtDlpError(detail ? `${base}\n${detail}` : base, { stderr });
      }
    }

    return { stdout: out.text(), stderr: err.text() };
  } catch (error) {
    if (error instanceof YtDlpError) {
      if (!error.stderr && err.text()) {
        throw new YtDlpError(error.message, {
          stderr: err.text(),
          code: error.code,
          timedOut: error.timedOut || timedOut,
        });
      }
      throw error;
    }
    const stderr = err.text();
    const base = error instanceof Error ? error.message : String(error);
    const detail = summarizeStderr(stderr);
    throw new YtDlpError(detail ? `${base}\n${detail}` : base, {
      stderr,
      timedOut,
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function parseJsonStdout<T>(stdout: string, stderr = ''): T {
  const trimmed = stdout.trim();
  if (!trimmed) {
    const detail = summarizeStderr(stderr);
    throw new YtDlpError(detail || 'yt-dlp returned empty output.', { stderr });
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const detail = summarizeStderr(stderr);
    throw new YtDlpError(
      detail ? `Failed to parse yt-dlp JSON.\n${detail}` : 'Failed to parse yt-dlp JSON.',
      { stderr },
    );
  }
}

export { summarizeStderr };
