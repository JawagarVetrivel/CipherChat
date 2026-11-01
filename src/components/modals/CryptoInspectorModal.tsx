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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="crypto-inspector-modal"
        className="w-full max-w-lg rounded-2xl border border-[#22222E] bg-[#0E0E14] shadow-[0_0_35px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E28] px-5 py-3.5 bg-[#0A0A0E]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#FF5500]" />
            <h2 className="text-xs font-semibold text-white tracking-tight">
              E2EE Envelope Inspector
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-[#181822] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="rounded-xl bg-[#FF5500]/10 p-3.5 text-[#FFA040] border border-[#FF5500]/30 shadow-[0_0_15px_rgba(255,85,0,0.1)]">
            <p className="font-semibold flex items-center gap-1.5 mb-1 font-mono text-[#FF7A1A]">
              <Lock className="h-3.5 w-3.5 text-[#FF5500]" />
              Wire Representation (Server Zero-Knowledge)
            </p>
            <p className="text-[11px] leading-relaxed text-slate-300">
              This is the exact JSON structure transmitted across the WebSocket and stored on the server.
              The backend server only acts as a blind relay and never possesses plaintext or cryptographic keys.
            </p>
          </div>

          {/* Ciphertext */}
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                CIPHERTEXT (ENCRYPTED AEAD PAYLOAD)
              </span>
              <button
                onClick={() => copyToClipboard(envelope.ciphertext, 'ciphertext')}
                className="flex items-center gap-1 text-[11px] font-mono text-[#FF7A1A] hover:underline"
              >
                {copiedField === 'ciphertext' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedField === 'ciphertext' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#070709] text-[#FFA040] font-mono text-[11px] border border-[#1E1E28] overflow-x-auto break-all select-all">
              {envelope.ciphertext}
            </pre>
          </div>

          {/* Ratchet Header metadata */}
          <div className="space-y-2 rounded-xl border border-[#1E1E28] bg-[#070709] p-3.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-[#FF5500]" />
              DOUBLE RATCHET PROTOCOL HEADER
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-[#0E0E14] border border-[#1E1E28]">
                <span className="text-slate-500 block text-[9px]">ALGORITHM</span>
                <span className="font-medium text-white">
                  {envelope.header.algorithm || 'AES-256-GCM'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0E0E14] border border-[#1E1E28]">
                <span className="text-slate-500 block text-[9px]">RATCHET STEP</span>
                <span className="font-medium text-[#FFA040]">
                  #{envelope.header.messageCounter ?? 1}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0E0E14] border border-[#1E1E28]">
                <span className="text-slate-500 block text-[9px]">INITIALIZATION VECTOR (IV)</span>
                <span className="text-slate-300 truncate block">
                  {envelope.header.iv || '96-bit random nonce'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0E0E14] border border-[#1E1E28]">
                <span className="text-slate-500 block text-[9px]">EPHEMERAL RATCHET KEY</span>
                <span className="text-slate-300 truncate block">
                  {envelope.header.ratchetKey || 'Curve25519 DH'}
                </span>
              </div>
            </div>
          </div>

          {/* Full Raw Envelope JSON */}
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                RAW WIRE ENVELOPE (JSON)
              </span>
              <button
                onClick={() =>
                  copyToClipboard(JSON.stringify(envelope, null, 2), 'envelope')
                }
                className="flex items-center gap-1 text-[11px] font-mono text-[#FF7A1A] hover:underline"
              >
                {copiedField === 'envelope' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedField === 'envelope' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#070709] text-slate-300 font-mono text-[10px] border border-[#1E1E28] max-h-48 overflow-y-auto select-all">
              {JSON.stringify(envelope, null, 2)}
            </pre>
          </div>
        </div>

        <div className="border-t border-[#1E1E28] px-5 py-3 bg-[#0A0A0E] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FF7700] text-white px-4 py-1.5 text-xs font-semibold hover:brightness-110 active:scale-95 shadow-[0_0_12px_rgba(255,85,0,0.3)] transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
