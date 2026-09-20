import { db } from '../database/client.js';
import { EncryptedMessage, MessageDeliveryStatus } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface SendMessageDto {
  id?: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  header: EncryptedMessage['header'];
  timestamp?: string;
}

export class MessageService {
  /**
   * Persists an incoming encrypted message envelope.
   * STRICT DUMB-PIPE INVARIANT: Ciphertext and header are treated as opaque blobs.
   * No plaintext is ever accessed, decrypted, or logged.
   */
  public async storeEncryptedMessage(dto: SendMessageDto): Promise<EncryptedMessage> {
    if (!dto.ciphertext) {
      throw new Error('Encrypted payload (ciphertext) is required.');
    }
    if (!dto.conversationId) {
      throw new Error('Conversation identifier is required.');
    }

    const message: EncryptedMessage = {
      id: dto.id || `msg_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
      conversationId: dto.conversationId,
      senderId: dto.senderId,
      ciphertext: dto.ciphertext,
      header: dto.header || {},
      timestamp: dto.timestamp || new Date().toISOString(),
      deliveryStatus: 'sent',
      status: 'sent',
    };

    await db.saveMessage(message);
    logger.info(`Stored encrypted envelope [${message.id}] in conversation [${message.conversationId}]`);
    return message;
  }

  /**
   * Returns encrypted envelopes for a conversation.
   */
  public async getMessagesForConversation(conversationId: string): Promise<EncryptedMessage[]> {
    return db.getMessagesByConversation(conversationId);
  }

  /**
   * Updates message delivery receipt status ('delivered' | 'read').
   */
  public async updateDeliveryStatus(
    messageId: string,
    status: MessageDeliveryStatus
  ): Promise<EncryptedMessage | null> {
    const updated = await db.updateMessageStatus(messageId, status);
    if (updated) {
      logger.info(`Updated message [${messageId}] delivery status to "${status}"`);
    }
    return updated;
  }

  /**
   * Offline Message Retrieval:
   * Retrieves pending encrypted messages for a user when they reconnect.
   */
  public async getPendingOfflineMessages(userId: string): Promise<EncryptedMessage[]> {
    return db.getPendingMessagesForUser(userId);
  }
}

export const messageService = new MessageService();
