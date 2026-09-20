"use strict";
/**
 * Safe Logger for CipherChat Backend
 * Strictly enforces Zero-Plaintext and No-Private-Keys invariants.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function formatLog(level, message, meta) {
    const timestamp = new Date().toISOString();
    // Sanitize any metadata to ensure no plaintext or secret tokens leak
    let sanitizedMeta;
    if (meta) {
        sanitizedMeta = { ...meta };
        delete sanitizedMeta.password;
        delete sanitizedMeta.passwordHash;
        delete sanitizedMeta.token;
        delete sanitizedMeta.plaintext;
        delete sanitizedMeta.privateKey;
    }
    const metaStr = sanitizedMeta && Object.keys(sanitizedMeta).length > 0 ? ` ${JSON.stringify(sanitizedMeta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}
exports.logger = {
    info(message, meta) {
        console.log(formatLog('info', message, meta));
    },
    warn(message, meta) {
        console.warn(formatLog('warn', message, meta));
    },
    error(message, meta) {
        console.error(formatLog('error', message, meta));
    },
    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatLog('debug', message, meta));
        }
    },
};
//# sourceMappingURL=logger.js.map