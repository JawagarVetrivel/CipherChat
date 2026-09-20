"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireConversationMember = requireConversationMember;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const client_js_1 = require("../database/client.js");
const logger_js_1 = require("../utils/logger.js");
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Authentication token required.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
        const user = await client_js_1.db.findUserById(decoded.userId);
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
    }
    catch (err) {
        logger_js_1.logger.warn('Token validation failed', { error: String(err) });
        res.status(403).json({ error: 'Invalid or expired authentication token.' });
    }
}
/**
 * Authorization Guard:
 * Ensures the authenticated user is an authorized member of the requested conversation.
 */
function requireConversationMember(paramName = 'id') {
    return async (req, res, next) => {
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
        const conversation = await client_js_1.db.getConversationById(conversationId);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found.' });
            return;
        }
        // Check membership
        let isMember = false;
        if (conversation.type === 'direct') {
            const d = conversation;
            isMember = d.participant.id === userId || d.id.includes(userId);
        }
        else {
            const g = conversation;
            isMember = g.members.some((m) => m.userId === userId);
        }
        if (!isMember) {
            res.status(403).json({ error: 'Access denied. You are not a member of this conversation.' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=authMiddleware.js.map