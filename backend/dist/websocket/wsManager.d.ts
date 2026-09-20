import { AuthenticatedWebSocket, WebSocketEvent } from './types.js';
export declare class WebSocketManager {
    private connections;
    register(userId: string, ws: AuthenticatedWebSocket): void;
    unregister(userId: string, ws: AuthenticatedWebSocket): boolean;
    isUserOnline(userId: string): boolean;
    getOnlineUserIds(): string[];
    /**
     * Send event payload to a specific user across all their open sockets.
     */
    sendToUser<T>(userId: string, event: WebSocketEvent<T>): void;
    /**
     * Broadcast an event to all participants of a conversation, optionally excluding a sender.
     */
    broadcastToConversation<T>(conversationId: string, event: WebSocketEvent<T>, excludeUserId?: string): Promise<void>;
    /**
     * Broadcast presence update to all connected clients.
     */
    broadcastPresence<T>(event: WebSocketEvent<T>): void;
}
export declare const wsManager: WebSocketManager;
