"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.supabaseClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_js_1 = require("../config/env.js");
const logger_js_1 = require("../utils/logger.js");
const seed_js_1 = require("./seed.js");
let supabaseClient = null;
exports.supabaseClient = supabaseClient;
if (env_js_1.env.SUPABASE_URL && env_js_1.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
        exports.supabaseClient = supabaseClient = (0, supabase_js_1.createClient)(env_js_1.env.SUPABASE_URL, env_js_1.env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
        logger_js_1.logger.info('Supabase PostgreSQL client connected using service-role authentication.');
    }
    catch (err) {
        logger_js_1.logger.warn('Failed to initialize Supabase client. Running in-memory database store.', { error: String(err) });
    }
}
else {
    logger_js_1.logger.info('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Using persistent local in-memory store.');
}
/**
 * Unified Database Store
 * Implements the normalized database model. If Supabase is connected, maps to Supabase.
 * Otherwise, uses an in-memory repository seeded with default users and test conversations.
 */
class DatabaseStore {
    users = new Map();
    conversations = new Map();
    messages = new Map();
    publicKeys = new Map();
    sessions = new Map();
    initialized = false;
    async init() {
        if (this.initialized)
            return;
        const seed = await (0, seed_js_1.getSeedData)();
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
        logger_js_1.logger.info(`Database repository initialized with ${this.users.size} users, ${this.conversations.size} conversations.`);
    }
    // --- Users ---
    async findUserById(id) {
        await this.init();
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('users').select('*').eq('id', id).maybeSingle();
            if (!error && data)
                return this.mapDbUser(data);
        }
        return this.users.get(id) || null;
    }
    async findUserByEmail(email) {
        await this.init();
        const clean = email.trim().toLowerCase();
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('users').select('*').ilike('email', clean).maybeSingle();
            if (!error && data)
                return this.mapDbUser(data);
        }
        for (const u of this.users.values()) {
            if (u.email && u.email.toLowerCase() === clean)
                return u;
        }
        return null;
    }
    async findUserByUsername(username) {
        await this.init();
        const clean = username.trim().toLowerCase().replace(/^@/, '');
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('users').select('*').ilike('username', clean).maybeSingle();
            if (!error && data)
                return this.mapDbUser(data);
        }
        for (const u of this.users.values()) {
            if (u.username.toLowerCase() === clean)
                return u;
        }
        return null;
    }
    async createUser(user) {
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
            if (!error && data)
                return this.mapDbUser(data);
        }
        this.users.set(user.id, user);
        return user;
    }
    async updateUser(id, updates) {
        await this.init();
        const existing = await this.findUserById(id);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        if (supabaseClient) {
            const dbUpdates = {};
            if (updates.displayName !== undefined)
                dbUpdates.display_name = updates.displayName;
            if (updates.status !== undefined)
                dbUpdates.status = updates.status;
            if (updates.lastSeen !== undefined)
                dbUpdates.last_seen = updates.lastSeen;
            if (updates.publicKeyFingerprint !== undefined)
                dbUpdates.public_key_fingerprint = updates.publicKeyFingerprint;
            if (updates.avatarUrl !== undefined)
                dbUpdates.avatar_url = updates.avatarUrl;
            dbUpdates.updated_at = updated.updatedAt;
            await supabaseClient.from('users').update(dbUpdates).eq('id', id);
        }
        this.users.set(id, updated);
        return updated;
    }
    async searchUsers(query, excludeUserId) {
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
            if (!error && data && data.length > 0) {
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
        const results = [];
        for (const u of this.users.values()) {
            if (excludeUserId && u.id === excludeUserId)
                continue;
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
    async getConversationsForUser(userId) {
        await this.init();
        const list = [];
        for (const conv of this.conversations.values()) {
            if (conv.type === 'direct') {
                const d = conv;
                let pIds = d.participantIds || [];
                if (pIds.length === 0 && d.id.startsWith('conv_direct_')) {
                    pIds = d.id.replace('conv_direct_', '').split('_').filter(Boolean);
                }
                if (pIds.length === 0 && d.participant?.id) {
                    pIds = [d.participant.id];
                }
                const isMember = pIds.includes(userId) || d.participant?.id === userId || d.id.includes(userId);
                if (isMember) {
                    // Resolve other party so the caller sees their conversation peer, NEVER themselves
                    const peerId = pIds.find((id) => id !== userId) || (d.participant?.id !== userId ? d.participant?.id : null);
                    let peerUser = d.participant;
                    if (peerId && (peerId !== d.participant?.id || d.participant?.id === userId)) {
                        const u = await this.findUserById(peerId);
                        if (u) {
                            peerUser = {
                                id: u.id,
                                username: u.username,
                                displayName: u.displayName,
                                status: u.status,
                                lastSeen: u.lastSeen,
                                publicKeyFingerprint: u.publicKeyFingerprint,
                                avatarUrl: u.avatarUrl,
                                createdAt: u.createdAt,
                                updatedAt: u.updatedAt,
                            };
                        }
                    }
                    list.push({
                        ...d,
                        participantIds: pIds.length >= 2 ? pIds : (peerId ? [userId, peerId] : d.participantIds),
                        participant: peerUser,
                    });
                }
            }
            else {
                const g = conv;
                if (g.members.some((m) => m.userId === userId)) {
                    list.push(conv);
                }
            }
        }
        return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    async getConversationById(id, forUserId) {
        await this.init();
        const conv = this.conversations.get(id);
        if (!conv)
            return null;
        if (conv.type === 'direct' && forUserId) {
            const d = conv;
            let pIds = d.participantIds || [];
            if (pIds.length === 0 && d.id.startsWith('conv_direct_')) {
                pIds = d.id.replace('conv_direct_', '').split('_').filter(Boolean);
            }
            const peerId = pIds.find((pid) => pid !== forUserId) || (d.participant?.id !== forUserId ? d.participant?.id : null);
            if (peerId && (peerId !== d.participant?.id || d.participant?.id === forUserId)) {
                const u = await this.findUserById(peerId);
                if (u) {
                    return {
                        ...d,
                        participantIds: pIds,
                        participant: {
                            id: u.id,
                            username: u.username,
                            displayName: u.displayName,
                            status: u.status,
                            lastSeen: u.lastSeen,
                            publicKeyFingerprint: u.publicKeyFingerprint,
                            avatarUrl: u.avatarUrl,
                            createdAt: u.createdAt,
                            updatedAt: u.updatedAt,
                        },
                    };
                }
            }
        }
        return conv;
    }
    async saveConversation(conv) {
        await this.init();
        conv.updatedAt = new Date().toISOString();
        if (conv.type === 'direct') {
            const d = conv;
            if (!d.participantIds && d.id.startsWith('conv_direct_')) {
                d.participantIds = d.id.replace('conv_direct_', '').split('_').filter(Boolean);
            }
        }
        this.conversations.set(conv.id, conv);
        return conv;
    }
    async deleteConversation(id) {
        await this.init();
        return this.conversations.delete(id);
    }
    // --- Messages ---
    async getMessagesByConversation(conversationId) {
        await this.init();
        const list = [];
        for (const m of this.messages.values()) {
            if (m.conversationId === conversationId) {
                list.push(m);
            }
        }
        return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    async saveMessage(message) {
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
    async updateMessageStatus(messageId, status) {
        await this.init();
        const msg = this.messages.get(messageId);
        if (!msg)
            return null;
        msg.deliveryStatus = status;
        msg.status = status;
        return msg;
    }
    async getPendingMessagesForUser(userId) {
        await this.init();
        const userConvs = await this.getConversationsForUser(userId);
        const convIds = new Set(userConvs.map((c) => c.id));
        const pending = [];
        for (const m of this.messages.values()) {
            if (convIds.has(m.conversationId) && m.senderId !== userId && m.deliveryStatus === 'sent') {
                pending.push(m);
            }
        }
        return pending;
    }
    // --- Public Keys ---
    async savePublicKey(key) {
        await this.init();
        this.publicKeys.set(key.id, key);
        return key;
    }
    async getPublicKeysForUser(userId) {
        await this.init();
        const keys = [];
        for (const k of this.publicKeys.values()) {
            if (k.userId === userId && k.isActive) {
                keys.push(k);
            }
        }
        return keys;
    }
    // --- Sessions ---
    async saveSession(session) {
        await this.init();
        this.sessions.set(session.id, session);
    }
    async deleteSession(id) {
        await this.init();
        this.sessions.delete(id);
    }
    mapDbUser(row) {
        return {
            id: String(row.id),
            username: String(row.username),
            displayName: String(row.display_name),
            email: String(row.email),
            passwordHash: String(row.password_hash),
            status: row.status || 'offline',
            lastSeen: row.last_seen ? String(row.last_seen) : undefined,
            publicKeyFingerprint: row.public_key_fingerprint ? String(row.public_key_fingerprint) : undefined,
            avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
            createdAt: String(row.created_at || new Date().toISOString()),
            updatedAt: String(row.updated_at || new Date().toISOString()),
        };
    }
}
exports.db = new DatabaseStore();
//# sourceMappingURL=client.js.map