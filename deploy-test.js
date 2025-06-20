// Test script to verify Railway deployment compatibility
import { readFileSync } from 'fs';

console.log('Testing Railway deployment build...');

try {
  const builtCode = readFileSync('dist/index.js', 'utf8');
  
  // Check for potential issues
  const issues = [];
  
  if (builtCode.includes('import.meta.dirname') && !builtCode.includes('runtimeDir')) {
    issues.push('Found unresolved import.meta.dirname references');
  }
  
  if (builtCode.includes('resolve(undefined')) {
    issues.push('Found undefined path.resolve arguments');
  }
  
  if (builtCode.includes('undefined,')) {
    issues.push('Found undefined arguments in function calls');
  }
  
  if (issues.length === 0) {
    console.log('✅ Build verification passed - Railway deployment should work');
  } else {
    console.log('❌ Build verification failed:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
} catch (error) {
  console.error('Failed to verify build:', error.message);
}