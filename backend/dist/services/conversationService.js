"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationService = exports.ConversationService = void 0;
const client_js_1 = require("../database/client.js");
const logger_js_1 = require("../utils/logger.js");
const userService_js_1 = require("./userService.js");
class ConversationService {
    async getConversationsForUser(userId) {
        return client_js_1.db.getConversationsForUser(userId);
    }
    async getConversationById(id, forUserId) {
        return client_js_1.db.getConversationById(id, forUserId);
    }
    /**
     * Start or retrieve a 1-to-1 direct conversation between two users.
     * Idempotent: returns existing conversation if already created.
     */
    async getOrCreateDirectConversation(currentUserId, peerUserId) {
        if (currentUserId === peerUserId) {
            throw new Error('Cannot start a direct conversation with yourself.');
        }
        const peer = await userService_js_1.userService.getUserById(peerUserId);
        if (!peer) {
            throw new Error('Target user not found.');
        }
        // Check if an existing direct conversation exists
        const userConvs = await client_js_1.db.getConversationsForUser(currentUserId);
        const existing = userConvs.find((c) => c.type === 'direct' && (c.participant.id === peerUserId || c.id.includes(peerUserId)));
        if (existing) {
            return existing;
        }
        const now = new Date().toISOString();
        // Deterministic or UUID conversation ID
        const convId = `conv_direct_${[currentUserId, peerUserId].sort().join('_')}`;
        const newConv = {
            id: convId,
            type: 'direct',
            participant: peer,
            participantIds: [currentUserId, peerUserId],
            unreadCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        await client_js_1.db.saveConversation(newConv);
        logger_js_1.logger.info(`Direct conversation established between ${currentUserId} and ${peerUserId}`);
        return newConv;
    }
    /**
     * Create a new group conversation.
     * Assigns creator as 'admin', memberUsers as 'member'.
     */
    async createGroup(creatorId, name, memberUserIds, description) {
        if (!name.trim()) {
            throw new Error('Group name cannot be empty.');
        }
        const creator = await userService_js_1.userService.getUserById(creatorId);
        if (!creator) {
            throw new Error('Creator user not found.');
        }
        const now = new Date().toISOString();
        const members = [
            {
                userId: creator.id,
                user: creator,
                role: 'admin',
                unreadCount: 0,
                joinedAt: now,
            },
        ];
        const uniqueMemberIds = Array.from(new Set(memberUserIds)).filter((id) => id !== creatorId);
        for (const mid of uniqueMemberIds) {
            const u = await userService_js_1.userService.getUserById(mid);
            if (u) {
                members.push({
                    userId: u.id,
                    user: u,
                    role: 'member',
                    unreadCount: 0,
                    joinedAt: now,
                });
            }
        }
        const newGroup = {
            id: `group_${crypto.randomUUID()}`,
            type: 'group',
            name: name.trim(),
            description: description?.trim() || '',
            members,
            createdBy: creatorId,
            createdAt: now,
            updatedAt: now,
            unreadCount: 0,
        };
        await client_js_1.db.saveConversation(newGroup);
        logger_js_1.logger.info(`Group created: "${newGroup.name}" (${newGroup.id}) by ${creatorId} with ${members.length} members`);
        return newGroup;
    }
    /**
     * Add new members to an existing group.
     */
    async addGroupMembers(groupId, callerId, newMemberIds) {
        const conv = await client_js_1.db.getConversationById(groupId);
        if (!conv || conv.type !== 'group') {
            throw new Error('Group not found.');
        }
        const group = conv;
        const isCallerMember = group.members.some((m) => m.userId === callerId);
        if (!isCallerMember) {
            throw new Error('You are not authorized to add members to this group.');
        }
        const existingIds = new Set(group.members.map((m) => m.userId));
        const now = new Date().toISOString();
        for (const uid of newMemberIds) {
            if (!existingIds.has(uid)) {
                const u = await userService_js_1.userService.getUserById(uid);
                if (u) {
                    group.members.push({
                        userId: u.id,
                        user: u,
                        role: 'member',
                        unreadCount: 0,
                        joinedAt: now,
                    });
                    existingIds.add(uid);
                }
            }
        }
        group.updatedAt = now;
        await client_js_1.db.saveConversation(group);
        logger_js_1.logger.info(`Added members to group ${groupId}`);
        return group;
    }
    /**
     * Remove a member from a group.
     * Admins can remove members; members can remove themselves (leave).
     */
    async removeGroupMember(groupId, callerId, targetUserId) {
        const conv = await client_js_1.db.getConversationById(groupId);
        if (!conv || conv.type !== 'group') {
            throw new Error('Group not found.');
        }
        const group = conv;
        const callerMember = group.members.find((m) => m.userId === callerId);
        if (!callerMember) {
            throw new Error('You are not a member of this group.');
        }
        // Permission check: caller is admin OR removing themselves
        if (callerMember.role !== 'admin' && callerId !== targetUserId) {
            throw new Error('Only group admins can remove other members.');
        }
        group.members = group.members.filter((m) => m.userId !== targetUserId);
        group.updatedAt = new Date().toISOString();
        await client_js_1.db.saveConversation(group);
        logger_js_1.logger.info(`Removed member ${targetUserId} from group ${groupId}`);
        return group;
    }
    /**
     * Rename a group.
     */
    async updateGroupName(groupId, callerId, newName) {
        const conv = await client_js_1.db.getConversationById(groupId);
        if (!conv || conv.type !== 'group') {
            throw new Error('Group not found.');
        }
        const group = conv;
        const isMember = group.members.some((m) => m.userId === callerId);
        if (!isMember) {
            throw new Error('You are not a member of this group.');
        }
        group.name = newName.trim();
        group.updatedAt = new Date().toISOString();
        await client_js_1.db.saveConversation(group);
        logger_js_1.logger.info(`Group ${groupId} renamed to "${group.name}"`);
        return group;
    }
    /**
     * Leave a group.
     */
    async leaveGroup(groupId, userId) {
        const conv = await client_js_1.db.getConversationById(groupId);
        if (!conv || conv.type !== 'group') {
            throw new Error('Group not found.');
        }
        const group = conv;
        group.members = group.members.filter((m) => m.userId !== userId);
        group.updatedAt = new Date().toISOString();
        if (group.members.length === 0) {
            await client_js_1.db.deleteConversation(groupId);
            logger_js_1.logger.info(`Group ${groupId} deleted because all members left.`);
        }
        else {
            await client_js_1.db.saveConversation(group);
            logger_js_1.logger.info(`User ${userId} left group ${groupId}`);
        }
    }
    /**
     * Reset unread counter for a conversation.
     */
    async markAsRead(conversationId, userId) {
        const conv = await client_js_1.db.getConversationById(conversationId);
        if (!conv)
            return;
        if (conv.type === 'direct') {
            const d = conv;
            d.unreadCount = 0;
            await client_js_1.db.saveConversation(d);
        }
        else {
            const g = conv;
            const member = g.members.find((m) => m.userId === userId);
            if (member) {
                member.unreadCount = 0;
            }
            g.unreadCount = 0;
            await client_js_1.db.saveConversation(g);
        }
    }
}
exports.ConversationService = ConversationService;
exports.conversationService = new ConversationService();
//# sourceMappingURL=conversationService.js.map