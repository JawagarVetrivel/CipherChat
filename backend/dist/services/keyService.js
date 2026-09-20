"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyService = exports.KeyService = void 0;
const client_js_1 = require("../database/client.js");
const logger_js_1 = require("../utils/logger.js");
class KeyService {
    /**
     * Registers a public cryptographic key for a user (e.g. Identity Key, Signed Pre-Key, One-Time Pre-Key).
     * STRICT SECURITY INVARIANT: Only PUBLIC keys are stored. Private keys must NEVER be sent to or stored by backend.
     */
    async registerPublicKey(dto) {
        if (!dto.publicKey || !dto.publicKey.trim()) {
            throw new Error('Public key data cannot be empty.');
        }
        const keyRecord = {
            id: crypto.randomUUID(),
            userId: dto.userId,
            keyType: dto.keyType,
            publicKey: dto.publicKey.trim(),
            isActive: true,
            createdAt: new Date().toISOString(),
            expiresAt: dto.expiresAt,
        };
        await client_js_1.db.savePublicKey(keyRecord);
        logger_js_1.logger.info(`Stored public key [${keyRecord.id}] of type "${keyRecord.keyType}" for user ${dto.userId}`);
        return keyRecord;
    }
    /**
     * Returns active public keys for a peer user to initiate an X3DH handshake session.
     */
    async getPublicKeysForUser(userId) {
        return client_js_1.db.getPublicKeysForUser(userId);
    }
}
exports.KeyService = KeyService;
exports.keyService = new KeyService();
//# sourceMappingURL=keyService.js.map