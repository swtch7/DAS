// Production polyfill for import.meta.dirname compatibility
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current directory in production environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Patch import.meta.dirname globally for the production build
const originalImportMeta = import.meta;
import.meta.dirname = __dirname;

// Export for use in other modules
export { __dirname };

console.log('Production polyfill loaded, __dirname:', __dirname);