'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import AuthModal from '@/components/AuthModal'
import NavBar from '@/components/NavBar'
import CelebrationModal from '@/components/CelebrationModal'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  // Track prior user value to detect actual login vs token refresh
  const prevUserRef = useRef<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      prevUserRef.current = session?.user ?? null
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Celebration modal once per login — fire only on actual login, not every user state change ──
  useEffect(() => {
    if (!user) return
    if (sessionStorage.getItem('tlk-celebration-fired')) return
    // Only fire when transitioning from logged-out → logged-in (actual login, not token refresh)
    const isActualLogin = prevUserRef.current === null && user !== null
    if (!isActualLogin) return
    prevUserRef.current = user
    sessionStorage.setItem('tlk-celebration-fired', '1')
    setShowCelebration(true)
  }, [user])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#08060F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 32,
          letterSpacing: 4,
          color: '#FF2D9B',
        }}>
          LOADING...
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthModal onAuth={() => {}} />
  }

  return (
    <div className="app-shell">
      {showCelebration && (
        <CelebrationModal
          onDismiss={() => setShowCelebration(false)}
          userName={user.email ?? undefined}
        />
      )}
      <NavBar />
      <main className="app-main">{children}</main>
    </div>
  )
}