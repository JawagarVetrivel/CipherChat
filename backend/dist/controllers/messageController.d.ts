import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
export declare class MessageController {
    getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const messageController: MessageController;
