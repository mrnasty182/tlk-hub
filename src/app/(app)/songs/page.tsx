'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PlaysheetModal from '@/components/PlaysheetModal'

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

// LocalStorage song type (same as composer)
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

const SECTION_COLORS: Record<string, string> = {
  Intro: '#7B2FBE', Verse: '#00E5CC', 'Pre-Chorus': '#FF2D9B', Chorus: '#F0C040',
  Hook: '#FF6B35', 'Post-Chorus': '#FF6D00', Bridge: '#9D4EDD', Breakdown: '#E040FB',
  'Musical Break': '#00BCD4', Instrumental: '#78909C', Tag: '#78909C',
  Solo: '#FF8A65', Outro: '#06D6A0',
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [playsheetSong, setPlaysheetSong] = useState<Song | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('tlk-songs-v2')
    if (stored) {
      try {
        const parsed: Song[] = JSON.parse(stored)
        setSongs(parsed)
      } catch {
        setSongs([])
      }
    }
    setLoading(false)
  }, [])

  const handleSongClick = (songId: string) => {
    router.push(`/composer?songId=${songId}`)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: BRAND.midnight, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: BRAND.hotPink, letterSpacing: 4 }}>Loading...</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BRAND.midnight, color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Page-specific sub-header — NavBar is above this */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 24px', height: 56,
        background: BRAND.surface, borderBottom: `1px solid ${BRAND.border}`,
      }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: 4, color: '#F0EBF8' }}>ALL SONGS</span>
        <Link href="/composer" style={{
          padding: '8px 16px', borderRadius: 8, border: `1px solid ${BRAND.border}`,
          background: 'transparent', color: BRAND.muted, fontFamily: 'Oswald, sans-serif',
          fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', textDecoration: 'none',
        }}>+ New Song</Link>
      </div>

      {/* Songs grid */}
      <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ color: BRAND.muted, fontSize: 14, margin: '0 0 32px' }}>{songs.length} song{songs.length !== 1 ? 's' : ''} in your library</p>

        {songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: BRAND.muted, fontSize: 16, marginBottom: 20 }}>No songs yet. Create one to get started.</p>
            <Link href="/composer" style={{
              padding: '12px 28px', borderRadius: 10, background: BRAND.hotPink,
              color: '#08060F', fontFamily: 'Oswald, sans-serif', fontSize: 14,
              letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
            }}>Create Song</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {songs.map(song => {
              const sectionCount = song.sections?.length || 0
              const hasLyrics = song.sections?.some(s => s.lyrics && s.lyrics.length > 0)
              const color = song.sections?.[0] ? SECTION_COLORS[song.sections[0].type] || BRAND.hotPink : BRAND.hotPink

              return (
                <div key={song.id} onClick={() => handleSongClick(song.id)} style={{
                  background: BRAND.card, borderRadius: 16, padding: 24,
                  border: `1px solid ${BRAND.border}`, cursor: 'pointer',
                  transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = BRAND.hotPink; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BRAND.border; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                >
                  {/* Play button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setPlaysheetSong(song) }}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 36, height: 36, borderRadius: '50%',
                      border: `1px solid ${BRAND.electricTeal}66`,
                      background: `${BRAND.electricTeal}22`,
                      color: BRAND.electricTeal,
                      fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 2,
                    }}
                    title="Open playsheet"
                  >
                    ▶
                  </button>
                  {/* Accent bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />

                  {/* Title */}
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#fff', letterSpacing: 1, marginBottom: 12, marginTop: 4 }}>{song.title}</div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: BRAND.electricTeal }}>{song.key}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>KEY</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: BRAND.glamGold }}>{song.bpm}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>BPM</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: BRAND.muted }}>{song.timeSig}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>TIME</span>
                    </div>
                  </div>

                  {/* Sections preview */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {song.sections?.slice(0, 5).map((section, i) => (
                      <span key={i} style={{
                        fontFamily: 'Oswald, sans-serif', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: 10,
                        background: `${SECTION_COLORS[section.type] || BRAND.hotPink}22`,
                        color: SECTION_COLORS[section.type] || BRAND.hotPink,
                        border: `1px solid ${SECTION_COLORS[section.type] || BRAND.hotPink}44`,
                      }}>
                        {section.type}
                      </span>
                    ))}
                    {sectionCount > 5 && (
                      <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 9, color: BRAND.muted, padding: '3px 8px' }}>
                        +{sectionCount - 5} more
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted }}>
                    {sectionCount} section{sectionCount !== 1 ? 's' : ''}
                    <span style={{ marginLeft: 8 }}>{hasLyrics ? '● Lyrics' : '○ Empty'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {playsheetSong && (
        <PlaysheetModal song={playsheetSong} onClose={() => setPlaysheetSong(null)} />
      )}
    </div>
  )
}