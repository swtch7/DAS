// Comprehensive fix for import.meta.dirname in production environments
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Create __dirname equivalent for ESM in all environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global polyfill for import.meta.dirname
declare global {
  namespace ImportMeta {
    var dirname: string;
  }
}

// Apply the polyfill if needed
if (typeof import.meta.dirname === 'undefined') {
  (import.meta as any).dirname = __dirname;
}

// Also set it as a global for any other modules that might need it
(globalThis as any).__projectDirname = __dirname;

export { __dirname };