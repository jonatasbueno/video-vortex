import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';

export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await execa('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remux file stripping container metadata as much as possible.
 * Falls back to copying streams without re-encoding.
 */
export async function stripMetadata(filePath: string): Promise<string> {
  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ext);
  const tempPath = path.join(dir, `${base}.clean${ext}`);

  await execa(
    'ffmpeg',
    [
      '-y',
      '-i',
      filePath,
      '-map_metadata',
      '-1',
      '-fflags',
      '+bitexact',
      '-c',
      'copy',
      tempPath,
    ],
    { reject: true },
  );

  const { rename, unlink } = await import('node:fs/promises');
  await unlink(filePath);
  await rename(tempPath, filePath);
  return filePath;
}

export async function assertFileExists(filePath: string): Promise<void> {
  await access(filePath, constants.F_OK);
}
