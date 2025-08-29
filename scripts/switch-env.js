#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const environment = args[0];

if (!environment || !['dev', 'prod', 'production'].includes(environment)) {
  console.log('Usage: node scripts/switch-env.js [dev|prod|production]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/switch-env.js dev        # Switch to development');
  console.log('  node scripts/switch-env.js prod       # Switch to production');
  console.log('  node scripts/switch-env.js production # Switch to production');
  process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const envLocalBackupPath = path.join(rootDir, '.env.local.backup');

// Normalize environment name
const env = environment === 'production' ? 'prod' : environment;

try {
  // Backup current .env.local if it exists
  if (fs.existsSync(envLocalPath)) {
    fs.copyFileSync(envLocalPath, envLocalBackupPath);
    console.log('✓ Backed up current .env.local');
  }

  let sourceFile;
  if (env === 'dev') {
    sourceFile = path.join(rootDir, '.env.example');
    if (!fs.existsSync(sourceFile)) {
      console.error('❌ .env.example not found');
      process.exit(1);
    }
  } else if (env === 'prod') {
    sourceFile = path.join(rootDir, '.env.production');
    if (!fs.existsSync(sourceFile)) {
      console.error('❌ .env.production not found');
      process.exit(1);
    }
  }

  // Copy the appropriate environment file
  fs.copyFileSync(sourceFile, envLocalPath);
  
  console.log(`✓ Switched to ${env === 'dev' ? 'development' : 'production'} environment`);
  console.log(`✓ Updated .env.local with settings from ${path.basename(sourceFile)}`);
  
  if (env === 'prod') {
    console.log('');
    console.log('🚀 Production environment active:');
    console.log('   - API: https://api.stagio.live');
    console.log('   - WebSocket: https://api.stagio.live/ws');
    console.log('   - SSE: https://api.stagio.live/streams/view/subscribe');
    console.log('   - RTMP: rtmp://api.stagio.live:1935/live');
  } else {
    console.log('');
    console.log('🛠️  Development environment active:');
    console.log('   - API: http://localhost:8082');
    console.log('   - WebSocket: http://localhost:8082/ws');
    console.log('   - SSE: http://localhost:8082/streams/view/subscribe');
    console.log('   - RTMP: rtmp://localhost:1935/live');
  }
  
  console.log('');
  console.log('💡 Restart your development server to apply changes');
  
} catch (error) {
  console.error('❌ Error switching environment:', error.message);
  process.exit(1);
}