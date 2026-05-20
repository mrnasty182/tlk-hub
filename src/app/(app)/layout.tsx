'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/songs', label: 'Songs', icon: '🎵' },
  { href: '/setlists', label: 'Setlists', icon: '📋' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/composer', label: 'Composer Tools', icon: '✍️' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        router.push('/signin');
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-logo">
            <span className="logo-icon">🥩</span>
            <div className="logo-text">
              <span className="logo-title">TLK</span>
              <span className="logo-sub">HUB</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.user_metadata?.full_name || 'User'}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={handleSignOut} 
            className="btn btn-ghost btn-sm sign-out-btn"
            disabled={signingOut}
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <style>{`
        .app-shell {
          display: flex;
          min-height: 100vh;
        }
        .app-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar {
          width: var(--sidebar-w);
          background: var(--lk-void);
          border-right: 1px solid var(--lk-subtle);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
        }
        .sidebar-header {
          padding: 24px 16px;
          border-bottom: 1px solid var(--lk-subtle);
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon {
          font-size: 28px;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        .logo-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--lk-pink);
          line-height: 1;
        }
        .logo-sub {
          font-family: var(--font-heading);
          font-size: 10px;
          color: var(--lk-gold);
          letter-spacing: 3px;
        }
        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          color: var(--lk-muted);
          transition: all 0.15s;
          font-size: 14px;
        }
        .nav-item:hover {
          background: var(--lk-subtle);
          color: var(--lk-white);
        }
        .nav-item.active {
          background: linear-gradient(135deg, rgba(255,45,155,0.15), rgba(123,47,190,0.15));
          color: var(--lk-pink);
          border: 1px solid rgba(255,45,155,0.2);
        }
        .nav-icon {
          font-size: 18px;
        }
        .nav-label {
          font-family: var(--font-heading);
          font-size: 13px;
          letter-spacing: 1px;
        }
        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--lk-subtle);
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--lk-pink), var(--lk-violet));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-size: 14px;
          color: var(--lk-black);
        }
        .user-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .user-name {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-email {
          font-size: 11px;
          color: var(--lk-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sign-out-btn {
          width: 100%;
          justify-content: center;
        }
        .main-content {
          flex: 1;
          margin-left: var(--sidebar-w);
          min-height: 100vh;
          background: var(--lk-black);
        }
      `}</style>
    </div>
  );
}