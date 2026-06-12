'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

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

const SECTION_COLORS: Record<string, string> = {
  Intro: '#7B2FBE', Verse: '#00E5CC', 'Pre-Chorus': '#FF2D9B', Chorus: '#F0C040',
  Hook: '#FF6B35', 'Post-Chorus': '#FF6D00', Bridge: '#9D4EDD', Breakdown: '#E040FB',
  'Musical Break': '#00BCD4', Instrumental: '#78909C', Tag: '#78909C',
  Solo: '#FF8A65', Outro: '#06D6A0',
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
}

interface PlaysheetModalProps {
  song: Song
  onClose: () => void
}

export default function PlaysheetModal({ song, onClose }: PlaysheetModalProps) {
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(song.bpm)
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  const currentSection = song.sections[currentSectionIdx]
  const totalSections = song.sections.length

  // Convert BPM to pixels per millisecond for smooth scroll
  // Each section gets ~4 seconds at 60 BPM, scaled by BPM ratio
  const SECTION_HEIGHT_PX = 200
  const BASE_BPM = 60
  const BASE_MS_PER_SECTION = 4000
  const msPerSection = (BASE_MS_PER_SECTION * BASE_BPM) / bpm

  const resetScroll = useCallback(() => {
    setScrollY(0)
    setCurrentSectionIdx(0)
    setPlaying(false)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [])

  useEffect(() => {
    resetScroll()
  }, [song.id, resetScroll])

  useEffect(() => {
    if (!playing) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      lastTimeRef.current = null
      return
    }

    const container = scrollContainerRef.current
    if (!container) return

    const tick = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const elapsed = timestamp - lastTimeRef.current

      // Calculate how much to scroll based on elapsed time and BPM
      const totalHeight = container.scrollHeight - container.clientHeight
      const scrollPerMs = totalHeight / (msPerSection * totalSections)
      const newScrollY = Math.min(scrollY + elapsed * scrollPerMs, totalHeight)

      container.scrollTop = newScrollY
      setScrollY(newScrollY)

      // Advance section indicator
      const progress = newScrollY / totalHeight
      const newSectionIdx = Math.min(
        Math.floor(progress * totalSections),
        totalSections - 1
      )
      if (newSectionIdx !== currentSectionIdx) {
        setCurrentSectionIdx(newSectionIdx)
      }

      lastTimeRef.current = timestamp
      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [playing, bpm, msPerSection, totalSections, scrollY, currentSectionIdx])

  // Handle manual scroll to update section indicator
  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container || playing) return
    const totalHeight = container.scrollHeight - container.clientHeight
    const progress = container.scrollTop / totalHeight
    const newSectionIdx = Math.min(
      Math.floor(progress * totalSections),
      totalSections - 1
    )
    setCurrentSectionIdx(newSectionIdx)
    setScrollY(container.scrollTop)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
      if (e.key === 'ArrowRight') setCurrentSectionIdx(i => Math.min(i + 1, totalSections - 1))
      if (e.key === 'ArrowLeft') setCurrentSectionIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, totalSections])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: BRAND.midnight, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', height: 64,
        background: BRAND.surface, borderBottom: `1px solid ${BRAND.border}`, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: '50%', border: `1px solid ${BRAND.border}`,
          background: 'transparent', color: BRAND.muted, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          ×
        </button>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: '#fff', letterSpacing: 1 }}>
            {song.title}
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted }}>
            {song.key} · {song.timeSig}
          </div>
        </div>

        {/* Play/Pause */}
        <button
          onClick={() => setPlaying(p => !p)}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `2px solid ${playing ? BRAND.electricTeal : BRAND.border}`,
            background: playing ? `${BRAND.electricTeal}22` : 'transparent',
            color: playing ? BRAND.electricTeal : BRAND.muted,
            fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: 16, transition: 'all 0.15s',
          }}
        >
          {playing ? '❚❚' : '▶'}
        </button>

        {/* BPM control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <button onClick={() => setBpm(b => Math.max(30, b - 5))} style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid ${BRAND.border}`,
            background: 'transparent', color: BRAND.muted, fontSize: 14, cursor: 'pointer',
          }}>−</button>
          <div style={{ textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, color: BRAND.glamGold }}>{bpm}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: BRAND.muted }}>BPM</div>
          </div>
          <button onClick={() => setBpm(b => Math.min(300, b + 5))} style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid ${BRAND.border}`,
            background: 'transparent', color: BRAND.muted, fontSize: 14, cursor: 'pointer',
          }}>+</button>
        </div>

        {/* Tempo presets */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {([60, 80, 100, 120] as const).map(tempo => (
            <button key={tempo} onClick={() => setBpm(tempo)} style={{
              padding: '4px 8px', borderRadius: 6, border: `1px solid ${bpm === tempo ? BRAND.glamGold : BRAND.border}`,
              background: bpm === tempo ? `${BRAND.glamGold}22` : 'transparent',
              color: bpm === tempo ? BRAND.glamGold : BRAND.muted,
              fontFamily: 'Space Mono, monospace', fontSize: 10, cursor: 'pointer',
            }}>
              {tempo}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted }}>
          SPACE: play/pause · ESC: close · ←→: sections
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '40px 24px 120px' }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {song.sections.map((section, idx) => (
            <SectionBlock
              key={section.id}
              section={section}
              isActive={idx === currentSectionIdx}
              isPast={idx < currentSectionIdx}
              songKey={song.key}
            />
          ))}
        </div>
      </div>

      {/* Section progress bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: BRAND.surface, borderTop: `1px solid ${BRAND.border}`,
        padding: '12px 24px', display: 'flex', gap: 8, overflowX: 'auto',
      }}>
        {song.sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => {
              setCurrentSectionIdx(idx)
              const container = scrollContainerRef.current
              if (container) {
                const totalHeight = container.scrollHeight - container.clientHeight
                container.scrollTop = (idx / totalSections) * totalHeight
                setScrollY((idx / totalSections) * totalHeight)
              }
            }}
            style={{
              padding: '6px 14px', borderRadius: 20, flexShrink: 0,
              border: `1px solid ${idx === currentSectionIdx ? SECTION_COLORS[section.type] || BRAND.hotPink : BRAND.border}`,
              background: idx === currentSectionIdx ? `${SECTION_COLORS[section.type] || BRAND.hotPink}22` : 'transparent',
              color: idx === currentSectionIdx ? SECTION_COLORS[section.type] || BRAND.hotPink : BRAND.muted,
              fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {section.type}
          </button>
        ))}
      </div>
    </div>
  )
}

function SectionBlock({ section, isActive, isPast, songKey }: {
  section: SongSection
  isActive: boolean
  isPast: boolean
  songKey: string
}) {
  const color = SECTION_COLORS[section.type] || BRAND.hotPink
  const lines = (section.lyrics || []).join('\n').trim()
  const chordLine = section.chordPro || ''

  return (
    <div style={{
      marginBottom: 48, padding: '24px',
      borderLeft: `4px solid ${isActive ? color : isPast ? `${color}44` : BRAND.border}`,
      background: isActive ? `${color}0a` : 'transparent',
      transition: 'all 0.3s',
      opacity: isPast ? 0.4 : 1,
    }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, letterSpacing: 2,
          color: isActive ? color : BRAND.muted, textTransform: 'uppercase',
        }}>
          {section.type}
        </span>
        {chordLine && (
          <span style={{
            fontFamily: 'Space Mono, monospace', fontSize: 12,
            color: isActive ? BRAND.electricTeal : `${BRAND.electricTeal}88`,
            background: `${BRAND.electricTeal}11`,
            padding: '2px 10px', borderRadius: 20, border: `1px solid ${BRAND.electricTeal}33`,
          }}>
            {chordLine}
          </span>
        )}
      </div>

      {/* Lyrics */}
      {lines ? (
        <div style={{
          fontFamily: 'system-ui', fontSize: isActive ? 20 : 16,
          lineHeight: 2.2, color: isActive ? '#fff' : `${BRAND.muted}cc`,
          whiteSpace: 'pre-wrap', transition: 'all 0.3s',
        }}>
          {lines}
        </div>
      ) : chordLine ? (
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: isActive ? 28 : 22,
          color: isActive ? BRAND.electricTeal : `${BRAND.electricTeal}66`,
          letterSpacing: 3,
        }}>
          {chordLine}
        </div>
      ) : (
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.muted, fontStyle: 'italic' }}>
          (instrumental)
        </div>
      )}
    </div>
  )
}
