"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const client_js_1 = require("../database/client.js");
const logger_js_1 = require("../utils/logger.js");
class UserService {
    /**
     * Search users by username or display name.
     * STRICT PRIVACY INVARIANT: Email addresses are NEVER returned.
     */
    async searchUsers(query, currentUserId) {
        return client_js_1.db.searchUsers(query, currentUserId);
    }
    async getUserById(userId) {
        const user = await client_js_1.db.findUserById(userId);
        if (!user)
            return null;
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
    async getUserByUsername(username) {
        const user = await client_js_1.db.findUserByUsername(username);
        if (!user)
            return null;
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
    async updateProfile(userId, updates) {
        const updated = await client_js_1.db.updateUser(userId, updates);
        if (!updated) {
            throw new Error('User not found.');
        }
        logger_js_1.logger.info(`Profile updated for user: ${userId}`);
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
    async updatePresence(userId, status) {
        await client_js_1.db.updateUser(userId, {
            status,
            lastSeen: new Date().toISOString(),
        });
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=userService.js.map