'use client'

import { useState, useEffect, useCallback } from 'react'

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

interface SongSection {
  id: string
  type: string
  chordPro: string
  lyrics: string[]
}

interface Song {
  id: string
  title: string
  key: string
  bpm: number
  timeSig: string
  sections: SongSection[]
  rawLyrics?: string
  createdAt: number
  updatedAt: number
}

interface SetlistItem extends Song {
  order: number
}

interface SavedSetlist {
  id: string
  name: string
  items: SetlistItem[]
  totalDuration: number
  createdAt: number
}

interface ShowModeModalProps {
  setlist: SavedSetlist
  onClose: () => void
}

export default function ShowModeModal({ setlist, onClose }: ShowModeModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentSong = setlist.items[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === setlist.items.length - 1

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < setlist.items.length - 1) setCurrentIndex(currentIndex + 1)
  }, [currentIndex, setlist.items.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNext, handlePrev, onClose])

  // ChordPro to displayed lines
  const chordLines: Array<{ chord: string; lyric: string }> = []
  if (currentSong) {
    const sections = currentSong.sections.filter(s => s.type && s.chordPro)
    sections.forEach(section => {
      const lines = section.chordPro.split('\n')
      lines.forEach(line => {
        const chordMatch = line.match(/^\[([^\]]+)\]\s*(.*)/)
        const lyricMatch = line.match(/^\[([^\]]+)\]\s*(.*)/)
        if (chordMatch) {
          chordLines.push({ chord: chordMatch[1], lyric: lyricMatch ? lyricMatch[2] : '' })
        } else if (line.trim()) {
          chordLines.push({ chord: '', lyric: line })
        }
      })
      chordLines.push({ chord: '', lyric: '' }) // blank separator
    })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: BRAND.midnight,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: BRAND.surface }}>
        <div style={{
          height: '100%',
          background: `linear-gradient(90deg, ${BRAND.hotPink}, ${BRAND.electricTeal})`,
          width: `${((currentIndex + 1) / setlist.items.length) * 100}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: `1px solid ${BRAND.border}` }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: `1px solid ${BRAND.muted}`,
            borderRadius: 8,
            color: BRAND.muted,
            padding: '8px 20px',
            fontFamily: 'Oswald, sans-serif',
            fontSize: 12,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          ✕ Exit Show
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 10, letterSpacing: 2, color: BRAND.muted, textTransform: 'uppercase' }}>
            {setlist.name}
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: BRAND.muted, marginTop: 2 }}>
            {currentIndex + 1} of {setlist.items.length}
          </div>
        </div>

        <div style={{ width: 90 }} /> {/* Spacer to center */}
      </div>

      {/* Song info */}
      <div style={{ textAlign: 'center', padding: '32px 32px 16px' }}>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 'clamp(36px, 8vw, 80px)',
          color: BRAND.hotPink,
          letterSpacing: 3,
          textShadow: `0 0 80px ${BRAND.hotPink}50`,
          lineHeight: 1,
        }}>
          {currentSong.title}
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: BRAND.electricTeal }}>{currentSong.key}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>KEY</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: BRAND.glamGold }}>{currentSong.bpm}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>BPM</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: BRAND.muted }}>{currentSong.timeSig}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>TIME</div>
          </div>
        </div>
      </div>

      {/* Chord sheet */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 32px 16px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {chordLines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: BRAND.muted }}>
            No chord sheet for this song yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {chordLines.map((line, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 16,
                minHeight: 32,
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 16,
                  fontWeight: 700,
                  color: line.chord ? BRAND.electricTeal : 'transparent',
                  minWidth: 80,
                  textAlign: 'right',
                }}>
                  {line.chord || '—'}
                </span>
                <span style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: 18,
                  color: line.lyric ? '#fff' : BRAND.muted,
                  letterSpacing: 0.5,
                }}>
                  {line.lyric || '\u00A0'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        padding: '20px 32px',
        borderTop: `1px solid ${BRAND.border}`,
      }}>
        <button
          onClick={handlePrev}
          disabled={isFirst}
          style={{
            background: 'transparent',
            border: `1px solid ${isFirst ? BRAND.border : BRAND.muted}`,
            borderRadius: 8,
            color: isFirst ? BRAND.border : '#fff',
            padding: '12px 28px',
            fontFamily: 'Oswald, sans-serif',
            fontSize: 14,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ← Prev
        </button>

        {/* Song dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {setlist.items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentIndex ? BRAND.hotPink : BRAND.border,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={onClose}
            style={{
              background: BRAND.deepViolet,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              padding: '12px 28px',
              fontFamily: 'Oswald, sans-serif',
              fontSize: 14,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            🎸 End Set
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              background: BRAND.hotPink,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              padding: '12px 28px',
              fontFamily: 'Oswald, sans-serif',
              fontSize: 14,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Next →
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      <div style={{
        textAlign: 'center',
        padding: '8px',
        fontFamily: 'Space Mono, monospace',
        fontSize: 10,
        color: BRAND.border,
        letterSpacing: 1,
      }}>
        ← → Arrow keys to navigate • Esc to exit
      </div>
    </div>
  )
}
