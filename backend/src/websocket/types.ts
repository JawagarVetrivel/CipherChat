import { WebSocket } from 'ws';
import { AuthUser, EncryptedMessage, MessageDeliveryStatus, UserStatus } from '../types/index.js';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  user?: AuthUser;
  isAlive?: boolean;
}

export interface WebSocketEvent<T = unknown> {
  type: string;
  payload: T;
}

export interface TypingEventPayload {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface PresenceEventPayload {
  userId: string;
  status: UserStatus;
  lastSeen?: string;
}

export interface DeliveryEventPayload {
  messageId: string;
  conversationId: string;
  status: MessageDeliveryStatus;
  timestamp: string;
}
