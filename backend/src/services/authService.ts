import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../database/client.js';
import { AuthUser, User } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export class AuthService {
  public async register(dto: RegisterDto): Promise<AuthResult> {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanUsername = dto.username.trim().toLowerCase().replace(/^@/, '');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      throw new Error('Username can only contain alphanumeric characters and underscores.');
    }
    if (dto.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const existingEmail = await db.findUserByEmail(cleanEmail);
    if (existingEmail) {
      throw new Error('An account with this email already exists.');
    }

    const existingUsername = await db.findUserByUsername(cleanUsername);
    if (existingUsername) {
      throw new Error('This username is already taken. Please choose another.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const now = new Date().toISOString();

    const newUser: User = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      displayName: dto.displayName.trim() || cleanUsername,
      email: cleanEmail,
      passwordHash,
      status: 'online',
      lastSeen: now,
      publicKeyFingerprint: 'E8A2 4B19 CC03 55FA',
      createdAt: now,
      updatedAt: now,
    };

    await db.createUser(newUser);
    logger.info(`New user registered: @${newUser.username} (${newUser.id})`);

    const token = this.generateToken(newUser.id);

    const safeUser: AuthUser = {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      email: newUser.email,
      status: newUser.status,
      lastSeen: newUser.lastSeen,
      publicKeyFingerprint: newUser.publicKeyFingerprint,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return { user: safeUser, token };
  }

  public async login(dto: LoginDto): Promise<AuthResult> {
    const cleanEmail = dto.email.trim().toLowerCase();
    const user = await db.findUserByEmail(cleanEmail);

    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    // Update status to online
    await db.updateUser(user.id, { status: 'online', lastSeen: new Date().toISOString() });

    const token = this.generateToken(user.id);
    logger.info(`User logged in: @${user.username} (${user.id})`);

    const safeUser: AuthUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      status: 'online',
      lastSeen: new Date().toISOString(),
      publicKeyFingerprint: user.publicKeyFingerprint,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: safeUser, token };
  }

  public generateToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  public verifyToken(token: string): { userId: string } {
    return jwt.verify(token, env.JWT_SECRET) as { userId: string };
  }
}

export const authService = new AuthService();
