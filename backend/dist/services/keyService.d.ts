import { PublicKeyRecord } from '../types/index.js';
export interface RegisterPublicKeyDto {
    userId: string;
    keyType: 'identity' | 'signed_prekey' | 'one_time_prekey';
    publicKey: string;
    expiresAt?: string;
}
export declare class KeyService {
    /**
     * Registers a public cryptographic key for a user (e.g. Identity Key, Signed Pre-Key, One-Time Pre-Key).
     * STRICT SECURITY INVARIANT: Only PUBLIC keys are stored. Private keys must NEVER be sent to or stored by backend.
     */
    registerPublicKey(dto: RegisterPublicKeyDto): Promise<PublicKeyRecord>;
    /**
     * Returns active public keys for a peer user to initiate an X3DH handshake session.
     */
    getPublicKeysForUser(userId: string): Promise<PublicKeyRecord[]>;
}
export declare const keyService: KeyService;
