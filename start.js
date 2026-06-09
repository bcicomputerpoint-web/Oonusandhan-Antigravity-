const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'app.log');
const logStream = fs.createWriteStream(logFile, { flags: 'w' }); // fresh log on restart

function log(message) {
  const msg = `[${new Date().toISOString()}] ${message}\n`;
  console.log(message);
  logStream.write(msg);
}

log('🚀 Starting Onusandhan AI Monorepo Services...');

// 1. Start Fastify API (Backend) on local port 3001
const apiProcess = spawn('node', ['./apps/api/dist/index.js'], {
  env: { ...process.env, PORT: 3001 },
  shell: true
});

apiProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
  logStream.write(data);
});

apiProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
  logStream.write(data);
});

apiProcess.on('error', (err) => {
  log(`❌ Failed to start Backend API: ${err.message}`);
});

apiProcess.on('exit', (code) => {
  log(`Backend API process exited with code ${code}`);
  process.exit(code || 1);
});

// 2. Start Next.js Frontend (Web) on the external dynamic PORT assigned by Hostinger
const externalPort = process.env.PORT || '3000';
log(`Frontend will listen on port ${externalPort} (proxied to API on port 3001)`);

const webProcess = spawn('node', ['./node_modules/next/dist/bin/next', 'start', './apps/web', '-p', externalPort], {
  env: { ...process.env, API_SPAWNED: 'true' },
  shell: true
});

webProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
  logStream.write(data);
});

webProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
  logStream.write(data);
});

webProcess.on('error', (err) => {
  log(`❌ Failed to start Next.js Frontend: ${err.message}`);
});

webProcess.on('exit', (code) => {
  log(`Next.js Frontend process exited with code ${code}`);
  process.exit(code || 1);
});

// 3. Cleanup on exit
const cleanup = () => {
  log('Stopping all services...');
  try {
    apiProcess.kill();
  } catch (e) {}
  try {
    webProcess.kill();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
