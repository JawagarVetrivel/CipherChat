import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/userService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  avatarUrl: z.string().optional(),
  publicKeyFingerprint: z.string().optional(),
});

export class UserController {
  /**
   * Search users by query.
   * STRICT PRIVACY INVARIANT: Email is NEVER returned in search results.
   */
  public async search(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || (req.query.username as string) || '';
      const currentUserId = req.user?.id;
      const results = await userService.searchUsers(query, currentUserId);
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  public async getByUsername(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = req.params;
      const user = await userService.getUserByUsername(username);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  public async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = updateProfileSchema.parse(req.body);
      const updated = await userService.updateProfile(userId, validated);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
