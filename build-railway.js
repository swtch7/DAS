#!/usr/bin/env node
// Railway-specific build script that properly handles import.meta.dirname

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

console.log('Building for Railway deployment...');

// First, build the client
console.log('Building client...');
execSync('vite build', { stdio: 'inherit' });

// Then, build the server with proper dirname handling
console.log('Building server...');
execSync('node esbuild.config.js', { stdio: 'inherit' });

// Post-process the built file to ensure dirname works
console.log('Post-processing for Railway...');
const builtFile = readFileSync('dist/index.js', 'utf8');

// Add additional runtime safety
const railwayCompatibleCode = `
// Railway deployment compatibility
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Ensure __getProperDirname is available globally
if (typeof globalThis.__getProperDirname === 'undefined') {
  globalThis.__getProperDirname = function() {
    try {
      if (import.meta && import.meta.url) {
        return dirname(fileURLToPath(import.meta.url));
      }
    } catch (e) {
      // Railway fallback
    }
    return '/app/dist';
  };
}

${builtFile}
`;

writeFileSync('dist/index.js', railwayCompatibleCode);
console.log('Build completed successfully for Railway!');