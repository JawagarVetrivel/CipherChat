import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../database/client.js';
import { AuthUser, DirectConversation, Group } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await db.findUserById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User session invalid or user not found.' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      status: user.status,
      lastSeen: user.lastSeen,
      publicKeyFingerprint: user.publicKeyFingerprint,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (err) {
    logger.warn('Token validation failed', { error: String(err) });
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

/**
 * Authorization Guard:
 * Ensures the authenticated user is an authorized member of the requested conversation.
 */
export function requireConversationMember(paramName = 'id') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const conversationId = req.params[paramName] || req.body.conversationId;
    const userId = req.user?.id;

    if (!conversationId) {
      res.status(400).json({ error: 'Conversation identifier is required.' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }

    // Check membership
    let isMember = false;
    if (conversation.type === 'direct') {
      const d = conversation as DirectConversation;
      isMember = d.participant.id === userId || d.id.includes(userId);
    } else {
      const g = conversation as Group;
      isMember = g.members.some((m) => m.userId === userId);
    }

    if (!isMember) {
      res.status(403).json({ error: 'Access denied. You are not a member of this conversation.' });
      return;
    }

    next();
  };
}
