'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthModalProps {
  onAuth: (user: { id: string; email?: string }) => void
}

type Mode = 'signin' | 'signup'

export default function AuthModal({ onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return

    setLoading(true)
    setMessage(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        // onAuth will be triggered by onAuthStateChange in parent
        setEmail('')
        setPassword('')
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: '✓ Account created! Check your email to confirm, then sign in.' })
        setPassword('')
        setMode('signin')
      }
    }

    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#08060F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#130E20',
        border: '1px solid #1E1830',
        borderRadius: 16,
        padding: 40,
        maxWidth: 420,
        width: '100%',
        margin: 16,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 42,
            letterSpacing: 6,
            color: '#FF2D9B',
            marginBottom: 8,
          }}>
            TLK HUB
          </div>
          <div style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 13,
            letterSpacing: 3,
            color: '#6B6180',
            textTransform: 'uppercase',
          }}>
            The Loin Kings
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginBottom: 28,
          background: '#0E0B18',
          borderRadius: 10,
          padding: 4,
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setMessage(null) }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'signin' ? '#FF2D9B' : 'transparent',
              color: mode === 'signin' ? '#08060F' : '#6B6180',
              fontFamily: 'Oswald, sans-serif',
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setMessage(null) }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'signup' ? '#FF2D9B' : 'transparent',
              color: mode === 'signup' ? '#08060F' : '#6B6180',
              fontFamily: 'Oswald, sans-serif',
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 20,
            letterSpacing: 2,
            color: '#F0EBF8',
            margin: '0 0 8px',
            textTransform: 'uppercase',
          }}>
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 14,
            color: '#6B6180',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {mode === 'signin'
              ? 'Sign in with your email and password.'
              : 'Pick a password — no magic link needed.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#0E0B18',
              border: '1px solid #1E1830',
              borderRadius: 10,
              color: '#fff',
              fontFamily: 'system-ui',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 12,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#FF2D9B')}
            onBlur={e => (e.target.style.borderColor = '#1E1830')}
          />

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#0E0B18',
              border: '1px solid #1E1830',
              borderRadius: 10,
              color: '#fff',
              fontFamily: 'system-ui',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 12,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#FF2D9B')}
            onBlur={e => (e.target.style.borderColor = '#1E1830')}
          />

          {message && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: message.type === 'success' ? '#00E5CC15' : '#FF2D9B15',
              color: message.type === 'success' ? '#00E5CC' : '#FF2D9B',
              fontFamily: 'system-ui',
              fontSize: 13,
              marginBottom: 12,
              textAlign: 'center',
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: loading ? '#6B6180' : '#FF2D9B',
              color: '#08060F',
              fontFamily: 'Oswald, sans-serif',
              fontSize: 14,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        {mode === 'signin' && (
          <div style={{
            textAlign: 'center',
            marginTop: 16,
            fontFamily: 'system-ui',
            fontSize: 12,
            color: '#6B6180',
          }}>
            Forgot password?{' '}
            <span
              style={{ color: '#00E5CC', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={async () => {
                if (!email.trim()) {
                  setMessage({ type: 'error', text: 'Enter your email first.' })
                  return
                }
                setLoading(true)
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
                setLoading(false)
                setMessage(error
                  ? { type: 'error', text: error.message }
                  : { type: 'success', text: '✓ Password reset email sent!' })
              }}
            >
              Reset it
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
