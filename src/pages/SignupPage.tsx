import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ArrowRight, Shield } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3 dark:bg-neutral-100 dark:text-neutral-950 shadow-xs">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Create CipherChat Account
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Generate local cryptographic identity keys and join secure chat.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="signup-displayname"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
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
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
              />
            </div>

            <div>
              <label
                htmlFor="signup-username"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Username (used for finding you)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                  @
                </span>
                <input
                  id="signup-username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-7 pr-3 py-2 text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Email address (login only)
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
              />
              <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                <Shield className="h-3 w-3" />
                <span>Never revealed in directory search or to other users.</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Password (min 6 chars)
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
              />
            </div>

            <button
              id="signup-submit-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 active:scale-95 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition-all shadow-xs mt-2"
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-4 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link
            id="login-redirect-link"
            to="/login"
            className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
