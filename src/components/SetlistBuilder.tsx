'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

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

// Show Mode Component
function ShowMode({
  setlistItems,
  onEnd,
}: {
  setlistItems: SetlistItem[]
  onEnd: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentSong = setlistItems[currentIndex]

  const handleNext = useCallback(() => {
    if (currentIndex < setlistItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, setlistItems.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNext])

  const currentChords = currentSong.sections
    .map(s => s.chordPro)
    .filter(Boolean)
    .join(' | ')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: BRAND.midnight,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: BRAND.surface,
        }}
      >
        <div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${BRAND.hotPink}, ${BRAND.electricTeal})`,
            width: `${((currentIndex + 1) / setlistItems.length) * 100}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Counter */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 32,
          fontFamily: 'Space Mono, monospace',
          fontSize: 14,
          color: BRAND.muted,
        }}
      >
        {currentIndex + 1} of {setlistItems.length}
      </div>

      {/* End Show button */}
      <button
        onClick={onEnd}
        style={{
          position: 'absolute',
          top: 24,
          left: 32,
          background: 'transparent',
          border: `1px solid ${BRAND.muted}`,
          borderRadius: 8,
          color: BRAND.muted,
          padding: '8px 20px',
          fontFamily: 'Oswald, sans-serif',
          fontSize: 13,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = BRAND.hotPink
          e.currentTarget.style.color = BRAND.hotPink
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = BRAND.muted
          e.currentTarget.style.color = BRAND.muted
        }}
      >
        ✕ End Show
      </button>

      {/* Song title */}
      <div
        style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 'clamp(48px, 10vw, 96px)',
          color: BRAND.hotPink,
          letterSpacing: 4,
          textAlign: 'center',
          marginBottom: 16,
          textShadow: `0 0 60px ${BRAND.hotPink}40`,
        }}
      >
        {currentSong.title}
      </div>

      {/* Key and BPM */}
      <div
        style={{
          display: 'flex',
          gap: 32,
          marginBottom: 40,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 36,
              color: BRAND.electricTeal,
            }}
          >
            {currentSong.key}
          </div>
          <div
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
              color: BRAND.muted,
              letterSpacing: 2,
            }}
          >
            KEY
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 36,
              color: BRAND.glamGold,
            }}
          >
            {currentSong.bpm}
          </div>
          <div
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
              color: BRAND.muted,
              letterSpacing: 2,
            }}
          >
            BPM
          </div>
        </div>
      </div>

      {/* Chord progression */}
      {currentChords && (
        <div
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 24,
            color: '#fff',
            background: BRAND.card,
            borderRadius: 16,
            padding: '24px 48px',
            border: `1px solid ${BRAND.border}`,
            marginBottom: 48,
            letterSpacing: 2,
          }}
        >
          {currentChords}
        </div>
      )}

      {/* Sections list */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 48,
          maxWidth: 800,
        }}
      >
        {currentSong.sections.map((section, i) => (
          <div
            key={section.id}
            style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              padding: '6px 14px',
              borderRadius: 20,
              background: `${BRAND.deepViolet}40`,
              color: BRAND.electricTeal,
              border: `1px solid ${BRAND.deepViolet}60`,
            }}
          >
            {section.type}
          </div>
        ))}
      </div>

      {/* Next button */}
      {currentIndex < setlistItems.length - 1 ? (
        <button
          onClick={handleNext}
          style={{
            background: `linear-gradient(135deg, ${BRAND.hotPink}, ${BRAND.deepViolet})`,
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            padding: '20px 60px',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 28,
            letterSpacing: 4,
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: `0 8px 32px ${BRAND.hotPink}40`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = `0 12px 48px ${BRAND.hotPink}60`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = `0 8px 32px ${BRAND.hotPink}40`
          }}
        >
          NEXT SONG →
        </button>
      ) : (
        <div
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 32,
            color: BRAND.glamGold,
            letterSpacing: 4,
          }}
        >
          🎸 END OF SHOW 🎸
        </div>
      )}

      {/* Keyboard hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          fontFamily: 'Space Mono, monospace',
          fontSize: 11,
          color: BRAND.muted,
          letterSpacing: 1,
        }}
      >
        Press Space or → to advance
      </div>
    </div>
  )
}

const STORAGE_KEY = 'tlk-setlists-v2'
const SONGS_STORAGE_KEY = 'tlk-songs-v2'

export default function SetlistBuilder({
  initialSetlist,
}: {
  initialSetlist?: SavedSetlist | null
}) {
  const router = useRouter()
  const [setlistName, setSetlistName] = useState(initialSetlist?.name || 'Set 1')
  const [setlistItems, setSetlistItems] = useState<SetlistItem[]>(initialSetlist?.items || [])
  const [draggedLibrarySong, setDraggedLibrarySong] = useState<Song | null>(null)
  const [draggedSetlistIndex, setDraggedSetlistIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showMode, setShowMode] = useState(false)
  const [librarySongs, setLibrarySongs] = useState<Song[]>([])

  // Load songs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SONGS_STORAGE_KEY)
    if (stored) {
      try {
        const parsed: Song[] = JSON.parse(stored)
        setLibrarySongs(parsed)
      } catch {
        setLibrarySongs([])
      }
    }
  }, [])

  const totalDurationMinutes = setlistItems.length * 3
  const durationDisplay =
    totalDurationMinutes >= 60
      ? `${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`
      : `${totalDurationMinutes}m`

  const handleLibraryDragStart = (e: React.DragEvent<HTMLDivElement>, song: Song) => {
    setDraggedLibrarySong(song)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', song.id)
  }

  const handleSetlistDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedSetlistIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleSetlistDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = draggedSetlistIndex !== null ? 'move' : 'copy'
    setDragOverIndex(index)
  }

  const handleSetlistDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (draggedLibrarySong) {
      const newItem: SetlistItem = {
        ...draggedLibrarySong,
        order: setlistItems.length + 1,
      }
      setSetlistItems([...setlistItems, newItem])
      setDraggedLibrarySong(null)
      return
    }

    if (draggedSetlistIndex !== null && dragOverIndex !== null) {
      const reordered = [...setlistItems]
      const [moved] = reordered.splice(draggedSetlistIndex, 1)
      reordered.splice(dragOverIndex, 0, moved)
      const updated = reordered.map((item, i) => ({ ...item, order: i + 1 }))
      setSetlistItems(updated)
      setDraggedSetlistIndex(null)
    }
  }

  const handleSetlistDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleLibraryDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOverIndex(null)
    if (draggedSetlistIndex !== null) {
      const reordered = [...setlistItems]
      const [moved] = reordered.splice(draggedSetlistIndex, 1)
      reordered.unshift(moved)
      const updated = reordered.map((item, i) => ({ ...item, order: i + 1 }))
      setSetlistItems(updated)
      setDraggedSetlistIndex(null)
    }
  }

  const handleRemoveItem = (index: number) => {
    const updated = setlistItems
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i + 1 }))
    setSetlistItems(updated)
  }

  const handleClearAll = () => {
    setSetlistItems([])
  }

  const handleSave = () => {
    if (setlistItems.length === 0) {
      alert('Add some songs to your setlist first!')
      return
    }

    const savedSetlists: SavedSetlist[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )

    const newSetlist: SavedSetlist = {
      id: initialSetlist?.id || Date.now().toString(),
      name: setlistName,
      items: setlistItems,
      totalDuration: totalDurationMinutes,
      createdAt: initialSetlist?.createdAt || Date.now(),
    }

    let updated: SavedSetlist[]
    if (initialSetlist?.id) {
      updated = savedSetlists.map(s => (s.id === initialSetlist.id ? newSetlist : s))
    } else {
      updated = [newSetlist, ...savedSetlists]
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    alert(`Setlist "${setlistName}" saved!`)
  }

  const handleDoubleClick = (songId: string) => {
    router.push(`/composer?songId=${songId}`)
  }

  // Show mode
  if (showMode && setlistItems.length > 0) {
    return <ShowMode setlistItems={setlistItems} onEnd={() => setShowMode(false)} />
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: BRAND.midnight,
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${BRAND.border}`,
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BRAND.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <label style={{ color: BRAND.muted, fontSize: 12, fontFamily: 'Oswald, sans-serif', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Setlist Name:
          </label>
          <input
            type="text"
            value={setlistName}
            onChange={(e) => setSetlistName(e.target.value)}
            style={{
              backgroundColor: BRAND.card,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 8,
              color: '#fff',
              padding: '8px 14px',
              fontSize: 15,
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: 1,
              outline: 'none',
              width: 200,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowMode(true)}
            disabled={setlistItems.length === 0}
            style={{
              backgroundColor: setlistItems.length === 0 ? BRAND.muted : BRAND.electricTeal,
              border: 'none',
              borderRadius: 8,
              color: BRAND.midnight,
              padding: '10px 20px',
              fontSize: 13,
              fontFamily: 'Oswald, sans-serif',
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              cursor: setlistItems.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => {
              if (setlistItems.length > 0) (e.currentTarget as HTMLElement).style.opacity = '0.85'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.opacity = '1'
            }}
          >
            ▶ Start Show
          </button>
        </div>
      </div>

      {/* Main content: two-column */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left panel: song library */}
        <div
          style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: BRAND.surface,
            borderRight: `1px solid ${BRAND.border}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${BRAND.border}`,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: BRAND.electricTeal,
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontFamily: 'Oswald, sans-serif',
              }}
            >
              Song Library
            </h2>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
            }}
          >
            {librarySongs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: BRAND.muted, fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🎸</div>
                No songs yet. Create some first!
              </div>
            ) : (
              librarySongs.map((song) => (
                <div
                  key={song.id}
                  draggable
                  onDragStart={(e) => handleLibraryDragStart(e, song)}
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 8,
                    cursor: 'grab',
                    transition: 'border-color 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = BRAND.hotPink
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = BRAND.border
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#fff',
                      marginBottom: 4,
                    }}
                  >
                    {song.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      fontSize: 11,
                      color: BRAND.muted,
                    }}
                  >
                    <span style={{ color: BRAND.glamGold }}>Key: {song.key}</span>
                    <span style={{ color: BRAND.electricTeal }}>{song.bpm} BPM</span>
                    <span style={{ color: BRAND.muted }}>{song.sections?.length || 0} sections</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel: setlist */}
        <div
          style={{
            flex: '0 0 60%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: BRAND.midnight,
            overflow: 'hidden',
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (draggedLibrarySong) {
              e.dataTransfer.dropEffect = 'copy'
            } else if (draggedSetlistIndex !== null) {
              e.dataTransfer.dropEffect = 'move'
            }
          }}
          onDrop={handleSetlistDrop}
          onDragLeave={handleSetlistDragLeave}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${BRAND.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: BRAND.hotPink,
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontFamily: 'Oswald, sans-serif',
              }}
            >
              Setlist
            </h2>
            <span
              style={{
                fontSize: 12,
                color: BRAND.muted,
                fontFamily: 'Space Mono, monospace',
              }}
            >
              {setlistItems.length} song{setlistItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
            }}
          >
            {setlistItems.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: BRAND.muted,
                  fontSize: 14,
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    marginBottom: 12,
                    opacity: 0.5,
                  }}
                >
                  🎸
                </div>
                Drag songs from the library to build your set
              </div>
            ) : (
              setlistItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  draggable
                  onDragStart={(e) => handleSetlistDragStart(e, index)}
                  onDragOver={(e) => handleSetlistDragOver(e, index)}
                  onDoubleClick={() => handleDoubleClick(item.id)}
                  style={{
                    backgroundColor:
                      dragOverIndex === index && draggedSetlistIndex !== null
                        ? `${BRAND.deepViolet}40`
                        : BRAND.card,
                    border: `1px solid ${
                      dragOverIndex === index
                        ? BRAND.electricTeal
                        : BRAND.border
                    }`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 8,
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'border-color 0.15s, background-color 0.15s',
                  }}
                  title="Double-click to play this song"
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: BRAND.deepViolet,
                      color: BRAND.glamGold,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.order}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#fff',
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        fontSize: 11,
                        color: BRAND.muted,
                      }}
                    >
                      <span style={{ color: BRAND.glamGold }}>Key: {item.key}</span>
                      <span style={{ color: BRAND.electricTeal }}>{item.bpm} BPM</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: BRAND.muted,
                      cursor: 'pointer',
                      fontSize: 18,
                      padding: '4px 8px',
                      borderRadius: 4,
                      transition: 'color 0.15s, background-color 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = BRAND.hotPink
                      e.currentTarget.style.backgroundColor = `${BRAND.hotPink}20`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = BRAND.muted
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer: duration + actions */}
          <div
            style={{
              padding: '14px 18px',
              borderTop: `1px solid ${BRAND.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: BRAND.muted, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
                Est. Duration:
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: BRAND.electricTeal,
                  fontFamily: 'Bebas Neue, sans-serif',
                }}
              >
                {durationDisplay}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleClearAll}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${BRAND.muted}`,
                  borderRadius: 8,
                  color: BRAND.muted,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontFamily: 'Oswald, sans-serif',
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = BRAND.hotPink
                  e.currentTarget.style.color = BRAND.hotPink
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BRAND.muted
                  e.currentTarget.style.color = BRAND.muted
                }}
              >
                Clear All
              </button>
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: BRAND.hotPink,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  padding: '8px 20px',
                  fontSize: 12,
                  fontFamily: 'Oswald, sans-serif',
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s, transform 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Save Setlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}