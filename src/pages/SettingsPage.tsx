import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Key,
  Moon,
  Sun,
  LogOut,
  Check,
  Copy,
  Terminal,
  Activity,
} from 'lucide-react';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { cryptoService } from '../crypto/CryptoService';
import { wsClient } from '../services/websocket/WebSocketClient';
import { CryptoSession } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Top Header */}
      <div className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-3xl flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              id="settings-back-button"
              to="/app"
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-sm font-semibold">Settings</h1>
          </div>
          <Link
            to="/app"
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Done
          </Link>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Account Section */}
        <section
          id="settings-account-section"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Account
            </h2>
          </div>

          <div className="flex items-start gap-4 mb-6">
            {user && <Avatar name={user.displayName} size="lg" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {user?.displayName}
              </div>
              <div className="text-xs font-mono text-neutral-500 mt-0.5">
                @{user?.username}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {user?.email}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
            <div>
              <label
                htmlFor="settings-display-name"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  id="settings-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-900 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-400"
                />
                <button
                  type="submit"
                  disabled={isSavingName || !displayName.trim()}
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white flex items-center gap-1"
                >
                  {saveSuccess && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  <span>{isSavingName ? 'Saving...' : saveSuccess ? 'Saved' : 'Update'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-neutral-400 block mb-0.5 text-[11px]">Username</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">
                  @{user?.username}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block mb-0.5 text-[11px]">Email</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">
                  {user?.email}
                </span>
              </div>
            </div>
          </form>
        </section>

        {/* Security & Cryptography Section */}
        <section
          id="settings-security-section"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Security & Cryptography
              </h2>
            </div>
            <Badge variant="success">E2EE Architecture Ready</Badge>
          </div>

          <div className="space-y-4">
            {/* Identity Key Fingerprint */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-neutral-500" />
                  Public Identity Key Fingerprint
                </span>
                <button
                  onClick={handleCopyFingerprint}
                  className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  {copiedFingerprint ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedFingerprint ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded bg-white border border-neutral-200 font-mono text-xs text-neutral-800 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200 tracking-wider select-all">
                {identity?.fingerprint || 'Initializing local identity key...'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Compare this security fingerprint with contacts out-of-band to verify end-to-end authenticity.
                Private keys are strictly stored on your client device and never sent to any server.
              </p>
            </div>

            {/* Cryptographic Protocol Spec */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Cryptographic Protocol Pipeline
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">Key Agreement</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">X3DH Handshake</span>
                </div>
                <div className="p-2 rounded bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">Forward Secrecy</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Double Ratchet</span>
                </div>
                <div className="p-2 rounded bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">AEAD Cipher</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">AES-256-GCM</span>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Active Cryptographic Sessions ({sessions.length})
                </span>
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-neutral-400">No established sessions yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((sess) => (
                    <div
                      key={sess.sessionId}
                      className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-950/60"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          Peer: {sess.peerUserId}
                        </span>
                        <Badge variant="success">State: {sess.state}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-500 mt-2">
                        <div>
                          <span className="block text-[10px] text-neutral-400">Send Ratchet</span>
                          <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                            #{sess.sendRatchetCounter}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-neutral-400">Recv Ratchet</span>
                          <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                            #{sess.recvRatchetCounter}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[10px] text-neutral-400">Peer Fingerprint</span>
                          <span className="font-mono truncate block text-neutral-700 dark:text-neutral-300">
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

        {/* Appearance Section */}
        <section
          id="settings-appearance-section"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Appearance
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                Color Theme
              </span>
              <span className="text-xs text-neutral-400">
                Switch between restrained light and dark neutral palettes.
              </span>
            </div>

            <button
              id="settings-theme-toggle"
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              <span className="capitalize">{theme} mode</span>
            </button>
          </div>
        </section>

        {/* Network & Backend Section */}
        <section
          id="settings-network-section"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Network & Backend Config
            </h2>
            <Badge variant="neutral">Status: {connectionStatus}</Badge>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500">WebSocket URL</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">
                {wsClient.getUrl() || '(Local Sandbox Mode)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500">Backend Server Target</span>
              <span className="text-neutral-800 dark:text-neutral-200">Render (Node.js / TypeScript)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Database Target</span>
              <span className="text-neutral-800 dark:text-neutral-200">Supabase PostgreSQL</span>
            </div>
          </div>
        </section>

        {/* Logout Section */}
        <section className="pt-2">
          <button
            id="settings-logout-button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/60 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out of CipherChat</span>
          </button>
        </section>
      </div>
    </div>
  );
};
