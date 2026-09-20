import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../types/index.js';
export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
export declare function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Authorization Guard:
 * Ensures the authenticated user is an authorized member of the requested conversation.
 */
export declare function requireConversationMember(paramName?: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
