import { db } from '../database/client.js';
import { SafeUser, UserStatus } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class UserService {
  /**
   * Search users by username or display name.
   * STRICT PRIVACY INVARIANT: Email addresses are NEVER returned.
   */
  public async searchUsers(query: string, currentUserId?: string): Promise<SafeUser[]> {
    return db.searchUsers(query, currentUserId);
  }

  public async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await db.findUserById(userId);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      lastSeen: user.lastSeen,
      publicKeyFingerprint: user.publicKeyFingerprint,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public async getUserByUsername(username: string): Promise<SafeUser | null> {
    const user = await db.findUserByUsername(username);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      lastSeen: user.lastSeen,
      publicKeyFingerprint: user.publicKeyFingerprint,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public async updateProfile(
    userId: string,
    updates: { displayName?: string; avatarUrl?: string; publicKeyFingerprint?: string }
  ): Promise<SafeUser> {
    const updated = await db.updateUser(userId, updates);
    if (!updated) {
      throw new Error('User not found.');
    }

    logger.info(`Profile updated for user: ${userId}`);

    return {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      status: updated.status,
      lastSeen: updated.lastSeen,
      publicKeyFingerprint: updated.publicKeyFingerprint,
      avatarUrl: updated.avatarUrl,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  public async updatePresence(userId: string, status: UserStatus): Promise<void> {
    await db.updateUser(userId, {
      status,
      lastSeen: new Date().toISOString(),
    });
  }
}

export const userService = new UserService();
