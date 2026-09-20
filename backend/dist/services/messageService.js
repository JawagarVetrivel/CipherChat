"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = exports.MessageService = void 0;
const client_js_1 = require("../database/client.js");
const logger_js_1 = require("../utils/logger.js");
class MessageService {
    /**
     * Persists an incoming encrypted message envelope.
     * STRICT DUMB-PIPE INVARIANT: Ciphertext and header are treated as opaque blobs.
     * No plaintext is ever accessed, decrypted, or logged.
     */
    async storeEncryptedMessage(dto) {
        if (!dto.ciphertext) {
            throw new Error('Encrypted payload (ciphertext) is required.');
        }
        if (!dto.conversationId) {
            throw new Error('Conversation identifier is required.');
        }
        const message = {
            id: dto.id || `msg_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
            conversationId: dto.conversationId,
            senderId: dto.senderId,
            ciphertext: dto.ciphertext,
            header: dto.header || {},
            timestamp: dto.timestamp || new Date().toISOString(),
            deliveryStatus: 'sent',
            status: 'sent',
        };
        await client_js_1.db.saveMessage(message);
        logger_js_1.logger.info(`Stored encrypted envelope [${message.id}] in conversation [${message.conversationId}]`);
        return message;
    }
    /**
     * Returns encrypted envelopes for a conversation.
     */
    async getMessagesForConversation(conversationId) {
        return client_js_1.db.getMessagesByConversation(conversationId);
    }
    /**
     * Updates message delivery receipt status ('delivered' | 'read').
     */
    async updateDeliveryStatus(messageId, status) {
        const updated = await client_js_1.db.updateMessageStatus(messageId, status);
        if (updated) {
            logger_js_1.logger.info(`Updated message [${messageId}] delivery status to "${status}"`);
        }
        return updated;
    }
    /**
     * Offline Message Retrieval:
     * Retrieves pending encrypted messages for a user when they reconnect.
     */
    async getPendingOfflineMessages(userId) {
        return client_js_1.db.getPendingMessagesForUser(userId);
    }
}
exports.MessageService = MessageService;
exports.messageService = new MessageService();
//# sourceMappingURL=messageService.js.map