import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

console.log('🔍 Verifying build dependencies...');

try {
  // Check if TypeScript is installed
  const tscPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsc');
  const tscExists = existsSync(tscPath);
  
  if (!tscExists) {
    console.log('❌ TypeScript not found, installing...');
    execSync('npm install --save-dev typescript@^5.4.5', { stdio: 'inherit' });
  } else {
    console.log('✅ TypeScript found');
  }

  // Verify TypeScript version
  try {
    const tscVersion = execSync('npx tsc --version', { encoding: 'utf8' });
    console.log('✅ TypeScript version:', tscVersion.trim());
  } catch (err) {
    console.log('⚠️ Could not get TypeScript version, but continuing...');
  }

  // Check if @types packages are present
  const typesPackages = ['@types/node', '@types/react', '@types/react-dom'];
  for (const pkg of typesPackages) {
    const pkgPath = path.join(process.cwd(), 'node_modules', pkg);
    if (existsSync(pkgPath)) {
      console.log(`✅ ${pkg} found`);
    } else {
      console.log(`⚠️ ${pkg} not found`);
    }
  }

  console.log('🎯 Dependency verification complete');

} catch (error) {
  console.error('❌ Dependency verification failed:', error);
  process.exit(1);
} 