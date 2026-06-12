'use client'

import React from 'react'
import Image from 'next/image'

const BRAND = {
  hotPink: '#FF2D9B',
  electricTeal: '#00E5CC',
  deepViolet: '#7B2FBE',
  glamGold: '#F0C040',
  midnight: '#08060F',
  muted: '#6B6180',
  surface: '#130E20',
  card: '#0E0B18',
  border: '#1E1830',
}

interface CelebrationModalProps {
  onDismiss: () => void
  userName?: string
}

export default function CelebrationModal({ onDismiss, userName }: CelebrationModalProps) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: 'rgba(8, 6, 15, 0.95)',
        gap: 24,
      }}
    >
      {/* Image */}
      <img
        src="/images/welcome-loins.jpg"
        alt="Welcome to the Loin Kings"
        style={{
          display: 'block',
          maxWidth: '90vw',
          maxHeight: '60vh',
          objectFit: 'contain',
          borderRadius: 16,
          border: `2px solid ${BRAND.hotPink}`,
          boxShadow: `0 0 80px ${BRAND.hotPink}44`,
        }}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement
          target.style.display = 'none'
        }}
      />

      {/* Text below image */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          background: `linear-gradient(135deg, ${BRAND.hotPink}22, #7B2FBE22)`,
          border: `1px solid ${BRAND.hotPink}`,
          borderRadius: 40,
          padding: '12px 32px',
        }}>
          <span style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 18,
            letterSpacing: 4,
            color: BRAND.hotPink,
            textTransform: 'uppercase',
          }}>
            Gird your loins and enter
          </span>
        </div>
        <div style={{
          marginTop: 16,
          fontFamily: 'Space Mono, monospace',
          fontSize: 11,
          color: BRAND.muted,
          letterSpacing: 2,
        }}>
          CLICK ANYWHERE TO CONTINUE
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss() }}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 3,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `1px solid ${BRAND.border}`,
          background: BRAND.surface,
          color: BRAND.muted,
          fontFamily: 'Space Mono, monospace',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = BRAND.hotPink
          e.currentTarget.style.color = BRAND.hotPink
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = BRAND.border
          e.currentTarget.style.color = BRAND.muted
        }}
      >
        ×
      </button>
    </div>
  )
}
