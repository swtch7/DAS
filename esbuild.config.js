// Custom esbuild configuration for Railway deployment
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build configuration that properly handles import.meta.dirname
await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
  external: [
    'pg-native',
    'sharp',
    'canvas',
    '@img/*',
    'lightningcss',
    'fsevents'
  ],
  packages: 'external',
  define: {
    // Replace import.meta.dirname with a function call that works at runtime
    'import.meta.dirname': '__getProperDirname()'
  },
  banner: {
    js: `
// Runtime dirname resolution for bundled code
import { fileURLToPath } from 'url';
import { dirname } from 'path';

function __getProperDirname() {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return process.cwd();
  }
}

// Global fallback
globalThis.__getProperDirname = __getProperDirname;
`
  },
  minify: false,
  sourcemap: true,
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});