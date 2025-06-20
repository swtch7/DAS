// Comprehensive fix for import.meta.dirname in production environments
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Force early evaluation of __dirname before the module system tries to use it
let currentDirname: string;

try {
  // Try to get dirname from import.meta.url
  if (import.meta.url) {
    const __filename = fileURLToPath(import.meta.url);
    currentDirname = dirname(__filename);
  } else {
    // Fallback to process.cwd() if import.meta.url is not available
    currentDirname = process.cwd();
  }
} catch (error) {
  // Last resort fallback
  currentDirname = process.cwd();
}

// Immediately set import.meta.dirname before any other modules load
(import.meta as any).dirname = currentDirname;

// Also patch the global import.meta object to ensure it's available everywhere
const originalImportMeta = globalThis.import?.meta || import.meta;
if (originalImportMeta && typeof originalImportMeta.dirname === 'undefined') {
  originalImportMeta.dirname = currentDirname;
}

// Create a global reference for use in the bundled code
(globalThis as any).__bundledDirname = currentDirname;

// Export for explicit use
export const __dirname = currentDirname;