import { spawn } from 'child_process';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://127.0.0.1:3001/:path*',
      },
    ];
  },
};

export default (phase) => {
  // Spawn the backend API in the background during the server execution phase
  if (phase === 'phase-production-server' && process.env.API_SPAWNED !== 'true') {
    console.log('🚀 Next.js starting: Spawning Fastify API backend in the background...');
    try {
      const apiPath = path.resolve(process.cwd(), 'apps/api/dist/index.js');
      const apiProcess = spawn('node', [apiPath], {
        env: { ...process.env, PORT: '3001' },
        detached: true,
        stdio: 'inherit',
        shell: true
      });
      apiProcess.unref();
      console.log('✅ Fastify API backend spawned in background.');
    } catch (error) {
      console.error('❌ Failed to spawn Fastify API backend:', error);
    }
  }
  
  return nextConfig;
};
