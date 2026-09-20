"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = require("./config/env.js");
const logger_js_1 = require("./utils/logger.js");
const client_js_1 = require("./database/client.js");
const wsHandler_js_1 = require("./websocket/wsHandler.js");
const PORT = Number(process.env.PORT) || env_js_1.env.PORT || 3001;
async function bootstrap() {
    try {
        // 1. Initialize database connection & seed default records
        await client_js_1.db.init();
        // 2. Create HTTP server instance from Express application
        const server = http_1.default.createServer(app_js_1.default);
        // 3. Attach WebSocket server to HTTP server
        const wss = (0, wsHandler_js_1.setupWebSocketServer)(server);
        // 4. Listen on dynamic PORT (Render requirement)
        server.listen(PORT, '0.0.0.0', () => {
            logger_js_1.logger.info(`=======================================================`);
            logger_js_1.logger.info(` CipherChat Backend listening on port ${PORT}`);
            logger_js_1.logger.info(` HTTP REST API:   http://0.0.0.0:${PORT}/api`);
            logger_js_1.logger.info(` WebSocket Relay: ws://0.0.0.0:${PORT}/ws`);
            logger_js_1.logger.info(` Mode:            ${env_js_1.env.NODE_ENV}`);
            logger_js_1.logger.info(` Security:        Zero-Knowledge Dumb-Pipe active`);
            logger_js_1.logger.info(`=======================================================`);
        });
        // Graceful termination handling
        const shutdown = () => {
            logger_js_1.logger.info('Shutting down server gracefully...');
            wss.close(() => {
                logger_js_1.logger.info('WebSocket server closed.');
                server.close(() => {
                    logger_js_1.logger.info('HTTP server closed.');
                    process.exit(0);
                });
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (err) {
        logger_js_1.logger.error('Failed to start CipherChat backend', { error: String(err) });
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map