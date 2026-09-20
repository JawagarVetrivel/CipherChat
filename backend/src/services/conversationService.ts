import { db } from '../database/client.js';
import { Conversation, DirectConversation, Group, GroupMember, SafeUser } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { userService } from './userService.js';

export class ConversationService {
  public async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return db.getConversationsForUser(userId);
  }

  public async getConversationById(id: string, forUserId?: string): Promise<Conversation | null> {
    return db.getConversationById(id, forUserId);
  }

  /**
   * Start or retrieve a 1-to-1 direct conversation between two users.
   * Idempotent: returns existing conversation if already created.
   */
  public async getOrCreateDirectConversation(
    currentUserId: string,
    peerUserId: string
  ): Promise<DirectConversation> {
    if (currentUserId === peerUserId) {
      throw new Error('Cannot start a direct conversation with yourself.');
    }

    const peer = await userService.getUserById(peerUserId);
    if (!peer) {
      throw new Error('Target user not found.');
    }

    // Check if an existing direct conversation exists
    const userConvs = await db.getConversationsForUser(currentUserId);
    const existing = userConvs.find(
      (c) => c.type === 'direct' && ((c as DirectConversation).participant.id === peerUserId || c.id.includes(peerUserId))
    ) as DirectConversation | undefined;

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    // Deterministic or UUID conversation ID
    const convId = `conv_direct_${[currentUserId, peerUserId].sort().join('_')}`;

    const newConv: DirectConversation = {
      id: convId,
      type: 'direct',
      participant: peer,
      participantIds: [currentUserId, peerUserId],
      unreadCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.saveConversation(newConv);
    logger.info(`Direct conversation established between ${currentUserId} and ${peerUserId}`);
    return newConv;
  }

  /**
   * Create a new group conversation.
   * Assigns creator as 'admin', memberUsers as 'member'.
   */
  public async createGroup(
    creatorId: string,
    name: string,
    memberUserIds: string[],
    description?: string
  ): Promise<Group> {
    if (!name.trim()) {
      throw new Error('Group name cannot be empty.');
    }

    const creator = await userService.getUserById(creatorId);
    if (!creator) {
      throw new Error('Creator user not found.');
    }

    const now = new Date().toISOString();
    const members: GroupMember[] = [
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
      const u = await userService.getUserById(mid);
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

    const newGroup: Group = {
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

    await db.saveConversation(newGroup);
    logger.info(`Group created: "${newGroup.name}" (${newGroup.id}) by ${creatorId} with ${members.length} members`);
    return newGroup;
  }

  /**
   * Add new members to an existing group.
   */
  public async addGroupMembers(
    groupId: string,
    callerId: string,
    newMemberIds: string[]
  ): Promise<Group> {
    const conv = await db.getConversationById(groupId);
    if (!conv || conv.type !== 'group') {
      throw new Error('Group not found.');
    }

    const group = conv as Group;
    const isCallerMember = group.members.some((m) => m.userId === callerId);
    if (!isCallerMember) {
      throw new Error('You are not authorized to add members to this group.');
    }

    const existingIds = new Set(group.members.map((m) => m.userId));
    const now = new Date().toISOString();

    for (const uid of newMemberIds) {
      if (!existingIds.has(uid)) {
        const u = await userService.getUserById(uid);
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
    await db.saveConversation(group);
    logger.info(`Added members to group ${groupId}`);
    return group;
  }

  /**
   * Remove a member from a group.
   * Admins can remove members; members can remove themselves (leave).
   */
  public async removeGroupMember(
    groupId: string,
    callerId: string,
    targetUserId: string
  ): Promise<Group> {
    const conv = await db.getConversationById(groupId);
    if (!conv || conv.type !== 'group') {
      throw new Error('Group not found.');
    }

    const group = conv as Group;
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

    await db.saveConversation(group);
    logger.info(`Removed member ${targetUserId} from group ${groupId}`);
    return group;
  }

  /**
   * Rename a group.
   */
  public async updateGroupName(groupId: string, callerId: string, newName: string): Promise<Group> {
    const conv = await db.getConversationById(groupId);
    if (!conv || conv.type !== 'group') {
      throw new Error('Group not found.');
    }

    const group = conv as Group;
    const isMember = group.members.some((m) => m.userId === callerId);
    if (!isMember) {
      throw new Error('You are not a member of this group.');
    }

    group.name = newName.trim();
    group.updatedAt = new Date().toISOString();
    await db.saveConversation(group);
    logger.info(`Group ${groupId} renamed to "${group.name}"`);
    return group;
  }

  /**
   * Leave a group.
   */
  public async leaveGroup(groupId: string, userId: string): Promise<void> {
    const conv = await db.getConversationById(groupId);
    if (!conv || conv.type !== 'group') {
      throw new Error('Group not found.');
    }

    const group = conv as Group;
    group.members = group.members.filter((m) => m.userId !== userId);
    group.updatedAt = new Date().toISOString();

    if (group.members.length === 0) {
      await db.deleteConversation(groupId);
      logger.info(`Group ${groupId} deleted because all members left.`);
    } else {
      await db.saveConversation(group);
      logger.info(`User ${userId} left group ${groupId}`);
    }
  }

  /**
   * Reset unread counter for a conversation.
   */
  public async markAsRead(conversationId: string, userId: string): Promise<void> {
    const conv = await db.getConversationById(conversationId);
    if (!conv) return;

    if (conv.type === 'direct') {
      const d = conv as DirectConversation;
      d.unreadCount = 0;
      await db.saveConversation(d);
    } else {
      const g = conv as Group;
      const member = g.members.find((m) => m.userId === userId);
      if (member) {
        member.unreadCount = 0;
      }
      g.unreadCount = 0;
      await db.saveConversation(g);
    }
  }
}

export const conversationService = new ConversationService();
