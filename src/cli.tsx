import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from './app.js';
import { renderBanner } from './ui/banner.js';
import { normalizeLocale, setLocale, t } from './i18n/index.js';

function readPackageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(here, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('video-vortex')
    .description('Video Vortex — interactive terminal video downloader')
    .version(readPackageVersion())
    .option('-u, --url <url>', 'Video URL')
    .option('-d, --dir <path>', 'Download directory')
    .option('-l, --lang <locale>', 'UI language: pt | en', 'pt')
    .parse(argv);

  const opts = program.opts<{
    url?: string;
    dir?: string;
    lang?: string;
  }>();

  setLocale(normalizeLocale(opts.lang));

  // Print banner before Ink takes over stdout
  console.log(renderBanner(t('bannerSubtitle')));

  const instance = render(<App initialUrl={opts.url} initialDir={opts.dir} />);
  await instance.waitUntilExit();
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('cli.js') ||
    process.argv[1].endsWith('cli.tsx') ||
    process.argv[1].includes('video-vortex') ||
    process.argv[1].endsWith('/vv'));

if (isDirectRun) {
  runCli().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}
