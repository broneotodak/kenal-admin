import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

try {
  console.log('📦 Generating build information...');
  
  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  // Get git information
  const getGitInfo = (command, fallback = 'unknown') => {
    try {
      return execSync(command, { encoding: 'utf8' }).trim();
    } catch (error) {
      console.warn(`⚠️ Git command failed: ${command}`);
      return fallback;
    }
  };

  const buildInfo = {
    version: process.env.npm_package_version || '2.1.0',
    buildTime: new Date().toISOString(),
    gitCommitHash: getGitInfo('git rev-parse HEAD'),
    gitCommitShort: getGitInfo('git rev-parse --short HEAD'),
    gitBranch: getGitInfo('git rev-parse --abbrev-ref HEAD', 'main'),
    gitCommitMessage: getGitInfo('git log -1 --pretty=%B'),
    gitCommitDate: getGitInfo('git log -1 --format=%cI'),
    gitAuthor: getGitInfo('git log -1 --pretty=format:"%an"'),
    isDirty: getGitInfo('git status --porcelain') !== '',
    environment: process.env.NODE_ENV || 'development',
    buildId: `${Date.now()}`,
    repository: 'BroLanTodak/adminkenal'
  };

  // Write build info to public directory
  const buildInfoPath = path.join(publicDir, 'build-info.json');
  writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

  console.log('✅ Build info generated successfully:');
  console.log(`   📍 Version: ${buildInfo.version}`);
  console.log(`   🔗 Commit: ${buildInfo.gitCommitShort} (${buildInfo.gitBranch})`);
  console.log(`   📅 Build: ${buildInfo.buildTime}`);
  console.log(`   🌍 Environment: ${buildInfo.environment}`);
  console.log(`   📁 File: ${buildInfoPath}`);

} catch (error) {
  console.error('❌ Failed to generate build info:', error);
  
  // Create fallback build info
  const fallbackInfo = {
    version: '2.1.0',
    buildTime: new Date().toISOString(),
    gitCommitHash: 'unknown',
    gitCommitShort: 'unknown',
    gitBranch: 'main',
    gitCommitMessage: 'Build info generation failed',
    gitCommitDate: new Date().toISOString(),
    gitAuthor: 'Unknown',
    isDirty: false,
    environment: process.env.NODE_ENV || 'development',
    buildId: `${Date.now()}`,
    repository: 'BroLanTodak/adminkenal'
  };

  const publicDir = path.join(process.cwd(), 'public');
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  writeFileSync(path.join(publicDir, 'build-info.json'), JSON.stringify(fallbackInfo, null, 2));
  console.log('📦 Fallback build info created');
} 