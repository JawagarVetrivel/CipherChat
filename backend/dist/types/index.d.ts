export type UserStatus = 'online' | 'offline' | 'away';
export interface User {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    passwordHash?: string;
    status: UserStatus;
    lastSeen?: string;
    publicKeyFingerprint?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}
export type SafeUser = Omit<User, 'email' | 'passwordHash'>;
export type AuthUser = Omit<User, 'passwordHash'>;
export type ConversationType = 'direct' | 'group';
export interface GroupMember {
    userId: string;
    user: SafeUser;
    role: 'admin' | 'member';
    unreadCount?: number;
    joinedAt: string;
}
export interface DirectConversation {
    id: string;
    type: 'direct';
    participant: SafeUser;
    lastMessage?: EncryptedMessage;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface Group {
    id: string;
    type: 'group';
    name: string;
    description?: string;
    avatarUrl?: string;
    members: GroupMember[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastMessage?: EncryptedMessage;
    unreadCount: number;
}
export type Conversation = DirectConversation | Group;
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
/**
 * Encrypted message structure designed for client-side end-to-end encryption.
 * The backend receives, stores, and relays ONLY this structure.
 * Plaintext is NEVER received, processed, or stored.
 */
export interface EncryptedMessage {
    id: string;
    conversationId: string;
    senderId: string;
    ciphertext: string;
    header: {
        ratchetKey?: string;
        messageCounter?: number;
        previousCounter?: number;
        iv?: string;
        algorithm?: string;
        recipientKeyId?: string;
        [key: string]: unknown;
    };
    timestamp: string;
    deliveryStatus: MessageDeliveryStatus;
    status?: MessageDeliveryStatus;
}
export interface PublicKeyRecord {
    id: string;
    userId: string;
    keyType: 'identity' | 'signed_prekey' | 'one_time_prekey';
    publicKey: string;
    isActive: boolean;
    createdAt: string;
    expiresAt?: string;
}
export interface SessionRecord {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    createdAt: string;
}
