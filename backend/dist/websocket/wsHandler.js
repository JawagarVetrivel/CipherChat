"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocketServer = setupWebSocketServer;
const ws_1 = require("ws");
const authService_js_1 = require("../services/authService.js");
const userService_js_1 = require("../services/userService.js");
const messageService_js_1 = require("../services/messageService.js");
const conversationService_js_1 = require("../services/conversationService.js");
const logger_js_1 = require("../utils/logger.js");
const wsManager_js_1 = require("./wsManager.js");
function setupWebSocketServer(httpServer) {
    const wss = new ws_1.WebSocketServer({ noServer: true });
    // Handle HTTP upgrade to WebSocket
    httpServer.on('upgrade', async (request, socket, head) => {
        const parsedUrl = new URL(request.url || '', 'http://localhost');
        const pathname = parsedUrl.pathname;
        if (pathname !== '/ws' && pathname !== '/ws/') {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            socket.destroy();
            return;
        }
        // Extract authentication token from query string or Authorization header
        const token = parsedUrl.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            logger_js_1.logger.warn('WebSocket upgrade rejected: No authentication token provided.');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        try {
            const { userId } = authService_js_1.authService.verifyToken(token);
            const user = await userService_js_1.userService.getUserById(userId);
            if (!user) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            wss.handleUpgrade(request, socket, head, (ws) => {
                const authWs = ws;
                authWs.userId = userId;
                authWs.user = {
                    ...user,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };
                authWs.isAlive = true;
                wss.emit('connection', authWs, request);
            });
        }
        catch (err) {
            logger_js_1.logger.warn('WebSocket upgrade rejected: Invalid token.', { error: String(err) });
            socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
            socket.destroy();
        }
    });
    // Connection established
    wss.on('connection', async (ws) => {
        const userId = ws.userId;
        const user = ws.user;
        wsManager_js_1.wsManager.register(userId, ws);
        await userService_js_1.userService.updatePresence(userId, 'online');
        logger_js_1.logger.info(`WebSocket connection established for @${user.username} (${userId})`);
        // 1. Send connection confirmation to client
        ws.send(JSON.stringify({
            type: 'connected',
            payload: {
                userId,
                status: 'connected',
                timestamp: new Date().toISOString(),
            },
        }));
        // 2. Broadcast presence update to contacts
        wsManager_js_1.wsManager.broadcastPresence({
            type: 'presence',
            payload: {
                userId,
                status: 'online',
            },
        });
        wsManager_js_1.wsManager.broadcastPresence({
            type: 'presence.update',
            payload: {
                userId,
                status: 'online',
            },
        });
        // 3. OFFLINE MESSAGES FLUSH
        // Automatically retrieve any pending messages sent while user was offline
        try {
            const pendingMessages = await messageService_js_1.messageService.getPendingOfflineMessages(userId);
            if (pendingMessages.length > 0) {
                logger_js_1.logger.info(`Flushing ${pendingMessages.length} pending offline encrypted messages to user ${userId}`);
                for (const msg of pendingMessages) {
                    // Deliver encrypted packet unchanged
                    ws.send(JSON.stringify({
                        type: 'message',
                        payload: msg,
                    }));
                    // Update status to delivered
                    await messageService_js_1.messageService.updateDeliveryStatus(msg.id, 'delivered');
                }
            }
        }
        catch (err) {
            logger_js_1.logger.error('Failed to flush offline messages', { error: String(err) });
        }
        // Heartbeat ping-pong
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        // Handle incoming client messages
        ws.on('message', async (raw) => {
            try {
                const event = JSON.parse(raw.toString());
                await handleIncomingEvent(ws, event);
            }
            catch (err) {
                logger_js_1.logger.warn('Failed to parse incoming WebSocket message', { error: String(err) });
            }
        });
        // Disconnect handling
        ws.on('close', async () => {
            const isCompletelyOffline = wsManager_js_1.wsManager.unregister(userId, ws);
            if (isCompletelyOffline) {
                const now = new Date().toISOString();
                await userService_js_1.userService.updatePresence(userId, 'offline');
                logger_js_1.logger.info(`User @${user.username} is now offline.`);
                const presenceEvent = {
                    type: 'presence',
                    payload: {
                        userId,
                        status: 'offline',
                        lastSeen: now,
                    },
                };
                wsManager_js_1.wsManager.broadcastPresence(presenceEvent);
                wsManager_js_1.wsManager.broadcastPresence({
                    ...presenceEvent,
                    type: 'presence.update',
                });
            }
        });
        ws.on('error', (err) => {
            logger_js_1.logger.error('WebSocket connection error', { userId, error: String(err) });
        });
    });
    // Heartbeat interval: detect dead sockets every 30s
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((wsClient) => {
            const authWs = wsClient;
            if (authWs.isAlive === false) {
                authWs.terminate();
                return;
            }
            authWs.isAlive = false;
            authWs.ping();
        });
    }, 30000);
    wss.on('close', () => {
        clearInterval(heartbeatInterval);
    });
    return wss;
}
/**
 * Event Router for WebSocket Protocol
 */
