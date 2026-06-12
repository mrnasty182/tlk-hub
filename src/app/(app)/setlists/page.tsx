'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SetlistBuilder from '@/components/SetlistBuilder'

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

const STORAGE_KEY = 'tlk-setlists-v2'

export default function SetlistsPage() {
  const router = useRouter()
  const [savedSetlists, setSavedSetlists] = useState<SavedSetlist[]>([])
  const [editingSetlist, setEditingSetlist] = useState<SavedSetlist | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const loadSetlists = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSavedSetlists(JSON.parse(stored))
      } catch {
        setSavedSetlists([])
      }
    }
  }

  useEffect(() => {
    loadSetlists()
  }, [])

  const handleEditSetlist = (setlist: SavedSetlist) => {
    setEditingSetlist(setlist)
    setIsCreating(false)
  }

  const handleNewSetlist = () => {
    setEditingSetlist(null)
    setIsCreating(true)
  }

  const handleBackToLibrary = () => {
    setEditingSetlist(null)
    setIsCreating(false)
    loadSetlists()
  }

  const handleDeleteSetlist = (id: string) => {
    if (!confirm('Delete this setlist?')) return
    const updated = savedSetlists.filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSavedSetlists(updated)
  }

  // Edit or create mode
  if (editingSetlist || isCreating) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.midnight }}>
        {/* Header */}
        <div style={{ padding: '24px 48px', borderBottom: `1px solid ${BRAND.border}`, display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            onClick={handleBackToLibrary}
            style={{
              background: 'transparent',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 8,
              color: BRAND.muted,
              padding: '8px 16px',
              fontFamily: 'Oswald, sans-serif',
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              cursor: 'pointer',
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
            ← Library
          </button>
          <h1 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 36, letterSpacing: 3, color: BRAND.hotPink, margin: 0 }}>
            {editingSetlist ? `EDIT: ${editingSetlist.name}` : 'NEW SETLIST'}
          </h1>
        </div>

        {/* Builder */}
        <div style={{ padding: 24 }}>
          <SetlistBuilder initialSetlist={editingSetlist} />
        </div>
      </div>
    )
  }

  // Library view
  return (
    <div style={{ minHeight: '100vh', background: BRAND.midnight }}>
      {/* Header */}
      <div style={{ padding: '40px 48px 24px', borderBottom: `1px solid ${BRAND.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 48, letterSpacing: 4, color: BRAND.hotPink, margin: 0 }}>
              SETLIST LIBRARY
            </h1>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: BRAND.muted, marginTop: 6 }}>
              {savedSetlists.length} saved setlist{savedSetlists.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleNewSetlist}
            style={{
              background: BRAND.hotPink,
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              padding: '12px 28px',
              fontFamily: 'Oswald, sans-serif',
              fontSize: 14,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'opacity 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.85'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            + New Setlist
          </button>
        </div>
      </div>

      {/* Setlists grid */}
      <div style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto' }}>
        {savedSetlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎸</div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: '#fff', letterSpacing: 2, marginBottom: 12 }}>
              No Setlists Yet
            </h2>
            <p style={{ color: BRAND.muted, fontSize: 16, marginBottom: 28 }}>
              Build your first setlist to get started
            </p>
            <button
              onClick={handleNewSetlist}
              style={{
                background: BRAND.hotPink,
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                padding: '14px 36px',
                fontFamily: 'Oswald, sans-serif',
                fontSize: 16,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Create Setlist
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {savedSetlists.map(setlist => (
              <div
                key={setlist.id}
                style={{
                  background: BRAND.card,
                  borderRadius: 16,
                  padding: 28,
                  border: `1px solid ${BRAND.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onClick={() => handleEditSetlist(setlist)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = BRAND.hotPink
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = BRAND.border
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '16px 16px 0 0', background: `linear-gradient(90deg, ${BRAND.hotPink}, ${BRAND.deepViolet})` }} />

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSetlist(setlist.id)
                  }}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'transparent',
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 6,
                    color: BRAND.muted,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 16,
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

                {/* Title */}
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: '#fff', letterSpacing: 1, marginTop: 8, marginBottom: 16 }}>
                  {setlist.name}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: BRAND.electricTeal }}>
                      {setlist.items.length}
                    </span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>
                      SONGS
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: BRAND.glamGold }}>
                      {setlist.totalDuration >= 60
                        ? `${Math.floor(setlist.totalDuration / 60)}h ${setlist.totalDuration % 60}m`
                        : `${setlist.totalDuration}m`}
                    </span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, letterSpacing: 1 }}>
                      DURATION
                    </span>
                  </div>
                </div>

                {/* Song previews */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 10, color: BRAND.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Up Next
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {setlist.items.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: BRAND.deepViolet,
                          color: BRAND.glamGold,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: 11, color: BRAND.muted, flexShrink: 0 }}>
                          {item.key} • {item.bpm}
                        </span>
                      </div>
                    ))}
                    {setlist.items.length > 3 && (
                      <div style={{ fontSize: 12, color: BRAND.muted, paddingLeft: 30 }}>
                        +{setlist.items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit hint */}
                <div style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 10,
                  color: BRAND.muted,
                  letterSpacing: 1,
                  textAlign: 'center',
                  paddingTop: 16,
                  borderTop: `1px solid ${BRAND.border}`,
                }}>
                  Click to edit →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}