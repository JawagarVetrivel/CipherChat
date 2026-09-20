import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register({
        email: validated.email,
        password: validated.password,
        username: validated.username,
        displayName: validated.displayName || validated.username,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({ user: req.user });
  }
}

export const authController = new AuthController();
