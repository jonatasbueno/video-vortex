import os from 'node:os';
import path from 'node:path';

export function getDefaultDownloadDir(): string {
  const xdg = process.env.XDG_DOWNLOAD_DIR?.trim();
  if (xdg) {
    return path.join(xdg, 'VideoVortex');
  }
  return path.join(os.homedir(), 'Downloads', 'VideoVortex');
}