async function handleIncomingEvent(ws, event) {
    const userId = ws.userId;
    const user = ws.user;
    switch (event.type) {
        case 'ping': {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
        }
        // Encrypted message send: handles both "message" and "message.send"
        case 'message':
        case 'message.send': {
            const envelope = event.payload;
            if (!envelope || !envelope.conversationId || !envelope.ciphertext) {
                return;
            }
            // 1. Authorization check: sender must be in the conversation
            const conversation = await conversationService_js_1.conversationService.getConversationById(envelope.conversationId);
            if (!conversation) {
                ws.send(JSON.stringify({
                    type: 'error',
                    payload: { message: 'Conversation not found.' },
                }));
                return;
            }
            let isMember = false;
            if (conversation.type === 'direct') {
                const d = conversation;
                const pIds = d.participantIds || (d.id.startsWith('conv_direct_') ? d.id.replace('conv_direct_', '').split('_').filter(Boolean) : []);
                isMember = pIds.includes(userId) || d.participant.id === userId || d.id.includes(userId);
            }
            else {
                const g = conversation;
                isMember = g.members.some((m) => m.userId === userId);
            }
            if (!isMember) {
                ws.send(JSON.stringify({
                    type: 'error',
                    payload: { message: 'Unauthorized: Not a member of this conversation.' },
                }));
                return;
            }
            // 2. Persist opaque encrypted envelope in database
            const storedMessage = await messageService_js_1.messageService.storeEncryptedMessage({
                id: envelope.id,
                conversationId: envelope.conversationId,
                senderId: userId,
                ciphertext: envelope.ciphertext,
                header: envelope.header,
                timestamp: envelope.timestamp || new Date().toISOString(),
            });
            // 3. Dumb-pipe relay: Forward unchanged encrypted packet to recipient(s)
            await wsManager_js_1.wsManager.broadcastToConversation(envelope.conversationId, {
                type: 'message',
                payload: storedMessage,
            }, userId // Exclude sender
            );
            // Also emit compatibility event "message.receive"
            await wsManager_js_1.wsManager.broadcastToConversation(envelope.conversationId, {
                type: 'message.receive',
                payload: storedMessage,
            }, userId);
            // 4. Send delivery confirmation back to sender
            const deliveryAck = {
                messageId: storedMessage.id,
                conversationId: storedMessage.conversationId,
                status: 'delivered',
                timestamp: new Date().toISOString(),
            };
            ws.send(JSON.stringify({
                type: 'delivery',
                payload: deliveryAck,
            }));
            ws.send(JSON.stringify({
                type: 'message.delivered',
                payload: deliveryAck,
            }));
            break;
        }
        // Typing status events: handles "typing", "typing.start", "typing.stop"
        case 'typing':
        case 'typing.start':
        case 'typing.stop': {
            const payload = event.payload;
            if (!payload || !payload.conversationId)
                return;
            const isTyping = event.type === 'typing.start' ? true : event.type === 'typing.stop' ? false : !!payload.isTyping;
            const typingEvent = {
                conversationId: payload.conversationId,
                userId,
                username: user.username,
                isTyping,
            };
            await wsManager_js_1.wsManager.broadcastToConversation(payload.conversationId, {
                type: 'typing',
                payload: typingEvent,
            }, userId);
            break;
        }
        // Delivery & Read acknowledgements: handles "delivery", "message.delivered", "message.read"
        case 'delivery':
        case 'message.delivered':
        case 'message.read': {
            const payload = event.payload;
            if (!payload || !payload.messageId)
                return;
            const status = event.type === 'message.read' ? 'read' : payload.status || 'delivered';
            await messageService_js_1.messageService.updateDeliveryStatus(payload.messageId, status);
            // Relay delivery status to conversation members
            if (payload.conversationId) {
                await wsManager_js_1.wsManager.broadcastToConversation(payload.conversationId, {
                    type: 'delivery',
                    payload: {
                        messageId: payload.messageId,
                        conversationId: payload.conversationId,
                        status,
                        timestamp: new Date().toISOString(),
                    },
                }, userId);
            }
            break;
        }
        default:
            logger_js_1.logger.debug(`Unhandled WebSocket event type: ${event.type}`);
            break;
    }
}
//# sourceMappingURL=wsHandler.js.map