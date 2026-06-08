module.exports = {
  apps: [
    {
      name: "onusandhan-api",
      script: "./apps/api/dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
    {
      name: "onusandhan-web",
      script: "./node_modules/next/dist/bin/next",
      args: "start ./apps/web -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
