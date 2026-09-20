import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, Lock, Key } from 'lucide-react';
import { EncryptedMessage } from '../../types';

interface CryptoInspectorModalProps {
  envelope: EncryptedMessage | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CryptoInspectorModal: React.FC<CryptoInspectorModalProps> = ({
  envelope,
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !envelope) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      id="crypto-inspector-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="crypto-inspector-modal"
        className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              E2EE Envelope Inspector
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="rounded-lg bg-emerald-50/70 p-3 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50">
            <p className="font-medium flex items-center gap-1.5 mb-1">
              <Lock className="h-3.5 w-3.5" />
              Wire Representation (Server Zero-Knowledge)
            </p>
            <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
              This is the exact JSON structure transmitted across the WebSocket and stored in the database.
              The backend server never possesses the plaintext or cryptographic session keys.
            </p>
          </div>

          {/* Ciphertext */}
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Ciphertext (Encrypted Payload)
              </span>
              <button
                onClick={() => copyToClipboard(envelope.ciphertext, 'ciphertext')}
                className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {copiedField === 'ciphertext' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedField === 'ciphertext' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-neutral-900 text-neutral-100 font-mono text-[11px] overflow-x-auto break-all select-all dark:bg-neutral-950 dark:border dark:border-neutral-800">
              {envelope.ciphertext}
            </pre>
          </div>

          {/* Ratchet Header metadata */}
          <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
            <span className="font-medium text-neutral-800 dark:text-neutral-200 block mb-2 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-neutral-500" />
              Double Ratchet Header
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-neutral-500 block">Algorithm</span>
                <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                  {envelope.header.algorithm || 'AES-256-GCM'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Ratchet Step (Counter)</span>
                <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                  #{envelope.header.messageCounter ?? 1}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Initialization Vector (IV)</span>
                <span className="font-mono text-neutral-700 dark:text-neutral-300 truncate block">
                  {envelope.header.iv || '96-bit random nonce'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Ephemeral Ratchet Key</span>
                <span className="font-mono text-neutral-700 dark:text-neutral-300 truncate block">
                  {envelope.header.ratchetKey || 'Curve25519 DH'}
                </span>
              </div>
            </div>
          </div>

          {/* Full Raw Envelope JSON */}
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Full Wire Envelope JSON
              </span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(envelope, null, 2), 'json')}
                className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {copiedField === 'json' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedField === 'json' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-neutral-100 text-neutral-800 font-mono text-[10px] overflow-x-auto max-h-36 dark:bg-neutral-950 dark:text-neutral-300 dark:border dark:border-neutral-800">
              {JSON.stringify(envelope, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-3 text-right dark:border-neutral-800 dark:bg-neutral-950">
          <button
            onClick={onClose}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
