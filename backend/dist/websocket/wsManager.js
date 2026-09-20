"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsManager = exports.WebSocketManager = void 0;
const ws_1 = require("ws");
const logger_js_1 = require("../utils/logger.js");
const conversationService_js_1 = require("../services/conversationService.js");
class WebSocketManager {
    // Map of userId -> Set of active WebSockets (handles multi-tab/device connections)
    connections = new Map();
    register(userId, ws) {
        let userSockets = this.connections.get(userId);
        if (!userSockets) {
            userSockets = new Set();
            this.connections.set(userId, userSockets);
        }
        userSockets.add(ws);
        logger_js_1.logger.info(`WebSocket registered for user ${userId} (total user sockets: ${userSockets.size})`);
    }
    unregister(userId, ws) {
        const userSockets = this.connections.get(userId);
        if (userSockets) {
            userSockets.delete(ws);
            if (userSockets.size === 0) {
                this.connections.delete(userId);
                logger_js_1.logger.info(`All WebSockets disconnected for user ${userId}`);
                return true; // Indicates the user is now fully offline
            }
        }
        return false;
    }
    isUserOnline(userId) {
        const sockets = this.connections.get(userId);
        return !!sockets && sockets.size > 0;
    }
    getOnlineUserIds() {
        return Array.from(this.connections.keys());
    }
    /**
     * Send event payload to a specific user across all their open sockets.
     */
    sendToUser(userId, event) {
        const sockets = this.connections.get(userId);
        if (!sockets)
            return;
        const raw = JSON.stringify(event);
        for (const ws of sockets) {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(raw);
            }
        }
    }
    /**
     * Broadcast an event to all participants of a conversation, optionally excluding a sender.
     */
    async broadcastToConversation(conversationId, event, excludeUserId) {
        const conv = await conversationService_js_1.conversationService.getConversationById(conversationId);
        if (!conv)
            return;
        const recipientUserIds = [];
        if (conv.type === 'direct') {
            const d = conv;
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
        }
        else {
            const g = conv;
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
    broadcastPresence(event) {
        const raw = JSON.stringify(event);
        for (const sockets of this.connections.values()) {
            for (const ws of sockets) {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.send(raw);
                }
            }
        }
    }
}
exports.WebSocketManager = WebSocketManager;
exports.wsManager = new WebSocketManager();
//# sourceMappingURL=wsManager.js.map