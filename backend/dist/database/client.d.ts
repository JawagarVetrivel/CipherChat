import { SupabaseClient } from '@supabase/supabase-js';
import { User, Conversation, EncryptedMessage, PublicKeyRecord, SessionRecord, SafeUser } from '../types/index.js';
declare let supabaseClient: SupabaseClient | null;
export { supabaseClient };
/**
 * Unified Database Store
 * Implements the normalized database model. If Supabase is connected, maps to Supabase.
 * Otherwise, uses an in-memory repository seeded with default users and test conversations.
 */
declare class DatabaseStore {
    private users;
    private conversations;
    private messages;
    private publicKeys;
    private sessions;
    private initialized;
    init(): Promise<void>;
    findUserById(id: string): Promise<User | null>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserByUsername(username: string): Promise<User | null>;
    createUser(user: User): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User | null>;
    searchUsers(query: string, excludeUserId?: string): Promise<SafeUser[]>;
    getConversationsForUser(userId: string): Promise<Conversation[]>;
    getConversationById(id: string): Promise<Conversation | null>;
    saveConversation(conv: Conversation): Promise<Conversation>;
    deleteConversation(id: string): Promise<boolean>;
    getMessagesByConversation(conversationId: string): Promise<EncryptedMessage[]>;
    saveMessage(message: EncryptedMessage): Promise<EncryptedMessage>;
    updateMessageStatus(messageId: string, status: EncryptedMessage['deliveryStatus']): Promise<EncryptedMessage | null>;
    getPendingMessagesForUser(userId: string): Promise<EncryptedMessage[]>;
    savePublicKey(key: PublicKeyRecord): Promise<PublicKeyRecord>;
    getPublicKeysForUser(userId: string): Promise<PublicKeyRecord[]>;
    saveSession(session: SessionRecord): Promise<void>;
    deleteSession(id: string): Promise<void>;
    private mapDbUser;
}
export declare const db: DatabaseStore;
