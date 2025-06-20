// Polyfill for import.meta.dirname in production environments
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Polyfill import.meta.dirname for compatibility
if (typeof (import.meta as any).dirname === 'undefined') {
  (import.meta as any).dirname = __dirname;
}

// Make __dirname globally available
(globalThis as any).__dirname = __dirname;

export {};