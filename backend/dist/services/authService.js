"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const client_js_1 = require("../database/client.js");
const logger_js_1 = require("../utils/logger.js");
class AuthService {
    async register(dto) {
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
        const existingEmail = await client_js_1.db.findUserByEmail(cleanEmail);
        if (existingEmail) {
            throw new Error('An account with this email already exists.');
        }
        const existingUsername = await client_js_1.db.findUserByUsername(cleanUsername);
        if (existingUsername) {
            throw new Error('This username is already taken. Please choose another.');
        }
        const passwordHash = await bcryptjs_1.default.hash(dto.password, 10);
        const now = new Date().toISOString();
        const newUser = {
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
        await client_js_1.db.createUser(newUser);
        logger_js_1.logger.info(`New user registered: @${newUser.username} (${newUser.id})`);
        const token = this.generateToken(newUser.id);
        const safeUser = {
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
    async login(dto) {
        const cleanEmail = dto.email.trim().toLowerCase();
        const user = await client_js_1.db.findUserByEmail(cleanEmail);
        if (!user || !user.passwordHash) {
            throw new Error('Invalid email or password. Please check your credentials.');
        }
        const isMatch = await bcryptjs_1.default.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid email or password. Please check your credentials.');
        }
        // Update status to online
        await client_js_1.db.updateUser(user.id, { status: 'online', lastSeen: new Date().toISOString() });
        const token = this.generateToken(user.id);
        logger_js_1.logger.info(`User logged in: @${user.username} (${user.id})`);
        const safeUser = {
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
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, env_js_1.env.JWT_SECRET, {
            expiresIn: env_js_1.env.JWT_EXPIRES_IN,
        });
    }
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map