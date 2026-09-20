import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { keyService } from '../services/keyService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const registerKeySchema = z.object({
  keyType: z.enum(['identity', 'signed_prekey', 'one_time_prekey']),
  publicKey: z.string().min(1),
  expiresAt: z.string().optional(),
});

export class KeyController {
  public async registerKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = registerKeySchema.parse(req.body);

      const record = await keyService.registerPublicKey({
        userId,
        keyType: validated.keyType,
        publicKey: validated.publicKey,
        expiresAt: validated.expiresAt,
      });

      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  }

  public async getUserKeys(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const keys = await keyService.getPublicKeysForUser(id);
      res.status(200).json(keys);
    } catch (err) {
      next(err);
    }
  }
}

export const keyController = new KeyController();
