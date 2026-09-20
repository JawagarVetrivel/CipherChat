import { EncryptedMessage, CryptoSession } from '../types';

export interface IdentityKeyPair {
  publicKey: string;
  fingerprint: string;
  created: string;
}

export interface PreKeyBundle {
  identityKey: string;
  signedPreKey: string;
  signature: string;
  oneTimePreKey?: string;
}

export interface ICryptoService {
  /**
   * Initializes local cryptographic identity key pair on the client.
   * Stores key material strictly in secure client storage.
   */
  initializeIdentity(): Promise<{ identityKey: string; fingerprint: string }>;

  /**
   * Returns public identity information (never exposes private keys).
   */
  getPublicIdentity(): { identityKey: string; fingerprint: string } | null;

  /**
   * Establishes a cryptographic session with a peer (X3DH handshake placeholder).
   */
  createSession(peerUserId: string, peerPreKeyBundle?: PreKeyBundle): Promise<CryptoSession>;

  /**
   * Encrypts plaintext message into an EncryptedMessage envelope.
   * Ratchets the sending key chain forward for forward secrecy.
   */
  encryptMessage(
    conversationId: string,
    recipientUserId: string | null,
    plaintext: string
  ): Promise<EncryptedMessage>;

  /**
   * Decrypts an EncryptedMessage envelope into plaintext in client memory.
   * Advances the receiving ratchet chain.
   */
  decryptMessage(encryptedMessage: EncryptedMessage): Promise<string>;

  /**
   * Ingests incoming key material (e.g. pre-key updates or ephemeral ratchet keys).
   */
  processIncomingKeyMaterial(peerUserId: string, keyMaterial: unknown): Promise<void>;

  /**
   * Retrieves active session details for security auditing and fingerprint verification.
   */
  getSessionInfo(peerUserId: string): CryptoSession | null;

  /**
   * Retrieves all active sessions for the security settings panel.
   */
  getAllSessions(): CryptoSession[];
}
