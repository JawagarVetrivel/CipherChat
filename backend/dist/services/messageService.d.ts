import { EncryptedMessage, MessageDeliveryStatus } from '../types/index.js';
export interface SendMessageDto {
    id?: string;
    conversationId: string;
    senderId: string;
    ciphertext: string;
    header: EncryptedMessage['header'];
    timestamp?: string;
}
export declare class MessageService {
    /**
     * Persists an incoming encrypted message envelope.
     * STRICT DUMB-PIPE INVARIANT: Ciphertext and header are treated as opaque blobs.
     * No plaintext is ever accessed, decrypted, or logged.
     */
    storeEncryptedMessage(dto: SendMessageDto): Promise<EncryptedMessage>;
    /**
     * Returns encrypted envelopes for a conversation.
     */
    getMessagesForConversation(conversationId: string): Promise<EncryptedMessage[]>;
    /**
     * Updates message delivery receipt status ('delivered' | 'read').
     */
    updateDeliveryStatus(messageId: string, status: MessageDeliveryStatus): Promise<EncryptedMessage | null>;
    /**
     * Offline Message Retrieval:
     * Retrieves pending encrypted messages for a user when they reconnect.
     */
    getPendingOfflineMessages(userId: string): Promise<EncryptedMessage[]>;
}
export declare const messageService: MessageService;
