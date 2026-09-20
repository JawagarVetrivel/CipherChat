import { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
export declare function setupWebSocketServer(httpServer: HttpServer): WebSocketServer;
