#!/usr/bin/env node

/**
 * Script to help replace console.log statements with logger utility
 * Usage: node scripts/replace-console-logs.js [--dry-run]
 */

const fs = require('fs')
const path = require('path')

const dryRun = process.argv.includes('--dry-run')

console.log('🔍 Searching for console.log statements...')
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'REPLACE'}`)

let totalFound = 0
let totalReplaced = 0

// Files/directories to skip
const skipPaths = [
  'node_modules',
  '.next',
  '.git',
  'scripts',
  'logger.ts' // Don't modify the logger file itself
]

// Function to check if path should be skipped
function shouldSkip(filePath) {
  return skipPaths.some(skip => filePath.includes(skip))
}

// Function to process a file
function processFile(filePath) {
  if (shouldSkip(filePath)) return
  
  const ext = path.extname(filePath)
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return
  
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Count console.log occurrences
  const matches = content.match(/console\.(log|warn|error|info|debug)/g)
  if (!matches || matches.length === 0) return
  
  totalFound += matches.length
  console.log(`\n📄 ${filePath}`)
  console.log(`   Found ${matches.length} console statements`)
  
  if (!dryRun) {
    let newContent = content
    
    // Check if logger is already imported
    const hasLoggerImport = content.includes("from '@/lib/logger'")
    
    // Add import if not present
    if (!hasLoggerImport && matches.some(m => m !== 'console.error')) {
      // Find the right place to add import (after other imports)
      const importMatch = content.match(/(import[\s\S]*?from\s+['"][^'"]+['"][\s\S]*?\n)+/)
      if (importMatch) {
        const lastImportEnd = importMatch.index + importMatch[0].length
        newContent = 
          content.slice(0, lastImportEnd) +
          "import { logger } from '@/lib/logger'\n" +
          content.slice(lastImportEnd)
      } else {
        // No imports found, add at the beginning
        newContent = "import { logger } from '@/lib/logger'\n\n" + content
      }
    }
    
    // Replace console statements (except console.error which we keep)
    newContent = newContent
      .replace(/console\.log/g, 'logger.log')
      .replace(/console\.warn/g, 'logger.warn')
      .replace(/console\.info/g, 'logger.info')
      .replace(/console\.debug/g, 'logger.debug')
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent)
      totalReplaced += matches.filter(m => m !== 'console.error').length
      console.log(`   ✅ Replaced ${matches.filter(m => m !== 'console.error').length} statements`)
    }
  }
}

// Function to recursively process directory
function processDirectory(dirPath) {
  if (shouldSkip(dirPath)) return
  
  const items = fs.readdirSync(dirPath)
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      processDirectory(fullPath)
    } else if (stat.isFile()) {
      processFile(fullPath)
    }
  }
}

// Start processing from src directory
const srcPath = path.join(process.cwd(), 'src')
if (fs.existsSync(srcPath)) {
  processDirectory(srcPath)
} else {
  console.error('❌ src directory not found!')
  process.exit(1)
}

console.log('\n' + '='.repeat(50))
console.log(`📊 Summary:`)
console.log(`   Total console statements found: ${totalFound}`)
if (!dryRun) {
  console.log(`   Total statements replaced: ${totalReplaced}`)
  console.log(`   console.error statements kept: ${totalFound - totalReplaced}`)
}
console.log('='.repeat(50))

if (dryRun) {
  console.log('\n💡 Run without --dry-run to actually replace the statements')
} 