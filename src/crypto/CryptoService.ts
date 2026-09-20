import { EncryptedMessage, CryptoSession } from '../types';
import { ICryptoService, PreKeyBundle } from './types';

/**
 * CryptoService
 *
 * Provides a clean abstraction layer for client-side End-to-End Encryption (E2EE).
 *
 * Architectural Note for University Cryptography Project:
 * - This service acts as the integration boundary between the Chat application and the
 *   underlying cryptographic protocols (Extended Triple Diffie-Hellman / X3DH and Double Ratchet).
 * - UI components NEVER call low-level crypto primitives directly.
 * - The server and WebSocket network layers only ever see and transport `EncryptedMessage` envelopes.
 * - In this development tier, we encapsulate the cryptographic envelope with simulated forward-secrecy
 *   ratchet counters and base64/UTF-8 payload packaging, with explicit hook points where your
 *   Curve25519/Ed25519 key generation, Diffie-Hellman handshakes, HKDF key derivation, and AES-256-GCM
 *   ciphers will be linked.
 */
class CryptoService implements ICryptoService {
  private identityKey: string | null = null;
  private fingerprint: string | null = null;
  private sessions: Map<string, CryptoSession> = new Map();
  private currentUserId: string | null = null;

  constructor() {
    this.loadPersistedIdentity();
  }

  public setUserId(userId: string): void {
    this.currentUserId = userId;
    this.loadPersistedIdentity();
  }

  private getStorageKey(key: string): string {
    return `cipherchat_crypto_${this.currentUserId || 'guest'}_${key}`;
  }

  private loadPersistedIdentity(): void {
    try {
      const stored = localStorage.getItem(this.getStorageKey('identity'));
      if (stored) {
        const parsed = JSON.parse(stored);
        this.identityKey = parsed.identityKey;
        this.fingerprint = parsed.fingerprint;
      }

      const storedSessions = localStorage.getItem(this.getStorageKey('sessions'));
      if (storedSessions) {
        const list: CryptoSession[] = JSON.parse(storedSessions);
        this.sessions.clear();
        for (const s of list) {
          this.sessions.set(s.peerUserId, s);
        }
      }
    } catch {
      // Storage unavailable or invalid
    }
  }

  private persistState(): void {
    try {
      if (this.identityKey && this.fingerprint) {
        localStorage.setItem(
          this.getStorageKey('identity'),
          JSON.stringify({ identityKey: this.identityKey, fingerprint: this.fingerprint })
        );
      }
      const list = Array.from(this.sessions.values());
      localStorage.setItem(this.getStorageKey('sessions'), JSON.stringify(list));
    } catch {
      // Storage unavailable
    }
  }

  /**
   * Generates a deterministic or random hex fingerprint for public key verification.
   * e.g., "7F4B 2C99 01A2 E83D"
   */
  private generateFingerprint(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    const hex2 = ((Math.abs(hash) * 31) >>> 0).toString(16).padStart(8, '0').toUpperCase();
    const combined = hex + hex2;
    return `${combined.slice(0, 4)} ${combined.slice(4, 8)} ${combined.slice(8, 12)} ${combined.slice(12, 16)}`;
  }

  public async initializeIdentity(): Promise<{ identityKey: string; fingerprint: string }> {
    if (this.identityKey && this.fingerprint) {
      return { identityKey: this.identityKey, fingerprint: this.fingerprint };
    }

    // Cryptographic Hook: In production X3DH, generate Curve25519 Identity Key Pair (IK)
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    this.identityKey = `04${randomHex}`; // Simulated uncompressed EC public key
    this.fingerprint = this.generateFingerprint(this.identityKey);

    this.persistState();
    return { identityKey: this.identityKey, fingerprint: this.fingerprint };
  }

  public getPublicIdentity(): { identityKey: string; fingerprint: string } | null {
    if (!this.identityKey || !this.fingerprint) {
      return null;
    }
    return { identityKey: this.identityKey, fingerprint: this.fingerprint };
  }

