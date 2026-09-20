import { cryptoService } from '../../crypto/CryptoService';
import {
  Conversation,
  DirectConversation,
  EncryptedMessage,
  Group,
  GroupMember,
  Message,
  User,
} from '../../types';
import { wsClient } from '../websocket/WebSocketClient';
import { authService } from './authService';
import { userService } from './userService';

const STORAGE_CONVERSATIONS_KEY = 'cipherchat_conversations';
const STORAGE_MESSAGES_KEY = 'cipherchat_messages_encrypted';

/**
 * ChatService
 *
 * Coordinates between UI actions, the cryptographic layer, and WebSocket transport.
 *
 * Strict Architecture:
 * - UI never sees raw cipher primitives.
 * - Outgoing messages: Plaintext -> CryptoService (encapsulate/ratchet) -> EncryptedMessage -> WebSocketClient.
 * - Incoming messages: WebSocketClient -> EncryptedMessage -> CryptoService (decrypt/ratchet) -> In-memory Message -> UI.
 */
class ChatService {
  private conversations: Conversation[] = [];
  private encryptedMessages: EncryptedMessage[] = [];
  private currentUserId: string | null = null;
  private messageListeners: Set<(message: Message) => void> = new Set();
  private conversationUpdateListeners: Set<(conversations: Conversation[]) => void> = new Set();

  constructor() {
    this.setupWebSocketListener();
  }

  public setUserId(userId: string): void {
    this.currentUserId = userId;
    cryptoService.setUserId(userId);
    this.loadPersistedData();
  }

  private getStorageKey(suffix: string): string {
    return `${this.currentUserId || 'guest'}_${suffix}`;
  }

  private loadPersistedData(): void {
    try {
      const storedConvs = localStorage.getItem(this.getStorageKey(STORAGE_CONVERSATIONS_KEY));
      if (storedConvs) {
        this.conversations = JSON.parse(storedConvs);
      } else {
        this.seedInitialConversations();
      }

      const storedMsgs = localStorage.getItem(this.getStorageKey(STORAGE_MESSAGES_KEY));
      if (storedMsgs) {
        this.encryptedMessages = JSON.parse(storedMsgs);
      } else {
        this.seedInitialMessages();
      }
    } catch {
      this.seedInitialConversations();
      this.seedInitialMessages();
    }
  }

  private persistData(): void {
    try {
      localStorage.setItem(
        this.getStorageKey(STORAGE_CONVERSATIONS_KEY),
        JSON.stringify(this.conversations)
      );
      localStorage.setItem(
        this.getStorageKey(STORAGE_MESSAGES_KEY),
        JSON.stringify(this.encryptedMessages)
      );
    } catch {
      // Storage quota or disabled
    }
  }

  private seedInitialConversations(): void {
    if (!this.currentUserId) return;

    // Seed conversation with Rahul Sharma for the university crypto project
    const rahulUser: User = {
      id: 'user_rahul',
      username: 'rahul123',
      displayName: 'Rahul Sharma',
      status: 'online',
      publicKeyFingerprint: '8F21 A4BC 9901 3E7D',
    };

    const priyaUser: User = {
      id: 'user_priya',
      username: 'priya_k',
      displayName: 'Priya Kapoor',
      status: 'away',
      publicKeyFingerprint: 'B391 7CD4 12EE 8840',
    };

    const directRahul: DirectConversation = {
      id: `conv_direct_${rahulUser.id}`,
      type: 'direct',
      participant: rahulUser,
      unreadCount: 0,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    };

    const currentAuth = authService.getCurrentSession()?.user;
    const currentUserForGroup: User = currentAuth || {
      id: this.currentUserId,
      username: 'current_user',
      displayName: 'You',
      status: 'online',
    };

    const cryptoGroup: Group = {
      id: 'group_crypto_project',
      type: 'group',
      name: 'Crypto Lab Team',
      description: 'University Cryptography project: E2EE protocol implementation and testing.',
      members: [
        { userId: currentUserForGroup.id, user: currentUserForGroup, role: 'admin', joinedAt: new Date().toISOString() },
        { userId: rahulUser.id, user: rahulUser, role: 'member', joinedAt: new Date().toISOString() },
        { userId: priyaUser.id, user: priyaUser, role: 'member', joinedAt: new Date().toISOString() },
      ],
      createdBy: currentUserForGroup.id,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      unreadCount: 0,
    };

    this.conversations = [directRahul, cryptoGroup];
    this.persistData();
  }

