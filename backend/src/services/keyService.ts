import { db } from '../database/client.js';
import { PublicKeyRecord } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface RegisterPublicKeyDto {
  userId: string;
  keyType: 'identity' | 'signed_prekey' | 'one_time_prekey';
  publicKey: string;
  expiresAt?: string;
}

export class KeyService {
  /**
   * Registers a public cryptographic key for a user (e.g. Identity Key, Signed Pre-Key, One-Time Pre-Key).
   * STRICT SECURITY INVARIANT: Only PUBLIC keys are stored. Private keys must NEVER be sent to or stored by backend.
   */
  public async registerPublicKey(dto: RegisterPublicKeyDto): Promise<PublicKeyRecord> {
    if (!dto.publicKey || !dto.publicKey.trim()) {
      throw new Error('Public key data cannot be empty.');
    }

    const keyRecord: PublicKeyRecord = {
      id: crypto.randomUUID(),
      userId: dto.userId,
      keyType: dto.keyType,
      publicKey: dto.publicKey.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: dto.expiresAt,
    };

    await db.savePublicKey(keyRecord);
    logger.info(`Stored public key [${keyRecord.id}] of type "${keyRecord.keyType}" for user ${dto.userId}`);
    return keyRecord;
  }

  /**
   * Returns active public keys for a peer user to initiate an X3DH handshake session.
   */
  public async getPublicKeysForUser(userId: string): Promise<PublicKeyRecord[]> {
    return db.getPublicKeysForUser(userId);
  }
}

export const keyService = new KeyService();
