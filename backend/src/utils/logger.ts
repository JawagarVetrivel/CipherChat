/**
 * Safe Logger for CipherChat Backend
 * Strictly enforces Zero-Plaintext and No-Private-Keys invariants.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  // Sanitize any metadata to ensure no plaintext or secret tokens leak
  let sanitizedMeta: Record<string, unknown> | undefined;
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

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(formatLog('info', message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(formatLog('warn', message, meta));
  },
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(formatLog('error', message, meta));
  },
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', message, meta));
    }
  },
};
