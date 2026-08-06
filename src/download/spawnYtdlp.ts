import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptions } from 'node:child_process';
import youtubeDl from 'youtube-dl-exec';

type YtDlpModule = typeof youtubeDl & {
  constants: { YOUTUBE_DL_PATH: string };
  args: (flags?: Record<string, unknown>) => string[];
};

const ytdl = youtubeDl as YtDlpModule;

export type YtDlpSpawner = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcessWithoutNullStreams | ReturnType<typeof spawn>;

let spawner: YtDlpSpawner = spawn;

/** Allow tests to inject a fake process spawner. */
export function setYtDlpSpawner(next: YtDlpSpawner): void {
  spawner = next;
}

export function resetYtDlpSpawner(): void {
  spawner = spawn;
}

export function getYtDlpBinaryPath(): string {
  return ytdl.constants.YOUTUBE_DL_PATH;
}

export function flagsToArgs(flags: Record<string, unknown>): string[] {
  return ytdl.args(flags);
}

/**
 * Spawn yt-dlp with unbuffered stderr so progress lines arrive live (not at exit).
 */
export function spawnYtDlp(
  url: string,
  flags: Record<string, unknown>,
): ChildProcessWithoutNullStreams | ReturnType<typeof spawn> {
  const args = [url, ...flagsToArgs(flags)];
  return spawner(getYtDlpBinaryPath(), args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
    },
  });
}

export function waitForProcess(child: {
  on: (event: string, listener: (...args: any[]) => void) => unknown;
}): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    child.on('error', (err: Error) => reject(err));
    child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
      if (code === 0) resolve({ code, signal });
      else {
        const signalInfo = signal ? ` signal ${signal}` : '';
        reject(new Error(`yt-dlp exited with code ${code}${signalInfo}`));
      }
    });
  });
}
