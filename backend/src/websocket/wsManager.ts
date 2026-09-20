import { WebSocket } from 'ws';
import { AuthenticatedWebSocket, WebSocketEvent } from './types.js';
import { logger } from '../utils/logger.js';
import { conversationService } from '../services/conversationService.js';
import { DirectConversation, Group } from '../types/index.js';

export class WebSocketManager {
  // Map of userId -> Set of active WebSockets (handles multi-tab/device connections)
  private connections: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  public register(userId: string, ws: AuthenticatedWebSocket): void {
    let userSockets = this.connections.get(userId);
    if (!userSockets) {
      userSockets = new Set();
      this.connections.set(userId, userSockets);
    }
    userSockets.add(ws);
    logger.info(`WebSocket registered for user ${userId} (total user sockets: ${userSockets.size})`);
  }

  public unregister(userId: string, ws: AuthenticatedWebSocket): boolean {
    const userSockets = this.connections.get(userId);
    if (userSockets) {
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        this.connections.delete(userId);
        logger.info(`All WebSockets disconnected for user ${userId}`);
        return true; // Indicates the user is now fully offline
      }
    }
    return false;
  }

  public isUserOnline(userId: string): boolean {
    const sockets = this.connections.get(userId);
    return !!sockets && sockets.size > 0;
  }

  public getOnlineUserIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Send event payload to a specific user across all their open sockets.
   */
  public sendToUser<T>(userId: string, event: WebSocketEvent<T>): void {
    const sockets = this.connections.get(userId);
    if (!sockets) return;

    const raw = JSON.stringify(event);
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    }
  }

  /**
   * Broadcast an event to all participants of a conversation, optionally excluding a sender.
   */
  public async broadcastToConversation<T>(
    conversationId: string,
    event: WebSocketEvent<T>,
    excludeUserId?: string
  ): Promise<void> {
    const conv = await conversationService.getConversationById(conversationId);
    if (!conv) return;

    const recipientUserIds: string[] = [];

    if (conv.type === 'direct') {
      const d = conv as DirectConversation;
      // Extract both participants from direct conversation
      // The participant field has the peer, and the conversation id conv_direct_userA_userB contains both
      if (d.participant.id !== excludeUserId) {
        recipientUserIds.push(d.participant.id);
      }
      // If conversation ID contains both user IDs
      const parts = d.id.replace('conv_direct_', '').split('_');
      for (const uid of parts) {
        if (uid && uid !== excludeUserId && !recipientUserIds.includes(uid)) {
          recipientUserIds.push(uid);
        }
      }
    } else {
      const g = conv as Group;
      for (const m of g.members) {
        if (m.userId !== excludeUserId) {
          recipientUserIds.push(m.userId);
        }
      }
    }

    for (const uid of recipientUserIds) {
      this.sendToUser(uid, event);
    }
  }

  /**
   * Broadcast presence update to all connected clients.
   */
  public broadcastPresence<T>(event: WebSocketEvent<T>): void {
    const raw = JSON.stringify(event);
    for (const sockets of this.connections.values()) {
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(raw);
        }
      }
    }
  }
}

export const wsManager = new WebSocketManager();
