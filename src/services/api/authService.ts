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

// Default pre-seeded users for local development and demonstration
const DEFAULT_USERS: Array<User & { passwordHash: string; email: string }> = [
  {
    id: 'user_rahul',
    username: 'rahul123',
    displayName: 'Rahul Sharma',
    email: 'rahul@university.edu',
    passwordHash: 'password123',
    status: 'online',
    publicKeyFingerprint: '8F21 A4BC 9901 3E7D',
    avatarUrl: '',
  },
  {
    id: 'user_priya',
    username: 'priya_k',
    displayName: 'Priya Kapoor',
    email: 'priya@university.edu',
    passwordHash: 'password123',
    status: 'away',
    publicKeyFingerprint: 'B391 7CD4 12EE 8840',
    avatarUrl: '',
  },
  {
    id: 'user_prof',
    username: 'crypto_prof',
    displayName: 'Prof. Alan Vance',
    email: 'vance@university.edu',
    passwordHash: 'password123',
    status: 'offline',
    publicKeyFingerprint: '44FA 1982 CD30 67BA',
    avatarUrl: '',
  },
  {
    id: 'user_alex',
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

/**
 * AuthService
 *
 * Clean authentication abstraction for CipherChat.
 * Designed to connect to Supabase / Render backend in production.
 */
class AuthService {
  private users: Array<User & { passwordHash: string; email: string }> = [];

  constructor() {
    this.initUsers();
  }

  private initUsers(): void {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        this.users = JSON.parse(stored);
      } else {
        this.users = [...DEFAULT_USERS];
        this.saveUsers();
      }
    } catch {
      this.users = [...DEFAULT_USERS];
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
    // Normalization & Validation
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

    // Check existing
    const existingEmail = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      throw new Error('An account with this email already exists.');
    }

    const existingUsername = this.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existingUsername) {
      throw new Error('This username is already taken. Please choose another.');
    }

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
        return JSON.parse(stored);
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

    const session = this.getCurrentSession();
    if (session && session.user.id === userId) {
      this.persistSession(updatedSafe, session.token);
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
