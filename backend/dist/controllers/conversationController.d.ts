import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
export declare class ConversationController {
    getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    createDirect(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    createGroup(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    addMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updateGroupName(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    leaveGroup(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const conversationController: ConversationController;
