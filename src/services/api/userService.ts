import { User } from '../../types';
import { authService } from './authService';

const getApiBaseUrl = (): string => {
  return (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
};

/**
 * UserService
 *
 * User lookup and username search service.
 *
 * Security & Privacy Directive:
 * - Email addresses are NEVER exposed in user search results or public profiles.
 * - Users are discovered exclusively by `@username` or display name.
 */
class UserService {
  /**
   * Search users by username (e.g. `@rahul123` or `rahul`).
   * Strips all private fields like email before returning results.
   */
  public async searchUsers(
    query: string,
    currentUserId?: string
  ): Promise<Array<Omit<User, 'email'>>> {
    const apiBase = getApiBaseUrl();
    if (apiBase) {
      const session = authService.getCurrentSession();
      try {
        const res = await fetch(`${apiBase}/users/search?q=${encodeURIComponent(query)}`, {
          headers: session ? { Authorization: `Bearer ${session.token}` } : {},
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend search request failed, falling back to local list:', err);
      }
    }

    const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');
    if (!cleanQuery) return [];

    const allUsers = authService.getAllRegisteredUsers();

    return allUsers
      .filter(u => {
        // Exclude current user from search results
        if (currentUserId && u.id === currentUserId) return false;

        const matchesUsername = u.username.toLowerCase().includes(cleanQuery);
        const matchesDisplay = u.displayName.toLowerCase().includes(cleanQuery);
        return matchesUsername || matchesDisplay;
      })
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        status: u.status,
        lastSeen: u.lastSeen,
        publicKeyFingerprint: u.publicKeyFingerprint,
        avatarUrl: u.avatarUrl,
        // Notice: email is deliberately excluded!
      }));
  }

  public async getUserById(userId: string): Promise<Omit<User, 'email'> | null> {
    const apiBase = getApiBaseUrl();
    if (apiBase) {
      const session = authService.getCurrentSession();
      try {
        const res = await fetch(`${apiBase}/users/${userId}`, {
          headers: session ? { Authorization: `Bearer ${session.token}` } : {},
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn(`Backend fetch user by id failed: ${userId}`, err);
      }
    }

    const allUsers = authService.getAllRegisteredUsers();
    const found = allUsers.find(u => u.id === userId);
    if (!found) return null;

    return {
      id: found.id,
      username: found.username,
      displayName: found.displayName,
      status: found.status,
      lastSeen: found.lastSeen,
      publicKeyFingerprint: found.publicKeyFingerprint,
      avatarUrl: found.avatarUrl,
    };
  }

  public async getUserByUsername(username: string): Promise<Omit<User, 'email'> | null> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const apiBase = getApiBaseUrl();
    if (apiBase) {
      const session = authService.getCurrentSession();
      try {
        const res = await fetch(`${apiBase}/users/username/${clean}`, {
          headers: session ? { Authorization: `Bearer ${session.token}` } : {},
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn(`Backend fetch user by username failed: ${clean}`, err);
      }
    }

    const allUsers = authService.getAllRegisteredUsers();
    const found = allUsers.find(u => u.username.toLowerCase() === clean);
    if (!found) return null;

    return {
      id: found.id,
      username: found.username,
      displayName: found.displayName,
      status: found.status,
      lastSeen: found.lastSeen,
      publicKeyFingerprint: found.publicKeyFingerprint,
      avatarUrl: found.avatarUrl,
    };
  }
}

export const userService = new UserService();
