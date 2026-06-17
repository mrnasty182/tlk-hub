'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/songs', label: 'Songs', short: 'Songs' },
  { href: '/composer', label: 'Compose', short: 'Compose' },
  { href: '/scales', label: 'Scales', short: 'Scales' },
  { href: '/setlists', label: 'Setlists', short: 'Sets' },
  { href: '/calendar', label: 'Calendar', short: 'Cal' },
  { href: '/dashboard', label: 'Dashboard', short: 'Dash' },
  { href: '/profile', label: 'Profile', short: 'Me' },
]

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => pathname === href || (href === '/songs' && pathname?.startsWith('/songs'))

  return (
    <nav className="tlk-nav">
      <Link href="/songs" className="tlk-brand" onClick={() => setMenuOpen(false)}>
        <span className="brand-mark">🥩</span>
        <span className="brand-text">TLK</span>
      </Link>

      <div className={`tlk-nav-links ${menuOpen ? 'open' : ''}`}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`tlk-nav-link ${isActive(item.href) ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <button onClick={handleSignOut} className="tlk-sign-out">
        Sign Out
      </button>

      <button
        className="tlk-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      <style>{`
        .tlk-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          height: 52px;
          background: var(--lk-void, #130E20);
          border-bottom: 1px solid var(--lk-subtle, #1E1830);
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: 'Oswald', system-ui, sans-serif;
        }
        .tlk-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          padding: 4px 8px;
          margin-right: 4px;
          flex-shrink: 0;
        }
        .brand-mark { font-size: 18px; line-height: 1; }
        .brand-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 3px;
          color: var(--lk-pink, #FF2D9B);
          line-height: 1;
        }
        .tlk-nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          min-width: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tlk-nav-links::-webkit-scrollbar { display: none; }
        .tlk-nav-link {
          padding: 6px 10px;
          color: var(--lk-muted, #6B6180);
          text-decoration: none;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 6px;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .tlk-nav-link:hover {
          color: var(--lk-white, #F0EBF8);
          background: var(--lk-subtle, #1E1830);
        }
        .tlk-nav-link.active {
          color: var(--lk-pink, #FF2D9B);
          background: rgba(255, 45, 155, 0.12);
        }
        .tlk-sign-out {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--lk-subtle, #1E1830);
          color: var(--lk-muted, #6B6180);
          font-family: 'Oswald', sans-serif;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border-radius: 6px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .tlk-sign-out:hover {
          color: var(--lk-white, #F0EBF8);
          border-color: var(--lk-pink, #FF2D9B);
        }
        .tlk-hamburger {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
        }
        .tlk-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--lk-pink, #FF2D9B);
          border-radius: 2px;
        }
        @media (max-width: 768px) {
          .tlk-hamburger { display: flex; }
          .tlk-nav-links {
            position: absolute;
            top: 52px;
            left: 0;
            right: 0;
            background: var(--lk-void, #130E20);
            border-bottom: 1px solid var(--lk-subtle, #1E1830);
            flex-direction: column;
            align-items: stretch;
            padding: 8px;
            gap: 2px;
            display: none;
            overflow-x: visible;
          }
          .tlk-nav-links.open { display: flex; }
          .tlk-nav-link { padding: 10px 16px; }
          .tlk-sign-out { display: none; }
        }
      `}</style>
    </nav>
  )
}
