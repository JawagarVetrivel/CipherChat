import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { conversationService } from '../services/conversationService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const directConvSchema = z.object({
  participantId: z.string().min(1),
});

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  memberIds: z.array(z.string()).default([]),
});

const addMembersSchema = z.object({
  memberIds: z.array(z.string()).min(1),
});

const updateGroupNameSchema = z.object({
  name: z.string().min(1),
});

export class ConversationController {
  public async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversations = await conversationService.getConversationsForUser(userId);
      res.status(200).json(conversations);
    } catch (err) {
      next(err);
    }
  }

  public async getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversation = await conversationService.getConversationById(id);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }
      res.status(200).json(conversation);
    } catch (err) {
      next(err);
    }
  }

  public async createDirect(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user!.id;
      const { participantId } = directConvSchema.parse(req.body);
      const conversation = await conversationService.getOrCreateDirectConversation(currentUserId, participantId);
      res.status(200).json(conversation);
    } catch (err) {
      next(err);
    }
  }

  public async createGroup(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorId = req.user!.id;
      const { name, description, memberIds } = createGroupSchema.parse(req.body);
      const group = await conversationService.createGroup(creatorId, name, memberIds, description);
      res.status(201).json(group);
    } catch (err) {
      next(err);
    }
  }

  public async addMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const callerId = req.user!.id;
      const { id } = req.params;
      const { memberIds } = addMembersSchema.parse(req.body);
      const updatedGroup = await conversationService.addGroupMembers(id, callerId, memberIds);
      res.status(200).json(updatedGroup);
    } catch (err) {
      next(err);
    }
  }

  public async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const callerId = req.user!.id;
      const { id, userId } = req.params;
      const updatedGroup = await conversationService.removeGroupMember(id, callerId, userId);
      res.status(200).json(updatedGroup);
    } catch (err) {
      next(err);
    }
  }

  public async updateGroupName(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const callerId = req.user!.id;
      const { id } = req.params;
      const { name } = updateGroupNameSchema.parse(req.body);
      const updatedGroup = await conversationService.updateGroupName(id, callerId, name);
      res.status(200).json(updatedGroup);
    } catch (err) {
      next(err);
    }
  }

  public async leaveGroup(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await conversationService.leaveGroup(id, userId);
      res.status(200).json({ success: true, message: 'Successfully left the group.' });
    } catch (err) {
      next(err);
    }
  }

  public async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await conversationService.markAsRead(id, userId);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}

export const conversationController = new ConversationController();
