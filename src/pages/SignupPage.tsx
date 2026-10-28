import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, ArrowRight, Lock, KeyRound, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignupPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        email,
        username,
        displayName,
        password,
      });
      navigate('/app');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-[#080A0F] text-slate-100 select-none">
      <div className="w-full max-w-md">
        {/* Top Window Header */}
        <div className="rounded-2xl border border-[#171D28] bg-[#0D1118] shadow-2xl overflow-hidden">
          {/* Header bar */}
          <div className="flex h-10 items-center justify-between border-b border-[#171D28] bg-[#0A0D13] px-4">
            <span className="text-[11px] font-mono text-slate-400">cipherchat-keygen://identity</span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00E599]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E599] animate-pulse" />
              <span>E2EE v3 Active</span>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-11 w-11 rounded-xl bg-[#0B281E] text-[#00E599] border border-[#00E599]/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,229,153,0.2)]">
                <Shield className="h-6 w-6 text-[#00E599]" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Create Cryptographic Identity
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Generates local ECDH identity keys in hardware WebCrypto
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-950/40 p-2.5 text-xs text-red-400 border border-red-900/50">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="signup-displayname"
                  className="block text-xs font-mono text-slate-300 mb-1"
                >
                  Display Name
                </label>
                <input
                  id="signup-displayname"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#1E2638] bg-[#0A0D13] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#00E599] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-username"
                  className="block text-xs font-mono text-slate-300 mb-1"
                >
                  Peer Handle (used for discovering you)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                    @
                  </span>
                  <input
                    id="signup-username"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                    className="w-full rounded-lg border border-[#1E2638] bg-[#0A0D13] pl-7 pr-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:border-[#00E599] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-mono text-slate-300 mb-1"
                >
                  Email address (login credential)
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#1E2638] bg-[#0A0D13] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#00E599] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-mono text-slate-300 mb-1"
                >
                  Password (min 6 characters)
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-[#1E2638] bg-[#0A0D13] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#00E599] focus:outline-none transition-colors"
                />
              </div>

              <button
                id="signup-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#00E599] py-2.5 text-xs font-bold text-[#051E14] hover:bg-[#00F5A3] active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(0,229,153,0.3)] mt-2"
              >
                <span>{isSubmitting ? 'Generating Keys & Joining...' : 'Generate Identity & Enter'}</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </form>

            {/* Badges */}
            <div className="mt-5 pt-4 border-t border-[#171D28]/60 flex items-center justify-around text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-[#00E599]" /> AES-256-GCM
              </span>
              <span className="flex items-center gap-1">
                <KeyRound className="h-3 w-3 text-[#00E599]" /> ECDH P-256
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-[#00E599]" /> WebCrypto
              </span>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Already possess an identity?{' '}
          <Link
            id="login-redirect-link"
            to="/login"
            className="font-medium text-[#00E599] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
