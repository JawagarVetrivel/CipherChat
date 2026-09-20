import bcrypt from 'bcryptjs';
import { User, Conversation, GroupMember, EncryptedMessage } from '../types/index.js';

export interface SeedData {
  users: User[];
  conversations: Conversation[];
  messages: EncryptedMessage[];
}

export async function getSeedData(): Promise<SeedData> {
  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  const userRahul: User = {
    id: 'a1111111-1111-4111-a111-111111111111',
    username: 'rahul123',
    displayName: 'Rahul Sharma',
    email: 'rahul@university.edu',
    passwordHash,
    status: 'online',
    lastSeen: now.toISOString(),
    publicKeyFingerprint: '8F21 A4BC 9901 3E7D',
    createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    updatedAt: now.toISOString(),
  };

  const userPriya: User = {
    id: 'b2222222-2222-4222-b222-222222222222',
    username: 'priya_k',
    displayName: 'Priya Kapoor',
    email: 'priya@university.edu',
    passwordHash,
    status: 'away',
    lastSeen: new Date(now.getTime() - 3600000).toISOString(),
    publicKeyFingerprint: 'B391 7CD4 12EE 8840',
    createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    updatedAt: now.toISOString(),
  };

  const userProf: User = {
    id: 'c3333333-3333-4333-c333-333333333333',
    username: 'crypto_prof',
    displayName: 'Prof. Alan Vance',
    email: 'vance@university.edu',
    passwordHash,
    status: 'offline',
    lastSeen: new Date(now.getTime() - 86400000).toISOString(),
    publicKeyFingerprint: '44FA 1982 CD30 67BA',
    createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    updatedAt: now.toISOString(),
  };

  const userAlex: User = {
    id: 'd4444444-4444-4444-d444-444444444444',
    username: 'alex_c',
    displayName: 'Alex Chen',
    email: 'alex@university.edu',
    passwordHash,
    status: 'online',
    lastSeen: now.toISOString(),
    publicKeyFingerprint: '6E09 82F1 55AB 2994',
    createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    updatedAt: now.toISOString(),
  };

  // Sample group conversation: Cryptography Project
  const groupMembers: GroupMember[] = [
    {
      userId: userRahul.id,
      user: {
        id: userRahul.id,
        username: userRahul.username,
        displayName: userRahul.displayName,
        status: userRahul.status,
        lastSeen: userRahul.lastSeen,
        publicKeyFingerprint: userRahul.publicKeyFingerprint,
        createdAt: userRahul.createdAt,
        updatedAt: userRahul.updatedAt,
      },
      role: 'admin',
      unreadCount: 0,
      joinedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      userId: userPriya.id,
      user: {
        id: userPriya.id,
        username: userPriya.username,
        displayName: userPriya.displayName,
        status: userPriya.status,
        lastSeen: userPriya.lastSeen,
        publicKeyFingerprint: userPriya.publicKeyFingerprint,
        createdAt: userPriya.createdAt,
        updatedAt: userPriya.updatedAt,
      },
      role: 'member',
      unreadCount: 0,
      joinedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      userId: userAlex.id,
      user: {
        id: userAlex.id,
        username: userAlex.username,
        displayName: userAlex.displayName,
        status: userAlex.status,
        lastSeen: userAlex.lastSeen,
        publicKeyFingerprint: userAlex.publicKeyFingerprint,
        createdAt: userAlex.createdAt,
        updatedAt: userAlex.updatedAt,
      },
      role: 'member',
      unreadCount: 0,
      joinedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
  ];

  const cryptoGroup: Conversation = {
    id: 'e5555555-5555-4555-e555-555555555555',
    type: 'group',
    name: 'Crypto Lab Team',
    description: 'University Cryptography project: E2EE protocol implementation and testing.',
    members: groupMembers,
    createdBy: userRahul.id,
    createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    updatedAt: new Date(now.getTime() - 1800000).toISOString(),
    unreadCount: 0,
  };

  // Direct conversation between Rahul and Priya
  const directRahulPriyaId = `conv_direct_${[userRahul.id, userPriya.id].sort().join('_')}`;
  const directRahulPriya: Conversation = {
    id: directRahulPriyaId,
    type: 'direct',
    participant: {
      id: userPriya.id,
      username: userPriya.username,
      displayName: userPriya.displayName,
      status: userPriya.status,
      lastSeen: userPriya.lastSeen,
      publicKeyFingerprint: userPriya.publicKeyFingerprint,
      createdAt: userPriya.createdAt,
      updatedAt: userPriya.updatedAt,
    },
    participantIds: [userRahul.id, userPriya.id],
    unreadCount: 0,
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
    updatedAt: new Date(now.getTime() - 900000).toISOString(),
  };

  // Seed encrypted envelopes (Zero-Knowledge: strictly opaque ciphertext and ratchet header)
  const initialEncryptedMessages: EncryptedMessage[] = [
    {
      id: 'm1111111-1111-4111-m111-111111111111',
      conversationId: directRahulPriya.id,
      senderId: userRahul.id,
      ciphertext: 'enc:v1:SGV5ISBEaWQgeW91IHJldmlldyB0aGUgWDNldyBwcmUta2V5IGJ1bmRsZSBzcGVjaWZpY2F0aW9uPw==',
      header: {
        ratchetKey: '043f2a89c19b',
        messageCounter: 1,
        previousCounter: 0,
        iv: 'c0a801010203040506070809',
        algorithm: 'AES-256-GCM',
      },
      timestamp: new Date(now.getTime() - 1800000).toISOString(),
      deliveryStatus: 'read',
      status: 'read',
    },
    {
      id: 'm2222222-2222-4222-m222-222222222222',
      conversationId: directRahulPriya.id,
      senderId: userPriya.id,
      ciphertext: 'enc:v1:WWVzLCBJJ20gd29ya2luZyBvbiB0aGUgRG91YmxlIFJhdGNoZXQgc3RhdGUgbm93Lg==',
      header: {
        ratchetKey: '048e91d4a021',
        messageCounter: 2,
        previousCounter: 1,
        iv: 'd1b90202030405060708090a',
        algorithm: 'AES-256-GCM',
      },
      timestamp: new Date(now.getTime() - 900000).toISOString(),
      deliveryStatus: 'read',
      status: 'read',
    },
  ];

  return {
    users: [userRahul, userPriya, userProf, userAlex],
    conversations: [directRahulPriya, cryptoGroup],
    messages: initialEncryptedMessages,
  };
}
