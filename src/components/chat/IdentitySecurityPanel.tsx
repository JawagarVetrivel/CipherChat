import React, { useState } from 'react';
import {
  Shield,
  X,
  QrCode,
  Check,
  Clock,
  RotateCw,
  FileCode,
  KeyRound,
  Download,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { User } from '../../types';

interface IdentitySecurityPanelProps {
  peer: User;
  onClose: () => void;
}

export const IdentitySecurityPanel: React.FC<IdentitySecurityPanelProps> = ({ peer, onClose }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [disappearingTimer, setDisappearingTimer] = useState('24h');

  // Generate deterministic safety number blocks based on peer username/id
  const getSafetyBlocks = () => {
    if (peer.username === 'priya_k' || peer.displayName.includes('Priya')) {
      return ['9E4F 8801', '002C 49F7', '31A8 B44E', '7DC2 19FF', '6B10 3381', 'AA49 C0BE'];
    }
    if (peer.username === 'marcus' || peer.displayName.includes('Marcus')) {
      return ['4F2A 9912', '118C 33A9', '88D1 E722', '31AA 445B', '90E3 1188', '5C29 AA01'];
    }
    // Fallback pseudo-random blocks
    const str = peer.id + (peer.username || 'user');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    return [
      `${hex.slice(0, 4)} 8801`,
      `002C ${hex.slice(4, 8)}`,
      '31A8 B44E',
      '7DC2 19FF',
      '6B10 3381',
      'AA49 C0BE',
    ];
  };

  const safetyBlocks = getSafetyBlocks();

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(safetyBlocks.join(' '));
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  return (
    <aside className="w-80 border-l border-[#171D28] bg-[#0A0D13] flex flex-col h-full flex-shrink-0 select-none overflow-y-auto">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-[#171D28] px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#00E599]" />
          <h2 className="text-xs font-semibold text-slate-100 tracking-tight">Identity & Security</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-[#151C28] hover:text-white transition-colors"
          title="Close security panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Contact Profile Box */}
        <div className="rounded-xl border border-[#171D28] bg-[#0D1118] p-3.5 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0B281E] text-[#00E599] border border-[#00E599]/30 flex items-center justify-center font-mono font-bold text-sm flex-shrink-0">
            {peer.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-semibold text-white truncate">{peer.displayName}</h3>
            <p className="text-[11px] font-mono text-slate-400 truncate">@{peer.username}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              Principal Cryptographer · Zero Knowledge Core
            </p>
          </div>
        </div>

        {/* SESSION PARAMETERS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              SESSION PARAMETERS
            </span>
          </div>

          <div className="rounded-xl border border-[#171D28] bg-[#0D1118] p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400 text-[11px]">Key Agreement</span>
              <span className="font-mono text-[11px] text-slate-200">X25519</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400 text-[11px]">Cipher Suite</span>
              <span className="font-mono text-[11px] text-slate-200">AES-256-GCM</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400 text-[11px]">KDF Primitive</span>
              <span className="font-mono text-[11px] text-slate-200">HKDF-SHA512</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400 text-[11px]">Safety Status</span>
              <span className="font-mono text-[11px] font-medium text-[#00E599] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] inline-block animate-pulse" />
                Verified Active
              </span>
            </div>
          </div>
        </div>

        {/* SAFETY NUMBERS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              SAFETY NUMBERS
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-[#141B28] px-1.5 py-0.5 rounded border border-[#1F293D]">
              SHA-512
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            Verify fingerprints out-of-band to ensure zero MITM interception:
          </p>

          {/* Hex blocks grid (3 rows x 2 cols) */}
          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            {safetyBlocks.map((block, idx) => (
              <div
                key={idx}
                className="bg-[#0D1118] border border-[#171D28] rounded-lg py-1.5 px-2 text-center font-mono text-[11px] text-slate-200 tracking-wider hover:border-[#00E599]/30 transition-colors"
              >
                {block}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#0E131E] py-1.5 px-2 text-[11px] font-medium text-slate-200 hover:bg-[#161D2C] hover:border-[#2A354C] transition-all"
            >
              <QrCode className="h-3.5 w-3.5 text-[#00E599]" />
              <span>Compare QR</span>
            </button>
            <button
              onClick={() => setIsVerified(!isVerified)}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 px-2 text-[11px] font-medium transition-all ${
                isVerified
                  ? 'border-[#00E599]/40 bg-[#0B281E] text-[#00E599]'
                  : 'border-[#1E2638] bg-[#0E131E] text-slate-200 hover:bg-[#161D2C]'
              }`}
            >
              <Check className="h-3.5 w-3.5 text-[#00E599]" />
              <span>{isVerified ? 'Verified' : 'Mark Verified'}</span>
            </button>
          </div>
        </div>

        {/* VAULT CONTROLS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              VAULT CONTROLS
            </span>
          </div>

          <div className="rounded-xl border border-[#171D28] bg-[#0D1118] p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Disappearing timer
              </span>
              <button
                onClick={() =>
                  setDisappearingTimer(prev => (prev === '24h' ? '7d' : prev === '7d' ? 'Off' : '24h'))
                }
                className="bg-[#0B281E] text-[#00E599] border border-[#00E599]/30 text-[11px] font-mono px-2 py-0.5 rounded hover:bg-[#0E3528] transition-colors"
              >
                {disappearingTimer}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#171D28]">
              <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                <RotateCw className="h-3.5 w-3.5 text-slate-400" />
                Ratchet rekey cycle
              </span>
              <span className="font-mono text-[11px] text-slate-400">Every 50 msgs</span>
            </div>
          </div>
        </div>

        {/* SHARED ARTIFACTS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              SHARED ARTIFACTS
            </span>
            <span className="text-[10px] font-mono text-slate-500">2 files</span>
          </div>

          <div className="space-y-1.5">
            {/* Artifact 1 */}
            <div className="flex items-center justify-between rounded-lg border border-[#171D28] bg-[#0D1118] p-2 hover:border-[#20293B] transition-colors group">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded bg-[#141B28] border border-[#1F293D] flex items-center justify-center flex-shrink-0 text-[#00E599]">
                  <FileCode className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-white truncate">ratchet_protocol.ts</div>
                  <div className="text-[10px] font-mono text-slate-400">4.2 KB · TypeScript</div>
                </div>
              </div>
              <button
                className="p-1 text-slate-500 hover:text-white transition-colors"
                title="Download artifact"
                onClick={() => {
                  const blob = new Blob(['// Signal Protocol Double Ratchet E2EE specification'], {
                    type: 'text/plain',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ratchet_protocol.ts';
                  a.click();
                }}
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Artifact 2 */}
            <div className="flex items-center justify-between rounded-lg border border-[#171D28] bg-[#0D1118] p-2 hover:border-[#20293B] transition-colors group">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded bg-[#141B28] border border-[#1F293D] flex items-center justify-center flex-shrink-0 text-amber-400">
                  <KeyRound className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-white truncate">priya_pubkey_2026.pem</div>
                  <div className="text-[10px] font-mono text-slate-400">1.1 KB · Public Key</div>
                </div>
              </div>
              <button
                className="p-1 text-slate-500 hover:text-white transition-colors"
                title="Download key"
                onClick={() => {
                  const blob = new Blob(['-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE\n-----END PUBLIC KEY-----'], {
                    type: 'text/plain',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'priya_pubkey_2026.pem';
                  a.click();
                }}
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Verification Modal */}
      {showQRModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[#1F293D] bg-[#0D1118] p-5 shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white">Compare Safety QR Code</span>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Visual QR graphic */}
            <div className="mx-auto w-40 h-40 bg-white rounded-lg p-2 flex items-center justify-center shadow-lg my-3">
              <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full p-1 bg-black">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                        ? 'bg-white'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="p-2 rounded bg-[#0A0D13] border border-[#171D28] font-mono text-[11px] text-[#00E599] tracking-wider mb-3">
              {safetyBlocks.join(' ')}
            </div>
            <button
              onClick={handleCopyFingerprint}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#00E599] text-[#051E14] font-semibold text-xs py-2 hover:bg-[#00F5A3] transition-all"
            >
              {copiedFingerprint ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedFingerprint ? 'Fingerprint Copied' : 'Copy Verification Hash'}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

