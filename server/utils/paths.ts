import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the current directory name in a way that works in both development and production
function getCurrentDirname(): string {
  // In production builds, import.meta.dirname might be undefined
  if (typeof import.meta.dirname !== 'undefined') {
    return import.meta.dirname;
  }
  
  // Fallback for production environments
  if (typeof import.meta.url !== 'undefined') {
    return dirname(fileURLToPath(import.meta.url));
  }
  
  // Last resort fallback
  return process.cwd();
}

export const __dirname = getCurrentDirname();

// Helper functions for common path resolutions
export function getProjectRoot(): string {
  return resolve(__dirname, '..', '..');
}

export function getClientPath(...paths: string[]): string {
  return resolve(getProjectRoot(), 'client', ...paths);
}

export function getDistPath(...paths: string[]): string {
  return resolve(getProjectRoot(), 'dist', ...paths);
}

export function getPublicPath(...paths: string[]): string {
  return resolve(getDistPath(), 'public', ...paths);
}