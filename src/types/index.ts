export interface User {
  id: string;
  username: string; // e.g. "rahul123"
  displayName: string; // e.g. "Rahul Sharma"
  email?: string; // Private, only present for self / auth, NEVER exposed in search
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  publicKeyFingerprint?: string;
}

export type ConversationType = 'direct' | 'group';

export interface GroupMember {
  userId: string;
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface DirectConversation {
  id: string;
  type: 'direct';
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
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
  lastMessage?: Message;
  unreadCount: number;
}

export type Conversation = DirectConversation | Group;

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Encrypted message structure designed for client-side end-to-end encryption.
 * The server / WebSocket receives and relays ONLY this structure.
 * It does NOT contain plaintext.
 */
export interface EncryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  header: {
    // Ephemeral public key for Double Ratchet step
    ratchetKey?: string;
    // Message sequence number within current ratchet chain
    messageCounter?: number;
    // Length of previous sending chain
    previousCounter?: number;
    // Initialization vector
    iv?: string;
    // Cryptographic algorithm suite, e.g. "AES-256-GCM" or "ChaCha20-Poly1305"
    algorithm?: string;
    // Target recipient key ID (useful in group sender keys)
    recipientKeyId?: string;
  };
  timestamp: string;
  status?: MessageStatus;
}

/**
 * Decrypted in-memory message representation strictly for UI display.
 * This is NEVER sent over the wire or stored in plaintext on the backend.
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  plaintext: string;
  timestamp: string;
  status: MessageStatus;
  isEncrypted: boolean;
  // Raw envelope preserved for verification / cryptographic inspection
  rawEnvelope?: EncryptedMessage;
  encryptionMetadata?: {
    ratchetStep?: number;
    verified: boolean;
    algorithm: string;
  };
}

export interface WebSocketEvent<T = unknown> {
  type: 'message' | 'typing' | 'presence' | 'delivery' | 'error' | 'connected';
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
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface DeliveryEventPayload {
  messageId: string;
  conversationId: string;
  status: 'delivered' | 'read';
  timestamp: string;
}

export interface CryptoSession {
  sessionId: string;
  peerUserId: string;
  state: 'uninitialized' | 'established' | 'ratcheting';
  identityKeyFingerprint: string;
  peerIdentityFingerprint: string;
  sendRatchetCounter: number;
  recvRatchetCounter: number;
  lastRatchetedAt: string;
  algorithm: string;
}