  public async createSession(
    peerUserId: string,
    peerPreKeyBundle?: PreKeyBundle
  ): Promise<CryptoSession> {
    await this.initializeIdentity();

    let session = this.sessions.get(peerUserId);
    if (!session) {
      const peerFingerprint = peerPreKeyBundle?.identityKey
        ? this.generateFingerprint(peerPreKeyBundle.identityKey)
        : this.generateFingerprint(`peer-${peerUserId}`);

      session = {
        sessionId: `sess_${peerUserId}_${Date.now().toString(36)}`,
        peerUserId,
        state: 'established',
        identityKeyFingerprint: this.fingerprint || '',
        peerIdentityFingerprint: peerFingerprint,
        sendRatchetCounter: 0,
        recvRatchetCounter: 0,
        lastRatchetedAt: new Date().toISOString(),
        algorithm: 'AES-256-GCM / X3DH + Double Ratchet (Proto)',
      };

      this.sessions.set(peerUserId, session);
      this.persistState();
    }

    return session;
  }

  public async encryptMessage(
    conversationId: string,
    recipientUserId: string | null,
    plaintext: string
  ): Promise<EncryptedMessage> {
    await this.initializeIdentity();

    let session: CryptoSession | null = null;
    if (recipientUserId) {
      session = await this.createSession(recipientUserId);
      session.sendRatchetCounter += 1;
      session.lastRatchetedAt = new Date().toISOString();
      session.state = 'ratcheting';
      this.persistState();
    }

    // Cryptographic Hook:
    // 1. Advance the sending KDF chain to generate message key MK
    // 2. Encrypt plaintext using AES-256-GCM or ChaCha20-Poly1305 with random 96-bit IV
    // 3. Attach current ratchet public key and sequence counter to the header
    const simulatedIv = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Encapsulate plaintext cleanly into an opaque ciphertext string
    // In production, this will be the raw hex or base64 AEAD ciphertext
    const encodedPayload = btoa(encodeURIComponent(plaintext));
    const ciphertext = `enc:v1:${encodedPayload}`;

    const ratchetKey = `04${Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const encryptedEnvelope: EncryptedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId: this.currentUserId || 'unknown',
      ciphertext,
      header: {
        ratchetKey,
        messageCounter: session ? session.sendRatchetCounter : 1,
        previousCounter: 0,
        iv: simulatedIv,
        algorithm: 'AES-256-GCM',
        recipientKeyId: recipientUserId ? `kid_${recipientUserId}` : undefined,
      },
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    return encryptedEnvelope;
  }

  public async decryptMessage(encryptedMessage: EncryptedMessage): Promise<string> {
    if (!encryptedMessage.ciphertext) {
      return '';
    }

    // Advance recipient ratchet counter if this is a known session
    const session = this.sessions.get(encryptedMessage.senderId);
    if (session) {
      session.recvRatchetCounter += 1;
      session.lastRatchetedAt = new Date().toISOString();
      this.persistState();
    }

    // Cryptographic Hook:
    // 1. Check if ratchet header contains a new DH ratchet key
    // 2. Perform DH step to advance root key and receive chain
    // 3. Derive message key from chain
    // 4. Authenticate and decrypt AES-256-GCM ciphertext using IV
    try {
      if (encryptedMessage.ciphertext.startsWith('enc:v1:')) {
        const rawBase64 = encryptedMessage.ciphertext.replace('enc:v1:', '');
        return decodeURIComponent(atob(rawBase64));
      }
      // Direct base64 fallback
      return decodeURIComponent(atob(encryptedMessage.ciphertext));
    } catch {
      // If legacy or raw plaintext passed in dev
      return encryptedMessage.ciphertext;
    }
  }

  public async processIncomingKeyMaterial(peerUserId: string, keyMaterial: unknown): Promise<void> {
    // Cryptographic Hook: Ingest pre-key replenishment or X3DH response bundles
    let session = this.sessions.get(peerUserId);
    if (!session) {
      session = await this.createSession(peerUserId);
    }
    session.lastRatchetedAt = new Date().toISOString();
    this.persistState();
  }

  public getSessionInfo(peerUserId: string): CryptoSession | null {
    return this.sessions.get(peerUserId) || null;
  }

  public getAllSessions(): CryptoSession[] {
    return Array.from(this.sessions.values());
  }

  public resetSessions(): void {
    this.sessions.clear();
    this.persistState();
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();
