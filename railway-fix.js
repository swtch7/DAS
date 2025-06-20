// Comprehensive Railway deployment fix
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

console.log('Building for Railway deployment...');

// Build client
console.log('Building client...');
execSync('vite build', { stdio: 'inherit' });

// Build server with complete path resolution fix
console.log('Building server...');
execSync(`esbuild server/index.ts --bundle --platform=node --format=esm --outfile=dist/index.js --external:pg-native --external:sharp --external:canvas --packages=external --define:import.meta.dirname='"/app/dist"'`, { stdio: 'inherit' });

// Post-process the bundle to ensure Railway compatibility
console.log('Applying Railway compatibility fixes...');
let code = readFileSync('dist/index.js', 'utf8');

// Comprehensive fix for all path resolution issues
const railwayFix = `
// Railway deployment compatibility layer
import { fileURLToPath } from 'url';
import { dirname, resolve as originalResolve } from 'path';

// Get runtime directory
const getRuntimeDir = () => {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return '/app/dist';
  }
};

const runtimeDir = getRuntimeDir();

// Override path.resolve globally to handle undefined arguments
const path = await import('path');
path.resolve = function(...args) {
  const filteredArgs = args.filter(arg => arg !== undefined && arg !== null);
  if (filteredArgs.length === 0) {
    return runtimeDir;
  }
  return originalResolve.apply(this, filteredArgs);
};

// Ensure import.meta.dirname is always defined
if (typeof import.meta.dirname === 'undefined') {
  import.meta.dirname = runtimeDir;
}

`;

// Apply additional safety replacements
code = code.replace(/import\.meta\.dirname/g, 'runtimeDir');
code = code.replace(/path\.resolve\(\s*undefined/g, 'path.resolve(runtimeDir');
code = code.replace(/resolve\(\s*undefined/g, 'resolve(runtimeDir');

// Write the final Railway-compatible file
writeFileSync('dist/index.js', railwayFix + code);

console.log('Railway build completed successfully!');

// Run verification test
execSync('node deploy-test.js', { stdio: 'inherit' });