import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { db } from './database/client.js';
import { setupWebSocketServer } from './websocket/wsHandler.js';

const PORT = Number(process.env.PORT) || env.PORT || 3001;

async function bootstrap() {
  try {
    // 1. Initialize database connection & seed default records
    await db.init();

    // 2. Create HTTP server instance from Express application
    const server = http.createServer(app);

    // 3. Attach WebSocket server to HTTP server
    const wss = setupWebSocketServer(server);

    // 4. Listen on dynamic PORT (Render requirement)
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`=======================================================`);
      logger.info(` CipherChat Backend listening on port ${PORT}`);
      logger.info(` HTTP REST API:   http://0.0.0.0:${PORT}/api`);
      logger.info(` WebSocket Relay: ws://0.0.0.0:${PORT}/ws`);
      logger.info(` Mode:            ${env.NODE_ENV}`);
      logger.info(` Security:        Zero-Knowledge Dumb-Pipe active`);
      logger.info(`=======================================================`);
    });

    // Graceful termination handling
    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      wss.close(() => {
        logger.info('WebSocket server closed.');
        server.close(() => {
          logger.info('HTTP server closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Failed to start CipherChat backend', { error: String(err) });
    process.exit(1);
  }
}

bootstrap();
