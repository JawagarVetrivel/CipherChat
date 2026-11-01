import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Key,
  LogOut,
  Check,
  Copy,
  Terminal,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { cryptoService } from '../crypto/CryptoService';
import { wsClient } from '../services/websocket/WebSocketClient';
import { CryptoSession } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { connectionStatus } = useChat();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [identity, setIdentity] = useState<{ identityKey: string; fingerprint: string } | null>(null);
  const [sessions, setSessions] = useState<CryptoSession[]>([]);

  useEffect(() => {
    cryptoService.initializeIdentity().then((id) => {
      setIdentity(id);
      setSessions(cryptoService.getAllSessions());
    });
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSavingName(true);
    try {
      await updateProfile(displayName.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCopyFingerprint = () => {
    if (!identity?.fingerprint) return;
    navigator.clipboard.writeText(identity.fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RS';

  return (
    <div className="min-h-screen bg-[#070709] text-slate-100 select-none pb-12 relative overflow-hidden">
      {/* Ambient glowing horizon at the bottom */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#FF5500]/15 via-[#FF3300]/5 to-transparent blur-3xl -z-10" />

      {/* Top Header */}
      <header className="flex h-11 items-center justify-between border-b border-[#1A1A24] bg-[#0A0A0E]/90 px-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            id="settings-back-button"
            to="/app"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-400 hover:bg-[#14141E] hover:text-white transition-colors text-xs font-mono"
          >
            <ArrowLeft className="h-4 w-4 text-[#FF5500]" />
            <span>Back to Workspace</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#FF7A1A] bg-[#FF5500]/10 border border-[#FF5500]/30 px-2 py-0.5 rounded-md">
            Security Vault Active
          </span>
          <Link
            to="/app"
            className="rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FF7700] text-white font-semibold text-xs px-3.5 py-1 shadow-lg shadow-[#FF5500]/25 hover:from-[#FF6600] hover:to-[#FF8800] transition-all"
          >
            Done
          </Link>
        </div>
      </header>

      {/* Main Content Sections */}
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Account Section */}
        <section
          id="settings-account-section"
          className="rounded-xl border border-[#1A1A24] bg-[#0D0D12] p-5 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1A1A24]">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              IDENTITY & CREDENTIALS
            </span>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-[#18100C] text-[#FF7A1A] border border-[#FF5500]/30 flex items-center justify-center font-mono font-bold text-base flex-shrink-0 shadow-inner">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">
                {user?.displayName}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                @{user?.username}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {user?.email}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
            <div>
              <label
                htmlFor="settings-display-name"
                className="block text-xs font-mono text-slate-300 mb-1"
              >
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  id="settings-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 rounded-lg border border-[#22222E] bg-[#0A0A0E] px-3 py-1.5 text-xs text-white focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500]/40 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isSavingName || !displayName.trim()}
                  className="rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FF7700] text-white font-semibold px-3 py-1.5 text-xs hover:from-[#FF6600] hover:to-[#FF8800] disabled:opacity-50 flex items-center gap-1 shadow-md shadow-[#FF5500]/20 transition-all"
                >
                  {saveSuccess && <Check className="h-3.5 w-3.5" />}
                  <span>{isSavingName ? 'Saving...' : saveSuccess ? 'Saved' : 'Update'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500 block mb-0.5 text-[10px] font-mono">PEER HANDLE</span>
                <span className="font-mono text-slate-300">
                  @{user?.username}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 text-[10px] font-mono">ENCRYPTED EMAIL</span>
                <span className="font-mono text-slate-300 truncate block">
                  {user?.email}
                </span>
              </div>
            </div>
          </form>
        </section>

        {/* Security & Cryptography Section */}
        <section
          id="settings-security-section"
          className="rounded-xl border border-[#1A1A24] bg-[#0D0D12] p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A24]">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#FF5500]" />
              <h2 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                SECURITY & CRYPTOGRAPHY
              </h2>
            </div>
            <div className="text-[10px] font-mono text-[#FF7A1A] bg-[#FF5500]/10 border border-[#FF5500]/30 px-2 py-0.5 rounded-md">
              E2EE Architecture Ready
            </div>
          </div>

          <div className="space-y-4">
            {/* Identity Key Fingerprint */}
            <div className="rounded-xl border border-[#1A1A24] bg-[#0A0A0E] p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-[#FF5500]" />
                  Public Identity Key Fingerprint (SHA-256)
                </span>
                <button
                  onClick={handleCopyFingerprint}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#FF7A1A] hover:text-[#FFA040] transition-colors"
                >
                  {copiedFingerprint ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedFingerprint ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0D0D12] border border-[#22222E] font-mono text-xs text-[#FF8800] tracking-wider select-all">
                {identity?.fingerprint || 'Initializing local identity key...'}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Compare this security fingerprint with contacts out-of-band to verify end-to-end authenticity.
                Private keys are strictly stored on your client device and never sent to any server.
              </p>
            </div>

            {/* Cryptographic Protocol Spec */}
            <div className="rounded-xl border border-[#1A1A24] bg-[#0A0A0E] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-3.5 w-3.5 text-[#FF5500]" />
                <span className="text-xs font-semibold text-slate-200">
                  Cryptographic Protocol Pipeline
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-[#0D0D12] border border-[#22222E]">
                  <span className="text-slate-500 block text-[9px]">KEY AGREEMENT</span>
                  <span className="font-semibold text-slate-200">ECDH P-256 / X25519</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0D0D12] border border-[#22222E]">
                  <span className="text-slate-500 block text-[9px]">FORWARD SECRECY</span>
                  <span className="font-semibold text-[#FF7A1A]">Double Ratchet</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0D0D12] border border-[#22222E]">
                  <span className="text-slate-500 block text-[9px]">AEAD CIPHER</span>
                  <span className="font-semibold text-slate-200">AES-256-GCM</span>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="h-3.5 w-3.5 text-[#FF5500]" />
                <span className="text-xs font-semibold text-slate-200">
                  Active Cryptographic Sessions ({sessions.length})
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="p-3 rounded-lg border border-[#1A1A24] bg-[#0A0A0E] text-xs font-mono text-slate-400">
                  Ratchets established dynamically on first message exchange.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((sess) => (
                    <div
                      key={sess.sessionId}
                      className="rounded-lg border border-[#1A1A24] bg-[#0A0A0E] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-medium text-white">
                          Peer: {sess.peerUserId}
                        </span>
                        <span className="text-[10px] font-mono text-[#FF7A1A] bg-[#FF5500]/10 px-1.5 py-0.5 rounded border border-[#FF5500]/30">
                          State: {sess.state}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400 mt-2">
                        <div>
                          <span className="block text-[9px] text-slate-500">SEND RATCHET</span>
                          <span className="text-[#FF7A1A]">#{sess.sendRatchetCounter}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500">RECV RATCHET</span>
                          <span className="text-[#FF7A1A]">#{sess.recvRatchetCounter}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[9px] text-slate-500">PEER FINGERPRINT</span>
                          <span className="truncate block text-slate-300">
                            {sess.peerIdentityFingerprint}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Network & Backend Section */}
        <section
          id="settings-network-section"
          className="rounded-xl border border-[#1A1A24] bg-[#0D0D12] p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A24]">
            <h2 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              NETWORK & BACKEND CONFIG
            </h2>
            <span className="text-[10px] font-mono text-[#FF7A1A]">
              Status: {connectionStatus}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-[#1A1A24]">
              <span className="text-slate-500">WebSocket URL</span>
              <span className="text-slate-300">
                {wsClient.getUrl() || '(Local Sandbox Mode)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1A1A24]">
              <span className="text-slate-500">Backend Server Target</span>
              <span className="text-slate-300">Render (Node.js / TypeScript)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Database Target</span>
              <span className="text-slate-300">Supabase PostgreSQL</span>
            </div>
          </div>
        </section>

        {/* Logout Section */}
        <section className="pt-2">
          <button
            id="settings-logout-button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out of CipherChat</span>
          </button>
        </section>
      </div>
    </div>
  );
};
