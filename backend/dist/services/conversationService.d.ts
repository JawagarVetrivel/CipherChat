import { Conversation, DirectConversation, Group } from '../types/index.js';
export declare class ConversationService {
    getConversationsForUser(userId: string): Promise<Conversation[]>;
    getConversationById(id: string): Promise<Conversation | null>;
    /**
     * Start or retrieve a 1-to-1 direct conversation between two users.
     * Idempotent: returns existing conversation if already created.
     */
    getOrCreateDirectConversation(currentUserId: string, peerUserId: string): Promise<DirectConversation>;
    /**
     * Create a new group conversation.
     * Assigns creator as 'admin', memberUsers as 'member'.
     */
    createGroup(creatorId: string, name: string, memberUserIds: string[], description?: string): Promise<Group>;
    /**
     * Add new members to an existing group.
     */
    addGroupMembers(groupId: string, callerId: string, newMemberIds: string[]): Promise<Group>;
    /**
     * Remove a member from a group.
     * Admins can remove members; members can remove themselves (leave).
     */
    removeGroupMember(groupId: string, callerId: string, targetUserId: string): Promise<Group>;
    /**
     * Rename a group.
     */
    updateGroupName(groupId: string, callerId: string, newName: string): Promise<Group>;
    /**
     * Leave a group.
     */
    leaveGroup(groupId: string, userId: string): Promise<void>;
    /**
     * Reset unread counter for a conversation.
     */
    markAsRead(conversationId: string, userId: string): Promise<void>;
}
export declare const conversationService: ConversationService;
