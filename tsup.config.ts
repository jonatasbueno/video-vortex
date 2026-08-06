import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli.tsx',
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node24',
  external: ['youtube-dl-exec', 'ink', 'react', 'ink-text-input'],
  async onSuccess() {
    const { readFile, writeFile, chmod } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const path = fileURLToPath(new URL('./dist/cli.js', import.meta.url));
    const content = await readFile(path, 'utf8');
    if (!content.startsWith('#!/usr/bin/env node')) {
      await writeFile(path, `#!/usr/bin/env node\n${content}`);
    }
    await chmod(path, 0o755);
  },
});
