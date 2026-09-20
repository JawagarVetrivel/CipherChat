/**
 * Safe Logger for CipherChat Backend
 * Strictly enforces Zero-Plaintext and No-Private-Keys invariants.
 */
export declare const logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
};
