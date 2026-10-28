import { User } from '../../types';
import { authService } from './authService';

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, '');
  return 'https://cipherchat-rtn2.onrender.com/api';
};

/**
 * UserService
 *
 * User lookup and username search service with in-memory caching and request deduplication.
 *
 * Security & Privacy Directive:
 * - Email addresses are NEVER exposed in user search results or public profiles.
 * - Users are discovered exclusively by `@username` or display name.
 */
class UserService {
  private userCacheById = new Map<string, Omit<User, 'email'>>();
  private userCacheByUsername = new Map<string, Omit<User, 'email'>>();
  private inFlightById = new Map<string, Promise<Omit<User, 'email'> | null>>();
  private inFlightByUsername = new Map<string, Promise<Omit<User, 'email'> | null>>();

  /**
   * Directly cache a user in-memory to prevent redundant network lookups.
   */
  public cacheUser(user: Omit<User, 'email'>): void {
    if (!user || !user.id) return;
    this.userCacheById.set(user.id, user);
    if (user.username) {
      this.userCacheByUsername.set(user.username.toLowerCase().replace(/^@/, ''), user);
    }
  }

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
          const remoteUsers: Array<Omit<User, 'email'>> = await res.json();
          for (const u of remoteUsers) {
            this.cacheUser(u);
          }
          return remoteUsers;
        }
      } catch (err) {
        console.warn('Backend search request failed, falling back to local list:', err);
      }
    }

    const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');
    if (!cleanQuery) return [];

    const allUsers = authService.getAllRegisteredUsers();

    const results = allUsers
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

    for (const u of results) {
      this.cacheUser(u);
    }

    return results;
  }

  public async getUserById(userId: string): Promise<Omit<User, 'email'> | null> {
    if (!userId) return null;

    // 1. In-memory cache hit: 0ms return
    const cached = this.userCacheById.get(userId);
    if (cached) return cached;

    // 2. Request deduplication: return existing in-flight promise
    const inFlight = this.inFlightById.get(userId);
    if (inFlight) return inFlight;

    const promise = (async () => {
      const apiBase = getApiBaseUrl();
      if (apiBase) {
        const session = authService.getCurrentSession();
        try {
          const res = await fetch(`${apiBase}/users/${userId}`, {
            headers: session ? { Authorization: `Bearer ${session.token}` } : {},
          });
          if (res.ok) {
            const user: Omit<User, 'email'> = await res.json();
            this.cacheUser(user);
            return user;
          }
        } catch (err) {
          console.warn(`Backend fetch user by id failed: ${userId}`, err);
        }
      }

      const allUsers = authService.getAllRegisteredUsers();
      const found = allUsers.find(u => u.id === userId);
      if (!found) return null;

      const user: Omit<User, 'email'> = {
        id: found.id,
        username: found.username,
        displayName: found.displayName,
        status: found.status,
        lastSeen: found.lastSeen,
        publicKeyFingerprint: found.publicKeyFingerprint,
        avatarUrl: found.avatarUrl,
      };

      this.cacheUser(user);
      return user;
    })().finally(() => {
      this.inFlightById.delete(userId);
    });

    this.inFlightById.set(userId, promise);
    return promise;
  }

  public async getUserByUsername(username: string): Promise<Omit<User, 'email'> | null> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return null;

    // 1. In-memory cache hit: 0ms return
    const cached = this.userCacheByUsername.get(clean);
    if (cached) return cached;

    // 2. Request deduplication
    const inFlight = this.inFlightByUsername.get(clean);
    if (inFlight) return inFlight;

    const promise = (async () => {
      const apiBase = getApiBaseUrl();
      if (apiBase) {
        const session = authService.getCurrentSession();
        try {
          const res = await fetch(`${apiBase}/users/username/${clean}`, {
            headers: session ? { Authorization: `Bearer ${session.token}` } : {},
          });
          if (res.ok) {
            const user: Omit<User, 'email'> = await res.json();
            this.cacheUser(user);
            return user;
          }
        } catch (err) {
          console.warn(`Backend fetch user by username failed: ${clean}`, err);
        }
      }

      const allUsers = authService.getAllRegisteredUsers();
      const found = allUsers.find(u => u.username.toLowerCase() === clean);
      if (!found) return null;

      const user: Omit<User, 'email'> = {
        id: found.id,
        username: found.username,
        displayName: found.displayName,
        status: found.status,
        lastSeen: found.lastSeen,
        publicKeyFingerprint: found.publicKeyFingerprint,
        avatarUrl: found.avatarUrl,
      };

      this.cacheUser(user);
      return user;
    })().finally(() => {
      this.inFlightByUsername.delete(clean);
    });

    this.inFlightByUsername.set(clean, promise);
    return promise;
  }
}

export const userService = new UserService();