  private async seedInitialMessages(): Promise<void> {
    if (!this.currentUserId) return;

    // Initial messages in Rahul DM
    const rahulId = 'user_rahul';
    const convId = `conv_direct_${rahulId}`;

    const initialPackets: Array<{ senderId: string; text: string; offsetMinutes: number }> = [
      {
        senderId: rahulId,
        text: "Hey! Did you review the X3DH pre-key bundle specification for our assignment?",
        offsetMinutes: 45,
      },
      {
        senderId: this.currentUserId,
        text: "Yes, I'm verifying the signed pre-key signature format now. How is the Double Ratchet state progressing?",
        offsetMinutes: 30,
      },
      {
        senderId: rahulId,
        text: "Almost. I'm working on the Double Ratchet.",
        offsetMinutes: 15,
      },
    ];

    this.encryptedMessages = [];
    for (const item of initialPackets) {
      const env = await cryptoService.encryptMessage(
        convId,
        item.senderId === this.currentUserId ? rahulId : this.currentUserId,
        item.text
      );
      env.senderId = item.senderId;
      env.timestamp = new Date(Date.now() - item.offsetMinutes * 60000).toISOString();
      env.status = 'read';
      this.encryptedMessages.push(env);
    }

    this.persistData();
  }

  private setupWebSocketListener(): void {
    wsClient.onMessage(async (encryptedEnvelope: EncryptedMessage) => {
      // Ingest incoming envelope
      this.encryptedMessages.push(encryptedEnvelope);

      // Decrypt locally on client
      const plaintext = await cryptoService.decryptMessage(encryptedEnvelope);
      const senderUser = (await userService.getUserById(encryptedEnvelope.senderId)) || {
        id: encryptedEnvelope.senderId,
        username: 'unknown',
        displayName: 'User',
        status: 'online',
      };

      const decryptedMessage: Message = {
        id: encryptedEnvelope.id,
        conversationId: encryptedEnvelope.conversationId,
        senderId: encryptedEnvelope.senderId,
        sender: senderUser,
        plaintext,
        timestamp: encryptedEnvelope.timestamp,
        status: 'delivered',
        isEncrypted: true,
        rawEnvelope: encryptedEnvelope,
        encryptionMetadata: {
          ratchetStep: encryptedEnvelope.header.messageCounter,
          verified: true,
          algorithm: encryptedEnvelope.header.algorithm || 'AES-256-GCM',
        },
      };

      // Update conversation lastMessage & timestamp
      const conv = this.conversations.find(c => c.id === encryptedEnvelope.conversationId);
      if (conv) {
        conv.lastMessage = decryptedMessage;
        conv.updatedAt = encryptedEnvelope.timestamp;
        if (encryptedEnvelope.senderId !== this.currentUserId) {
          conv.unreadCount += 1;
        }
        this.persistData();
        this.emitConversations();
      }

      // Notify UI
      this.messageListeners.forEach(cb => cb(decryptedMessage));

      // Acknowledge delivery
      wsClient.sendDeliveryAck(encryptedEnvelope.id, encryptedEnvelope.conversationId, 'delivered');
    });

    wsClient.onDelivery((delivery) => {
      const msg = this.encryptedMessages.find(m => m.id === delivery.messageId);
      if (msg) {
        msg.status = delivery.status;
        this.persistData();
      }
    });
  }

