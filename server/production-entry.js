// Production entry point with proper dirname handling
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Immediately set up the dirname before importing anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Patch import.meta.dirname globally
if (typeof import.meta.dirname === 'undefined') {
  import.meta.dirname = __dirname;
}

// Set global reference for bundled code
globalThis.__productionDirname = __dirname;

// Now import and start the actual application
import('./index.js').catch(console.error);