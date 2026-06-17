'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/songs', label: 'Songs', icon: '📋' },
  { href: '/composer', label: 'Compose', icon: '✏️' },
  { href: '/scales', label: 'Tools', icon: '🎸' },
  { href: '/setlists', label: 'Sets', icon: '🎵' },
  { href: '/profile', label: 'Me', icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    pathname === href || (href === '/songs' && pathname?.startsWith('/songs'))

  return (
    <nav className="tlk-bottom-nav" aria-label="Mobile navigation">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`tlk-bottom-nav-item ${isActive(item.href) ? 'active' : ''}`}
        >
          <span className="icon" aria-hidden>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
