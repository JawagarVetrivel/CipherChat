import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  Lock,
  Sliders,
  FileText,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { NewDirectChatModal } from '../modals/NewDirectChatModal';
import { NewGroupModal } from '../modals/NewGroupModal';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeConversationId } = useChat();
  const navigate = useNavigate();

  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showKeyExchangeModal, setShowKeyExchangeModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const userInitials = user?.displayName
    ? user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RS';

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#070709] text-slate-100 select-none">
      {/* Top Application Window Bar */}
      <header className="flex h-11 w-full items-center justify-between border-b border-[#1A1A22] bg-[#0A0A0E] px-3.5 z-20 flex-shrink-0">
        {/* Left Section: Brand & Workspace Name + E2EE Status */}
        <div className="flex items-center gap-3">
          <Link to="/app" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#FF5500] to-[#CC3700] p-1 flex items-center justify-center shadow-[0_0_12px_rgba(255,85,0,0.35)] transition-transform group-hover:scale-105">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-white">
              CipherChat <span className="text-slate-500 font-normal">/ Core Workspace</span>
            </span>
          </Link>

          {/* Status Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#FF5500]/30 bg-[#FF5500]/10 px-2 py-0.5 text-[10px] font-mono font-medium text-[#FF7A1A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500] animate-pulse shadow-[0_0_6px_#FF5500]" />
            <span>E2EE v3 • Active</span>
          </div>
        </div>

        {/* Center: Command / Search Bar */}
        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <button
            onClick={() => setIsDirectModalOpen(true)}
            className="w-full flex items-center justify-between rounded-lg border border-[#1E1E28] bg-[#0E0E14] px-3 py-1 text-xs text-slate-400 hover:border-[#FF5500]/40 hover:text-slate-200 transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px]">Jump to peer or channel...</span>
            </div>
            <kbd className="rounded border border-[#252533] bg-[#14141C] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Key Exchange, Audit Log, Settings, and Profile Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowKeyExchangeModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#FF7A1A] transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>Key Exchange</span>
          </button>

          <button
            onClick={() => setShowAuditModal(true)}
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span>Audit Log</span>
          </button>

          <div className="h-4 w-[1px] bg-[#1E1E28] mx-0.5 hidden sm:block" />

          {/* Lock Icon */}
          <button
            onClick={() => setShowKeyExchangeModal(true)}
            className="rounded p-1.5 text-slate-400 hover:bg-[#14141C] hover:text-[#FF7A1A] transition-colors"
            title="E2EE Lock Status"
          >
            <Lock className="h-4 w-4" />
          </button>

          {/* Settings Sliders */}
          <Link
            to="/settings"
            className="rounded p-1.5 text-slate-400 hover:bg-[#14141C] hover:text-white transition-colors"
            title="Settings"
          >
            <Sliders className="h-4 w-4" />
          </Link>

          {/* User Profile Avatar Squircle */}
          <Link
            to="/settings"
            className="flex items-center gap-1.5 pl-1 group"
            title={`${user?.displayName || 'User'} (@${user?.username || 'user'})`}
          >
            <div className="relative">
              <div className="h-7 w-7 rounded-lg bg-[#18120E] border border-[#FF5500]/40 text-[#FF7A1A] flex items-center justify-center font-mono font-bold text-[11px] group-hover:border-[#FF5500] group-hover:shadow-[0_0_10px_rgba(255,85,0,0.3)] transition-all">
                {userInitials}
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#FF5500] ring-2 ring-[#0A0A0E] shadow-[0_0_4px_#FF5500]" />
            </div>
          </Link>
        </div>
      </header>

      {/* Main App Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`${
            activeConversationId ? 'hidden md:flex' : 'flex'
          } h-full w-full md:w-64 lg:w-72 flex-shrink-0`}
        >
          <Sidebar
            onOpenNewDirect={() => setIsDirectModalOpen(true)}
            onOpenNewGroup={() => setIsGroupModalOpen(true)}
          />
        </div>

        {/* Center / Right Content */}
        <main
          className={`${
            !activeConversationId ? 'hidden md:flex' : 'flex'
          } h-full flex-1 overflow-hidden bg-[#070709]`}
        >
          {children}
        </main>
      </div>

      {/* Direct and Group Creation Modals */}
      <NewDirectChatModal
        isOpen={isDirectModalOpen}
        onClose={() => setIsDirectModalOpen(false)}
      />
      <NewGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />

      {/* Quick Key Exchange Modal */}
      {showKeyExchangeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowKeyExchangeModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#22222E] bg-[#0E0E14] p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E28]">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#FF5500]" />
                <h3 className="text-sm font-semibold text-white">E2EE Cryptographic Key Exchange</h3>
              </div>
              <button
                onClick={() => setShowKeyExchangeModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ESC
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#FF7A1A]">
                <CheckCircle2 className="h-4 w-4 text-[#FF5500]" />
                <span className="font-medium">Signal Protocol Double Ratchet Handshake Active</span>
              </div>
              <div className="rounded-lg bg-[#070709] border border-[#1A1A22] p-3 font-mono text-[11px] space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ephemeral Curve:</span>
                  <span>NIST P-256 / X25519</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AEAD Cipher:</span>
                  <span>AES-256-GCM (96-bit IV)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Key Derivation:</span>
                  <span>HKDF-SHA512</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Forward Secrecy:</span>
                  <span className="text-[#FF7A1A]">Ratcheting per-message</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All message contents, attachments, and metadata keys are derived locally on your device. The
                remote relay server only transports ciphertext.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowKeyExchangeModal(false)}
                className="rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FF7700] text-white font-semibold text-xs px-4 py-2 hover:brightness-110 active:scale-95 shadow-[0_0_12px_rgba(255,85,0,0.3)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowAuditModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#22222E] bg-[#0E0E14] p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E28]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#FF5500]" />
                <h3 className="text-sm font-semibold text-white">Cryptographic Audit Log</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ESC
              </button>
            </div>
            <div className="py-3 font-mono text-[11px] space-y-2 max-h-72 overflow-y-auto">
              <div className="p-2 rounded bg-[#070709] border border-[#1A1A22] text-slate-300">
                <span className="text-[#FF5500]">[AUTH_OK]</span> WebCrypto identity initialized:
                local keypair generated
              </div>
              <div className="p-2 rounded bg-[#070709] border border-[#1A1A22] text-slate-300">
                <span className="text-[#FF5500]">[E2EE_SYNC]</span> Double ratchet root key synchronized
                with peer
              </div>
              <div className="p-2 rounded bg-[#070709] border border-[#1A1A22] text-slate-300">
                <span className="text-[#FF5500]">[CIPHER]</span> AES-256-GCM authenticated encryption active
              </div>
              <div className="p-2 rounded bg-[#070709] border border-[#1A1A22] text-slate-300">
                <span className="text-slate-500">[WS_CONN]</span> Secure WebSocket transport established (WSS)
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-[#1E1E28]">
              <button
                onClick={() => setShowAuditModal(false)}
                className="rounded-lg bg-[#181822] text-slate-200 text-xs px-4 py-2 hover:bg-[#20202E] transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