  public async getConversations(): Promise<Conversation[]> {
    return [...this.conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async getConversationById(id: string): Promise<Conversation | null> {
    return this.conversations.find(c => c.id === id) || null;
  }

  public async getMessagesForConversation(conversationId: string): Promise<Message[]> {
    const rawList = this.encryptedMessages.filter(m => m.conversationId === conversationId);
    const result: Message[] = [];

    for (const env of rawList) {
      const plaintext = await cryptoService.decryptMessage(env);
      let sender = await userService.getUserById(env.senderId);
      if (!sender) {
        sender = {
          id: env.senderId,
          username: env.senderId === this.currentUserId ? 'you' : 'contact',
          displayName: env.senderId === this.currentUserId ? 'You' : 'Participant',
          status: 'online',
        };
      }

      result.push({
        id: env.id,
        conversationId: env.conversationId,
        senderId: env.senderId,
        sender,
        plaintext,
        timestamp: env.timestamp,
        status: env.status || 'delivered',
        isEncrypted: true,
        rawEnvelope: env,
        encryptionMetadata: {
          ratchetStep: env.header.messageCounter,
          verified: true,
          algorithm: env.header.algorithm || 'AES-256-GCM',
        },
      });
    }

    return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Start a 1-to-1 direct conversation with another user.
   */
  public async getOrCreateDirectConversation(peerUser: Omit<User, 'email'>): Promise<DirectConversation> {
    const existing = this.conversations.find(
      c => c.type === 'direct' && (c as DirectConversation).participant.id === peerUser.id
    ) as DirectConversation | undefined;

    if (existing) {
      return existing;
    }

    const newConv: DirectConversation = {
      id: `conv_direct_${peerUser.id}`,
      type: 'direct',
      participant: peerUser as User,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.unshift(newConv);
    this.persistData();
    this.emitConversations();
    return newConv;
  }

  /**
   * Create a new group conversation with name and member users.
   */
  public async createGroup(
    name: string,
    memberUsers: Array<Omit<User, 'email'>>,
    description?: string
  ): Promise<Group> {
    const currentUser = authService.getCurrentSession()?.user;
    if (!currentUser) throw new Error('Not authenticated');

    const groupMembers: GroupMember[] = [
      {
        userId: currentUser.id,
        user: currentUser,
        role: 'admin',
        joinedAt: new Date().toISOString(),
      },
      ...memberUsers.map(u => ({
        userId: u.id,
        user: u as User,
        role: 'member' as const,
        joinedAt: new Date().toISOString(),
      })),
    ];

    const newGroup: Group = {
      id: `group_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'group',
      name: name.trim(),
      description: description?.trim() || '',
      members: groupMembers,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
    };

    this.conversations.unshift(newGroup);
    this.persistData();
    this.emitConversations();
    return newGroup;
  }

  public async addGroupMembers(groupId: string, newMembers: Array<Omit<User, 'email'>>): Promise<Group> {
    const group = this.conversations.find(c => c.id === groupId && c.type === 'group') as Group | undefined;
    if (!group) throw new Error('Group not found');

    const existingIds = new Set(group.members.map(m => m.userId));
    for (const user of newMembers) {
      if (!existingIds.has(user.id)) {
        group.members.push({
          userId: user.id,
          user: user as User,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
      }
    }

    group.updatedAt = new Date().toISOString();
    this.persistData();
    this.emitConversations();
    return group;
  }

  public async removeGroupMember(groupId: string, memberId: string): Promise<Group> {
    const group = this.conversations.find(c => c.id === groupId && c.type === 'group') as Group | undefined;
    if (!group) throw new Error('Group not found');

    group.members = group.members.filter(m => m.userId !== memberId);
    group.updatedAt = new Date().toISOString();
    this.persistData();
    this.emitConversations();
    return group;
  }

  public async updateGroupName(groupId: string, newName: string): Promise<Group> {
    const group = this.conversations.find(c => c.id === groupId && c.type === 'group') as Group | undefined;
    if (!group) throw new Error('Group not found');

    group.name = newName.trim();
    group.updatedAt = new Date().toISOString();
    this.persistData();
    this.emitConversations();
    return group;
  }

  public async leaveGroup(groupId: string): Promise<void> {
    if (!this.currentUserId) return;
    this.conversations = this.conversations.filter(c => c.id !== groupId);
    this.persistData();
    this.emitConversations();
  }

  public markAsRead(conversationId: string): void {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.persistData();
      this.emitConversations();
    }
  }

  /**
   * Sends a message in a conversation.
   * Encrypts plaintext locally via CryptoService, sends EncryptedMessage via WebSocket.
   */
  public async sendMessage(conversationId: string, plaintext: string): Promise<Message> {
    if (!plaintext.trim()) throw new Error('Message cannot be empty');
    const currentUser = authService.getCurrentSession()?.user;
    if (!currentUser) throw new Error('Not authenticated');

    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found');

    const recipientUserId = conv.type === 'direct' ? conv.participant.id : null;

    // STEP 1: Locally encrypt plaintext into EncryptedMessage envelope
    const encryptedEnvelope = await cryptoService.encryptMessage(
      conversationId,
      recipientUserId,
      plaintext.trim()
    );

    encryptedEnvelope.status = 'sent';
    this.encryptedMessages.push(encryptedEnvelope);

    // STEP 2: Dispatch ciphertext envelope across WebSocket wire
    wsClient.sendMessage(encryptedEnvelope);

    // STEP 3: Create decrypted in-memory representation for UI
    const inMemoryMsg: Message = {
      id: encryptedEnvelope.id,
      conversationId,
      senderId: currentUser.id,
      sender: currentUser,
      plaintext: plaintext.trim(),
      timestamp: encryptedEnvelope.timestamp,
      status: 'sent',
      isEncrypted: true,
      rawEnvelope: encryptedEnvelope,
      encryptionMetadata: {
        ratchetStep: encryptedEnvelope.header.messageCounter,
        verified: true,
        algorithm: encryptedEnvelope.header.algorithm || 'AES-256-GCM',
      },
    };

    conv.lastMessage = inMemoryMsg;
    conv.updatedAt = inMemoryMsg.timestamp;
    this.persistData();
    this.emitConversations();

    // Trigger simulated peer replies in dev sandbox mode if chatting with simulated contact
    if (conv.type === 'direct' && conv.participant.username === 'rahul123') {
      this.triggerSimulatedRahulReply(conv.id, conv.participant.id, plaintext.trim());
    }

    return inMemoryMsg;
  }

  private triggerSimulatedRahulReply(convId: string, rahulId: string, userText: string): void {
    // Only simulate if not connected to a live custom WebSocket server
    if (wsClient.getStatus() === 'connected') return;

    // Dispatch typing event after 800ms
    setTimeout(() => {
      wsClient.emitTyping({
        conversationId: convId,
        userId: rahulId,
        username: 'rahul123',
        isTyping: true,
      });
    }, 800);

    // Send realistic response after 2200ms
    setTimeout(async () => {
      wsClient.emitTyping({
        conversationId: convId,
        userId: rahulId,
        username: 'rahul123',
        isTyping: false,
      });

      let replyText = "Almost. I'm working on the Double Ratchet.";
      const lower = userText.toLowerCase();
      if (lower.includes('hello') || lower.includes('hey') || lower.includes('hi')) {
        replyText = "Hey! Did you test the encrypted envelope packaging on the client?";
      } else if (lower.includes('x3dh') || lower.includes('diffie')) {
        replyText = "The X3DH handshake handles the asynchronous pre-key bundle retrieval. Once established, the Double Ratchet takes over message keys.";
      } else if (lower.includes('key') || lower.includes('fingerprint')) {
        replyText = "Check the Security settings tab — you can inspect the identity key fingerprints and active ratchet counter steps!";
      }

      const replyEnvelope = await cryptoService.encryptMessage(convId, this.currentUserId, replyText);
      replyEnvelope.senderId = rahulId;
      replyEnvelope.timestamp = new Date().toISOString();
      replyEnvelope.status = 'delivered';

      wsClient.emitMessage(replyEnvelope);
    }, 2400);
  }

  private emitConversations(): void {
    this.conversationUpdateListeners.forEach(cb => cb([...this.conversations]));
  }

  public onNewMessage(callback: (msg: Message) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  public onConversationsChange(callback: (convs: Conversation[]) => void): () => void {
    this.conversationUpdateListeners.add(callback);
    return () => this.conversationUpdateListeners.delete(callback);
  }
}

export const chatService = new ChatService();
