import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
export declare class KeyController {
    registerKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getUserKeys(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const keyController: KeyController;
