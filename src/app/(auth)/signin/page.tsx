'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-text">TLK</span>
          <span className="logo-sub">HUB</span>
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSignIn} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <a href="/signup">Sign up</a></p>
          <a href="/" className="back-link">← Back to Home</a>
        </div>
      </div>

      <style>{`
        .auth-container {
          width: 100%;
          max-width: 420px;
          padding: 20px;
        }
        .auth-card {
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 16px;
          padding: 40px;
        }
        .auth-logo {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo-text {
          font-family: var(--font-display);
          font-size: 48px;
          color: var(--lk-pink);
        }
        .logo-sub {
          font-family: var(--font-heading);
          font-size: 18px;
          color: var(--lk-gold);
          letter-spacing: 4px;
        }
        .auth-title {
          font-family: var(--font-heading);
          font-size: 28px;
          text-align: center;
          margin-bottom: 8px;
        }
        .auth-subtitle {
          text-align: center;
          color: var(--lk-muted);
          margin-bottom: 32px;
        }
        .auth-error {
          background: rgba(255,68,68,0.1);
          border: 1px solid rgba(255,68,68,0.3);
          color: #ff6b6b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--lk-muted);
        }
        .auth-footer {
          margin-top: 24px;
          text-align: center;
          color: var(--lk-muted);
          font-size: 14px;
        }
        .auth-footer a {
          color: var(--lk-teal);
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }
        .back-link {
          display: block;
          margin-top: 16px;
          color: var(--lk-muted);
        }
      `}</style>
    </div>
  );
}