import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { User, Conversation, EncryptedMessage, PublicKeyRecord, SessionRecord, SafeUser, DirectConversation, Group } from '../types/index.js';
import { getSeedData } from './seed.js';

let supabaseClient: SupabaseClient | null = null;

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    logger.info('Supabase PostgreSQL client connected using service-role authentication.');
  } catch (err) {
    logger.warn('Failed to initialize Supabase client. Running in-memory database store.', { error: String(err) });
  }
} else {
  logger.info('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Using persistent local in-memory store.');
}

export { supabaseClient };

/**
 * Unified Database Store
 * Implements the normalized database model. If Supabase is connected, maps to Supabase.
 * Otherwise, uses an in-memory repository seeded with default users and test conversations.
 */
class DatabaseStore {
  private users: Map<string, User> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, EncryptedMessage> = new Map();
  private publicKeys: Map<string, PublicKeyRecord> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    const seed = await getSeedData();
    for (const u of seed.users) {
      this.users.set(u.id, u);
    }
    for (const c of seed.conversations) {
      this.conversations.set(c.id, c);
    }
    for (const m of seed.messages) {
      this.messages.set(m.id, m);
    }
    this.initialized = true;
    logger.info(`Database repository initialized with ${this.users.size} users, ${this.conversations.size} conversations.`);
  }

  // --- Users ---
  public async findUserById(id: string): Promise<User | null> {
    await this.init();
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('users').select('*').eq('id', id).maybeSingle();
      if (!error && data) return this.mapDbUser(data);
    }
    return this.users.get(id) || null;
  }

  public async findUserByEmail(email: string): Promise<User | null> {
    await this.init();
    const clean = email.trim().toLowerCase();
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('users').select('*').ilike('email', clean).maybeSingle();
      if (!error && data) return this.mapDbUser(data);
    }
    for (const u of this.users.values()) {
      if (u.email && u.email.toLowerCase() === clean) return u;
    }
    return null;
  }

  public async findUserByUsername(username: string): Promise<User | null> {
    await this.init();
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('users').select('*').ilike('username', clean).maybeSingle();
      if (!error && data) return this.mapDbUser(data);
    }
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === clean) return u;
    }
    return null;
  }

  public async createUser(user: User): Promise<User> {
    await this.init();
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          username: user.username,
          display_name: user.displayName,
          email: user.email,
          password_hash: user.passwordHash,
          status: user.status,
          public_key_fingerprint: user.publicKeyFingerprint,
          avatar_url: user.avatarUrl,
        })
        .select()
        .single();
      if (!error && data) return this.mapDbUser(data);
    }
    this.users.set(user.id, user);
    return user;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    await this.init();
    const existing = await this.findUserById(id);
    if (!existing) return null;

    const updated: User = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (supabaseClient) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.lastSeen !== undefined) dbUpdates.last_seen = updates.lastSeen;
      if (updates.publicKeyFingerprint !== undefined) dbUpdates.public_key_fingerprint = updates.publicKeyFingerprint;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      dbUpdates.updated_at = updated.updatedAt;

      await supabaseClient.from('users').update(dbUpdates).eq('id', id);
    }

    this.users.set(id, updated);
    return updated;
  }

  public async searchUsers(query: string, excludeUserId?: string): Promise<SafeUser[]> {
    await this.init();
    const clean = query.trim().toLowerCase().replace(/^@/, '');

    if (supabaseClient) {
      let q = supabaseClient.from('users').select('id, username, display_name, status, last_seen, public_key_fingerprint, avatar_url, created_at, updated_at');
      if (excludeUserId) {
        q = q.neq('id', excludeUserId);
      }
      if (clean) {
        q = q.or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`);
      }
      const { data, error } = await q.limit(20);
      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          username: d.username,
          displayName: d.display_name,
          status: d.status,
          lastSeen: d.last_seen,
          publicKeyFingerprint: d.public_key_fingerprint,
          avatarUrl: d.avatar_url,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }

    const results: SafeUser[] = [];
    for (const u of this.users.values()) {
      if (excludeUserId && u.id === excludeUserId) continue;
      if (!clean || u.username.toLowerCase().includes(clean) || u.displayName.toLowerCase().includes(clean)) {
        results.push({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          status: u.status,
          lastSeen: u.lastSeen,
          publicKeyFingerprint: u.publicKeyFingerprint,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        });
      }
    }
    return results;
  }

  // --- Conversations ---
  public async getConversationsForUser(userId: string): Promise<Conversation[]> {
    await this.init();
    const list: Conversation[] = [];

    for (const conv of this.conversations.values()) {
      if (conv.type === 'direct') {
        // Direct conversation check: Is caller a participant or the other party?
        // Participant ID or conversation id contains userId
        const d = conv as DirectConversation;
        const isMember = d.participant.id !== userId && d.id.includes(userId);
        // Also support conversation where user is either party
        if (isMember || d.participant.id === userId || d.id.includes(userId)) {
          list.push(conv);
        }
      } else {
        const g = conv as Group;
        if (g.members.some((m) => m.userId === userId)) {
          list.push(conv);
        }
      }
    }

    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async getConversationById(id: string): Promise<Conversation | null> {
    await this.init();
    return this.conversations.get(id) || null;
  }

  public async saveConversation(conv: Conversation): Promise<Conversation> {
    await this.init();
    conv.updatedAt = new Date().toISOString();
    this.conversations.set(conv.id, conv);
    return conv;
  }

  public async deleteConversation(id: string): Promise<boolean> {
    await this.init();
    return this.conversations.delete(id);
  }

  // --- Messages ---
  public async getMessagesByConversation(conversationId: string): Promise<EncryptedMessage[]> {
    await this.init();
    const list: EncryptedMessage[] = [];
    for (const m of this.messages.values()) {
      if (m.conversationId === conversationId) {
        list.push(m);
      }
    }
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public async saveMessage(message: EncryptedMessage): Promise<EncryptedMessage> {
    await this.init();
    this.messages.set(message.id, message);

    // Update conversation lastMessage & updatedAt
    const conv = this.conversations.get(message.conversationId);
    if (conv) {
      conv.lastMessage = message;
      conv.updatedAt = message.timestamp;
      this.conversations.set(conv.id, conv);
    }

    return message;
  }

  public async updateMessageStatus(messageId: string, status: EncryptedMessage['deliveryStatus']): Promise<EncryptedMessage | null> {
    await this.init();
    const msg = this.messages.get(messageId);
    if (!msg) return null;
    msg.deliveryStatus = status;
    msg.status = status;
    return msg;
  }

  public async getPendingMessagesForUser(userId: string): Promise<EncryptedMessage[]> {
    await this.init();
    const userConvs = await this.getConversationsForUser(userId);
    const convIds = new Set(userConvs.map((c) => c.id));
    const pending: EncryptedMessage[] = [];

    for (const m of this.messages.values()) {
      if (convIds.has(m.conversationId) && m.senderId !== userId && m.deliveryStatus === 'sent') {
        pending.push(m);
      }
    }
    return pending;
  }

  // --- Public Keys ---
  public async savePublicKey(key: PublicKeyRecord): Promise<PublicKeyRecord> {
    await this.init();
    this.publicKeys.set(key.id, key);
    return key;
  }

  public async getPublicKeysForUser(userId: string): Promise<PublicKeyRecord[]> {
    await this.init();
    const keys: PublicKeyRecord[] = [];
    for (const k of this.publicKeys.values()) {
      if (k.userId === userId && k.isActive) {
        keys.push(k);
      }
    }
    return keys;
  }

  // --- Sessions ---
  public async saveSession(session: SessionRecord): Promise<void> {
    await this.init();
    this.sessions.set(session.id, session);
  }

  public async deleteSession(id: string): Promise<void> {
    await this.init();
    this.sessions.delete(id);
  }

  private mapDbUser(row: Record<string, unknown>): User {
    return {
      id: String(row.id),
      username: String(row.username),
      displayName: String(row.display_name),
      email: String(row.email),
      passwordHash: String(row.password_hash),
      status: (row.status as User['status']) || 'offline',
      lastSeen: row.last_seen ? String(row.last_seen) : undefined,
      publicKeyFingerprint: row.public_key_fingerprint ? String(row.public_key_fingerprint) : undefined,
      avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
      createdAt: String(row.created_at || new Date().toISOString()),
      updatedAt: String(row.updated_at || new Date().toISOString()),
    };
  }
}

export const db = new DatabaseStore();
