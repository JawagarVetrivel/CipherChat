import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';
import { messageService } from '../services/messageService.js';
import { conversationService } from '../services/conversationService.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedWebSocket, WebSocketEvent, TypingEventPayload, DeliveryEventPayload } from './types.js';
import { wsManager } from './wsManager.js';
import { DirectConversation, EncryptedMessage, Group } from '../types/index.js';

export function setupWebSocketServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

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
      logger.warn('WebSocket upgrade rejected: No authentication token provided.');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      const { userId } = authService.verifyToken(token);
      const user = await userService.getUserById(userId);

      if (!user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        authWs.userId = userId;
        authWs.user = {
          ...user,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        authWs.isAlive = true;
        wss.emit('connection', authWs, request);
      });
    } catch (err) {
      logger.warn('WebSocket upgrade rejected: Invalid token.', { error: String(err) });
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
    }
  });

  // Connection established
  wss.on('connection', async (ws: AuthenticatedWebSocket) => {
    const userId = ws.userId!;
    const user = ws.user!;

    wsManager.register(userId, ws);
    await userService.updatePresence(userId, 'online');

    logger.info(`WebSocket connection established for @${user.username} (${userId})`);

    // 1. Send connection confirmation to client
    ws.send(
      JSON.stringify({
        type: 'connected',
        payload: {
          userId,
          status: 'connected',
          timestamp: new Date().toISOString(),
        },
      })
    );

    // 2. Broadcast presence update to contacts
    wsManager.broadcastPresence({
      type: 'presence',
      payload: {
        userId,
        status: 'online',
      },
    });
    wsManager.broadcastPresence({
      type: 'presence.update',
      payload: {
        userId,
        status: 'online',
      },
    });

    // 3. OFFLINE MESSAGES FLUSH
    // Automatically retrieve any pending messages sent while user was offline
    try {
      const pendingMessages = await messageService.getPendingOfflineMessages(userId);
      if (pendingMessages.length > 0) {
        logger.info(`Flushing ${pendingMessages.length} pending offline encrypted messages to user ${userId}`);
        for (const msg of pendingMessages) {
          // Deliver encrypted packet unchanged
          ws.send(
            JSON.stringify({
              type: 'message',
              payload: msg,
            })
          );
          // Update status to delivered
          await messageService.updateDeliveryStatus(msg.id, 'delivered');
        }
      }
    } catch (err) {
      logger.error('Failed to flush offline messages', { error: String(err) });
    }

    // Heartbeat ping-pong
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle incoming client messages
    ws.on('message', async (raw: string) => {
      try {
        const event: WebSocketEvent = JSON.parse(raw.toString());
        await handleIncomingEvent(ws, event);
      } catch (err) {
        logger.warn('Failed to parse incoming WebSocket message', { error: String(err) });
      }
    });

    // Disconnect handling
    ws.on('close', async () => {
      const isCompletelyOffline = wsManager.unregister(userId, ws);

      if (isCompletelyOffline) {
        const now = new Date().toISOString();
        await userService.updatePresence(userId, 'offline');

        logger.info(`User @${user.username} is now offline.`);

        const presenceEvent = {
          type: 'presence',
          payload: {
            userId,
            status: 'offline' as const,
            lastSeen: now,
          },
        };
        wsManager.broadcastPresence(presenceEvent);
        wsManager.broadcastPresence({
          ...presenceEvent,
          type: 'presence.update',
        });
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket connection error', { userId, error: String(err) });
    });
  });

  // Heartbeat interval: detect dead sockets every 30s
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((wsClient) => {
      const authWs = wsClient as AuthenticatedWebSocket;
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
async function handleIncomingEvent(ws: AuthenticatedWebSocket, event: WebSocketEvent): Promise<void> {
  const userId = ws.userId!;
  const user = ws.user!;

  switch (event.type) {
    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    }

    // Encrypted message send: handles both "message" and "message.send"
    case 'message':
    case 'message.send': {
      const envelope = event.payload as EncryptedMessage;
      if (!envelope || !envelope.conversationId || !envelope.ciphertext) {
        return;
      }

      // 1. Authorization check: sender must be in the conversation
      const conversation = await conversationService.getConversationById(envelope.conversationId);
      if (!conversation) {
        ws.send(
          JSON.stringify({
            type: 'error',
            payload: { message: 'Conversation not found.' },
          })
        );
        return;
      }

      let isMember = false;
      if (conversation.type === 'direct') {
        const d = conversation as DirectConversation;
        const pIds = d.participantIds || (d.id.startsWith('conv_direct_') ? d.id.replace('conv_direct_', '').split('_').filter(Boolean) : []);
        isMember = pIds.includes(userId) || d.participant.id === userId || d.id.includes(userId);
      } else {
        const g = conversation as Group;
        isMember = g.members.some((m) => m.userId === userId);
      }

      if (!isMember) {
        ws.send(
          JSON.stringify({
            type: 'error',
            payload: { message: 'Unauthorized: Not a member of this conversation.' },
          })
        );
        return;
      }

      // 2. Persist opaque encrypted envelope in database
      const storedMessage = await messageService.storeEncryptedMessage({
        id: envelope.id,
        conversationId: envelope.conversationId,
        senderId: userId,
        ciphertext: envelope.ciphertext,
        header: envelope.header,
        timestamp: envelope.timestamp || new Date().toISOString(),
      });

      // 3. Dumb-pipe relay: Forward unchanged encrypted packet to recipient(s)
      await wsManager.broadcastToConversation(
        envelope.conversationId,
        {
          type: 'message',
          payload: storedMessage,
        },
        userId // Exclude sender
      );

      // Also emit compatibility event "message.receive"
      await wsManager.broadcastToConversation(
        envelope.conversationId,
        {
          type: 'message.receive',
          payload: storedMessage,
        },
        userId
      );

      // 4. Send delivery confirmation back to sender
      const deliveryAck: DeliveryEventPayload = {
        messageId: storedMessage.id,
        conversationId: storedMessage.conversationId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      };

      ws.send(
        JSON.stringify({
          type: 'delivery',
          payload: deliveryAck,
        })
      );
      ws.send(
        JSON.stringify({
          type: 'message.delivered',
          payload: deliveryAck,
        })
      );
      break;
    }

    // Typing status events: handles "typing", "typing.start", "typing.stop"
    case 'typing':
    case 'typing.start':
    case 'typing.stop': {
      const payload = event.payload as Partial<TypingEventPayload>;
      if (!payload || !payload.conversationId) return;

      const isTyping = event.type === 'typing.start' ? true : event.type === 'typing.stop' ? false : !!payload.isTyping;

      const typingEvent: TypingEventPayload = {
        conversationId: payload.conversationId,
        userId,
        username: user.username,
        isTyping,
      };

      await wsManager.broadcastToConversation(
        payload.conversationId,
        {
          type: 'typing',
          payload: typingEvent,
        },
        userId
      );
      break;
    }

    // Delivery & Read acknowledgements: handles "delivery", "message.delivered", "message.read"
    case 'delivery':
    case 'message.delivered':
    case 'message.read': {
      const payload = event.payload as Partial<DeliveryEventPayload>;
      if (!payload || !payload.messageId) return;

      const status = event.type === 'message.read' ? 'read' : payload.status || 'delivered';
      await messageService.updateDeliveryStatus(payload.messageId, status);

      // Relay delivery status to conversation members
      if (payload.conversationId) {
        await wsManager.broadcastToConversation(
          payload.conversationId,
          {
            type: 'delivery',
            payload: {
              messageId: payload.messageId,
              conversationId: payload.conversationId,
              status,
              timestamp: new Date().toISOString(),
            },
          },
          userId
        );
      }
      break;
    }

    default:
      logger.debug(`Unhandled WebSocket event type: ${event.type}`);
      break;
  }
}
