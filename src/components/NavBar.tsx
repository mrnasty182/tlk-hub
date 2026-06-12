'use client'

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function NavBar() {
  const { signOut } = useAuth()

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-brand">TLK HUB</Link>
      <Link href="/songs" className="nav-item">Songs</Link>
      <Link href="/composer" className="nav-item">Compose</Link>
      <Link href="/scales" className="nav-item">Scales</Link>
      <Link href="/setlists" className="nav-item">Setlists</Link>
      <Link href="/calendar" className="nav-item">Calendar</Link>
      <Link href="/dashboard" className="nav-item">Dashboard</Link>
      <button
        onClick={signOut}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: '#6B6180',
          fontFamily: 'Oswald, sans-serif',
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '8px 12px',
        }}
      >
        Sign Out
      </button>
    </nav>
  )
}
