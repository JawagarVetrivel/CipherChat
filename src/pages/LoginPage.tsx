import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, ArrowRight, Lock, KeyRound, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/app');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-[#050508] text-slate-100 select-none overflow-hidden">
      {/* Fiery orange horizon glow reflecting the reference image */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[#FF4500]/25 via-[#FF4500]/8 to-transparent z-0 opacity-80" />

      <div className="relative z-10 w-full max-w-md">
        {/* Top Window Header */}
        <div className="rounded-2xl border border-[#242434] bg-[#0C0C14]/90 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Header bar */}
          <div className="flex h-10 items-center justify-between border-b border-[#1E1E2A] bg-[#09090F] px-4">
            <span className="text-[11px] font-mono text-slate-400">cipherchat-auth://terminal</span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#FF7A1A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500] animate-pulse shadow-[0_0_6px_#FF5500]" />
              <span>E2EE v3 Active</span>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            {/* Brand Logo & Description */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FF5500] to-[#CC3700] text-white flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,85,0,0.35)]">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Sign in to CipherChat
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Zero-knowledge end-to-end encrypted messaging workspace
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-950/40 p-2.5 text-xs text-red-400 border border-red-900/50">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-mono text-slate-300 mb-1"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#222230] bg-[#070709] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#FF5500] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-mono text-slate-300"
                  >
                    Password
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">Encrypted in-flight</span>
                </div>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#222230] bg-[#070709] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#FF5500] focus:outline-none transition-colors"
                />
              </div>

              <button
                id="login-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FF5500] via-[#FF6600] to-[#E63900] py-2.5 text-xs font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,85,0,0.35)] mt-2"
              >
                <span>{isSubmitting ? 'Authenticating & Deriving Keys...' : 'Authenticate & Open Vault'}</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </form>

            {/* Quick Peer Selectors */}
            <div className="mt-6 pt-5 border-t border-[#1C1C28]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2 text-center">
                Quick Test Peers:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('rahul@university.edu')}
                  className="flex items-center gap-2 rounded-lg border border-[#222230] bg-[#08080D] p-2 hover:border-[#FF5500]/50 hover:bg-[#12121A] transition-all text-left"
                >
                  <div className="h-6 w-6 rounded bg-[#18120E] text-[#FF7A1A] border border-[#FF5500]/30 flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0">
                    RS
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">Rahul Sharma</div>
                    <div className="text-[9px] font-mono text-slate-500">@rahul123</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickDemo('priya@university.edu')}
                  className="flex items-center gap-2 rounded-lg border border-[#222230] bg-[#08080D] p-2 hover:border-[#FF5500]/50 hover:bg-[#12121A] transition-all text-left"
                >
                  <div className="h-6 w-6 rounded bg-[#18120E] text-[#FF7A1A] border border-[#FF5500]/30 flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0">
                    PK
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">Priya Kapoor</div>
                    <div className="text-[9px] font-mono text-slate-500">@priya_k</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Cryptographic Badges */}
            <div className="mt-5 pt-4 border-t border-[#1C1C28] flex items-center justify-around text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-[#FF5500]" /> AES-256-GCM
              </span>
              <span className="flex items-center gap-1">
                <KeyRound className="h-3 w-3 text-[#FF5500]" /> ECDH P-256
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-[#FF5500]" /> WebCrypto
              </span>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Need a cryptographic identity?{' '}
          <Link
            to="/signup"
            className="font-medium text-[#FF7A1A] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
