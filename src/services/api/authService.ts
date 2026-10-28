import { User } from '../../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Default pre-seeded testing users
export const DEFAULT_USERS: Array<User & { passwordHash: string; email: string }> = [
  {
    id: 'a1111111-1111-4111-a111-111111111111',
    username: 'rahul123',
    displayName: 'Rahul Sharma',
    email: 'rahul@university.edu',
    passwordHash: 'password123',
    status: 'online',
    publicKeyFingerprint: '8F21 A4BC 9901 3E7D',
    avatarUrl: '',
  },
  {
    id: 'b2222222-2222-4222-b222-222222222222',
    username: 'priya_k',
    displayName: 'Priya Kapoor',
    email: 'priya@university.edu',
    passwordHash: 'password123',
    status: 'away',
    publicKeyFingerprint: 'B391 7CD4 12EE 8840',
    avatarUrl: '',
  },
  {
    id: 'c3333333-3333-4333-c333-333333333333',
    username: 'crypto_prof',
    displayName: 'Prof. Alan Vance',
    email: 'vance@university.edu',
    passwordHash: 'password123',
    status: 'offline',
    publicKeyFingerprint: '44FA 1982 CD30 67BA',
    avatarUrl: '',
  },
  {
    id: 'd4444444-4444-4444-d444-444444444444',
    username: 'alex_c',
    displayName: 'Alex Chen',
    email: 'alex@university.edu',
    passwordHash: 'password123',
    status: 'online',
    publicKeyFingerprint: '6E09 82F1 55AB 2994',
    avatarUrl: '',
  },
];

const STORAGE_USERS_KEY = 'cipherchat_registered_users';
const STORAGE_SESSION_KEY = 'cipherchat_auth_session';

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, '');
  return 'https://cipherchat-rtn2.onrender.com/api';
};

/**
 * AuthService
 *
 * Clean authentication abstraction for CipherChat.
 * Manages identity, registration, session persistence, and testing user states.
 */
class AuthService {
  private users: Array<User & { passwordHash: string; email: string }> = [];

  constructor() {
    this.initUsers();
  }

  /**
   * Initialize user state:
   * Retains only default testing users, clearing non-testing accounts so you can register fresh.
   */
  private initUsers(): void {
    try {
      // Default to the testing users only
      this.users = DEFAULT_USERS.map(u => ({ ...u }));
      this.saveUsers();

      // Trigger backend cleanup in background to remove any remote non-testing accounts
      this.cleanupRemoteNonTestUsers().catch(() => {});
    } catch {
      this.users = DEFAULT_USERS.map(u => ({ ...u }));
    }
  }

  public async cleanupRemoteNonTestUsers(): Promise<void> {
    const apiBase = getApiBaseUrl();
    if (apiBase) {
      try {
        await fetch(`${apiBase}/auth/cleanup-users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        // ignore offline
      }
    }
  }

  private saveUsers(): void {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.users));
    } catch {
      // Storage unavailable
    }
  }

  public async register(payload: RegisterPayload): Promise<AuthResponse> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanUsername = payload.username.trim().toLowerCase().replace(/^@/, '');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid university or personal email address.');
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      throw new Error('Username can only contain alphanumeric characters and underscores.');
    }
    if (payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Check reserved test usernames
    const isReservedTestEmail = DEFAULT_USERS.some(u => u.email.toLowerCase() === cleanEmail);
    if (isReservedTestEmail) {
      throw new Error('This email is reserved for testing accounts. Please use another email or click quick login.');
    }
    const isReservedTestUsername = DEFAULT_USERS.some(u => u.username.toLowerCase() === cleanUsername);
    if (isReservedTestUsername) {
      throw new Error('This username is reserved for testing accounts. Please choose another username.');
    }

    const apiBase = getApiBaseUrl();
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          this.persistSession(data.user, data.token);
          return data;
        }
      } catch {
        // Fallback to local registration if backend fails
      }
    }

    // Local registration / recreation
    // Remove any previous non-test user matching this email or username to allow re-creation!
    this.users = this.users.filter(
      u => u.email.toLowerCase() !== cleanEmail && u.username.toLowerCase() !== cleanUsername
    );

    const newUser: User & { passwordHash: string; email: string } = {
      id: `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      username: cleanUsername,
      displayName: payload.displayName.trim() || cleanUsername,
      email: cleanEmail,
      passwordHash: payload.password,
      status: 'online',
      publicKeyFingerprint: 'E8A2 4B19 CC03 55FA',
    };

    this.users.push(newUser);
    this.saveUsers();

    const token = `jwt_sim_${newUser.id}_${Date.now()}`;
    const userSafe: User = {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      email: newUser.email,
      status: newUser.status,
      publicKeyFingerprint: newUser.publicKeyFingerprint,
    };

    this.persistSession(userSafe, token);
    return { user: userSafe, token };
  }

  public async login(payload: LoginPayload): Promise<AuthResponse> {
    const cleanEmail = payload.email.trim().toLowerCase();

    const apiBase = getApiBaseUrl();
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          this.persistSession(data.user, data.token);
          return data;
        }
      } catch {
        // Fallback to local login
      }
    }

    // Local login
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user || user.passwordHash !== payload.password) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    const token = `jwt_sim_${user.id}_${Date.now()}`;
    const userSafe: User = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      status: 'online',
      publicKeyFingerprint: user.publicKeyFingerprint,
    };

    this.persistSession(userSafe, token);
    return { user: userSafe, token };
  }

  public getCurrentSession(): AuthResponse | null {
    try {
      const stored = localStorage.getItem(STORAGE_SESSION_KEY);
      if (stored) {
        const session: AuthResponse = JSON.parse(stored);
        if (session.user) {
          if (session.user.username === 'rahul123' && session.user.id === 'user_rahul') {
            session.user.id = 'a1111111-1111-4111-a111-111111111111';
          } else if (session.user.username === 'priya_k' && session.user.id === 'user_priya') {
            session.user.id = 'b2222222-2222-4222-b222-222222222222';
          }
        }
        return session;
      }
    } catch {
      return null;
    }
    return null;
  }

  public persistSession(user: User, token: string): void {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({ user, token }));
    } catch {
      // Storage unavailable
    }
  }

  public async updateProfile(userId: string, updates: { displayName?: string }): Promise<User> {
    const apiBase = getApiBaseUrl();
    const session = this.getCurrentSession();
    if (apiBase && session) {
      try {
        const res = await fetch(`${apiBase}/users/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (res.ok) {
          this.persistSession(data, session.token);
          return data;
        }
      } catch {
        // Local fallback
      }
    }

    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    if (updates.displayName) {
      user.displayName = updates.displayName.trim();
    }
    this.saveUsers();

    const updatedSafe: User = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      status: user.status,
      publicKeyFingerprint: user.publicKeyFingerprint,
    };

    const activeSession = this.getCurrentSession();
    if (activeSession && activeSession.user.id === userId) {
      this.persistSession(updatedSafe, activeSession.token);
    }

    return updatedSafe;
  }

  public logout(): void {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // ignore
    }
  }

  public getAllRegisteredUsers(): Array<User & { email: string }> {
    return this.users;
  }
}

export const authService = new AuthService();
