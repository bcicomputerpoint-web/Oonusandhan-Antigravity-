const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { startServer } = require('next/dist/server/lib/start-server');

const logFile = path.join(__dirname, 'app.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const msg = `[${new Date().toISOString()}] ${message}\n`;
  console.log(message);
  logStream.write(msg);
}

log('🚀 Starting Onusandhan AI Monorepo Services in-process...');

// 1. Start Fastify API (Backend) on local port 3001
const apiPath = path.resolve(__dirname, 'apps/api/dist/index.js');
log(`Spawning Fastify API backend from: ${apiPath}`);
const apiProcess = spawn('node', [apiPath], {
  env: { ...process.env, PORT: '3001' },
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
});

// Set env var to prevent Next.js from spawning backend a second time
process.env.API_SPAWNED = 'true';

// 2. Start Next.js programmatically in-process
const rawPort = process.env.PORT || '3000';
const port = isNaN(Number(rawPort)) ? rawPort : parseInt(rawPort, 10);
log(`Frontend will listen on port/socket: ${port} (proxied to API on port 3001)`);

startServer({
  dir: path.resolve(__dirname, 'apps/web'),
  port,
})
.then(() => {
  log('🚀 Next.js production server is ready and listening.');
})
.catch((err) => {
  log(`❌ Failed to start Next.js server: ${err.message}`);
  process.exit(1);
});

// 3. Cleanup on exit
const cleanup = () => {
  log('Stopping backend API...');
  try {
    apiProcess.kill();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
