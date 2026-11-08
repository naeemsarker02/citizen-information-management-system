const app = require('./app');
const env = require('./config/env');
const { pool, testConnection } = require('./config/database');

let server;

async function bootstrap() {
  try {
    await testConnection();
    console.log('MySQL connected');

    server = app.listen(env.port, () => {
      console.log(`CIMS API running on http://localhost:${env.port}`);
      console.log(`Health:      http://localhost:${env.port}/api/health`);
      console.log(`Auth login:  POST http://localhost:${env.port}/api/auth/login`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down...`);
  if (server) {
    server.close(async () => {
      try {
        await pool.end();
        console.log('HTTP server closed, MySQL pool ended');
      } catch (err) {
        console.error('Error during shutdown:', err.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap();