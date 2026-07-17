import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // error already surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-signal flex items-center justify-center text-white font-display font-bold text-lg">
            EMS
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
            Sign in to your workspace
          </h1>
          <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">
            Employee Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-[#1a1e26] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/10">
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-ink dark:text-paper" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal text-ink dark:text-paper"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-ink dark:text-paper" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal text-ink dark:text-paper"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-signal text-white font-medium py-2.5 text-sm hover:bg-signal/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-center text-ink/40 dark:text-paper/40 mt-6">
          Default super admin: seeded via <code>npm run seed</code>
        </p>
      </div>
    </div>
  );
}
