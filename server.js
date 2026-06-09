const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { parse } = require('url');

const logFile = path.join(__dirname, 'app.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const msg = `[${new Date().toISOString()}] ${message}\n`;
  console.log(message);
  logStream.write(msg);
}

log('🚀 Starting Onusandhan AI Monorepo Services in-process...');

// Prevent Next.js from spawning backend a second time
process.env.API_SPAWNED = 'true';

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
  process.exit(code || 1);
});

// 2. Start Next.js programmatically
const next = require('next');
const externalPort = process.env.PORT || '3000';
log(`Frontend will listen on port ${externalPort} (proxied to API on port 3001)`);

const app = next({ dev: false, dir: path.resolve(__dirname, 'apps/web') });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(externalPort, (err) => {
      if (err) {
        log(`❌ Error starting Next.js server: ${err.message}`);
        process.exit(1);
      }
      log(`🚀 Next.js frontend and api proxy listening on port ${externalPort}`);
    });
  })
  .catch((err) => {
    log(`❌ Failed to prepare Next.js app: ${err.message}`);
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
