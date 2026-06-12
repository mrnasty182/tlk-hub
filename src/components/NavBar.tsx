'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

export default function NavBar() {
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-brand">TLK HUB</Link>

      {/* Hamburger — hidden on md+ */}
      <button
        className="md:hidden"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          marginLeft: 'auto',
        }}
      >
        <span style={{ display: 'block', width: 22, height: 2, background: '#FF2D9B', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 22, height: 2, background: '#FF2D9B', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 22, height: 2, background: '#FF2D9B', borderRadius: 2 }} />
      </button>

      {/* Nav links — desktop: flex row; mobile: hidden unless menuOpen */}
      <div
        className={`
          md:flex flex-row items-center gap-1
          hidden flex-col w-full mt-4 md:mt-0
          ${menuOpen ? 'flex' : 'hidden'}
        `}
        style={{ background: '#130E20', md: { background: 'transparent' } }}
      >
        <Link href="/songs" className="nav-item" onClick={() => setMenuOpen(false)}>Songs</Link>
        <Link href="/composer" className="nav-item" onClick={() => setMenuOpen(false)}>Compose</Link>
        <Link href="/scales" className="nav-item" onClick={() => setMenuOpen(false)}>Scales</Link>
        <Link href="/setlists" className="nav-item" onClick={() => setMenuOpen(false)}>Setlists</Link>
        <Link href="/calendar" className="nav-item" onClick={() => setMenuOpen(false)}>Calendar</Link>
        <Link href="/dashboard" className="nav-item" onClick={() => setMenuOpen(false)}>Dashboard</Link>
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
      </div>
    </nav>
  )
}
