// Runtime fix for import.meta.dirname bundling issue
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the runtime directory
const getRuntimeDirname = () => {
  try {
    if (typeof import.meta.url !== 'undefined') {
      return dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {
    // Fallback
  }
  return process.cwd();
};

// Set the dirname globally before any bundled code runs
const runtimeDirname = getRuntimeDirname();
globalThis.__runtimeDirname = runtimeDirname;

// Monkey patch path.resolve to handle undefined arguments
const originalResolve = (await import('path')).resolve;
const path = await import('path');
path.resolve = function(...args) {
  // Filter out undefined arguments and replace with runtime dirname
  const filteredArgs = args.map(arg => 
    arg === undefined || arg === null ? runtimeDirname : arg
  );
  return originalResolve.apply(this, filteredArgs);
};

export { runtimeDirname as __dirname };