'use client'

import React, { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TimeSignature = '4/4' | '3/4' | '6/8'

export interface Hit {
  row: number
  bar: number
  beat: number
  velocity: number
}

export interface Section {
  id: string
  name: string
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'custom'
  bars: number
  startBar: number
}

export interface PatternData {
  bpm: number
  timeSignature: TimeSignature
  sections: Section[]
  hits: Hit[]
}

export interface SavedPattern {
  id: string
  name: string
  createdAt: string
  patternData: PatternData
}

interface PatternLibraryProps {
  isOpen: boolean
  onClose: () => void
  currentPattern?: PatternData
  onLoadPattern: (pattern: PatternData) => void
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tlk-drum-patterns'

const INSTRUMENTS = [
  { name: 'Kick', short: 'KICK', row: 0 },
  { name: 'Snare', short: 'SNAR', row: 1 },
  { name: 'HH Closed', short: 'HH-C', row: 2 },
  { name: 'HH Open', short: 'HH-O', row: 3 },
  { name: 'Floor Tom 14"', short: 'FT14', row: 4 },
  { name: 'Floor Tom 16"', short: 'FT16', row: 5 },
  { name: 'Rack Tom 12"', short: 'RT12', row: 6 },
  { name: 'Rack Tom 14"', short: 'RT14', row: 7 },
  { name: 'Crash', short: 'CRSH', row: 8 },
  { name: 'Splash', short: 'SPLS', row: 9 },
  { name: 'Ride', short: 'RIDE', row: 10 },
]

// ─────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────

function loadPatterns(): SavedPattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedPattern[]
  } catch {
    return []
  }
}

function savePatterns(patterns: SavedPattern[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns))
  } catch {
    // storage full or unavailable — fail silently
  }
}

// ─────────────────────────────────────────────────────────────
// Mini grid preview
// ─────────────────────────────────────────────────────────────

interface MiniPreviewProps {
  hits: Hit[]
  timeSignature: TimeSignature
}

function MiniPreview({ hits, timeSignature }: MiniPreviewProps) {
  const beatsPerBar = timeSignature === '3/4' ? 3 : timeSignature === '6/8' ? 6 : 4
  const totalCols = beatsPerBar * 4 // 4 bars max in preview

  // Determine which rows have any hits
  const activeRows = new Set(hits.map(h => h.row))
  const displayRows = INSTRUMENTS.filter(i => activeRows.has(i.row))

  // Normalize hits to fit 4 bars
  const normalizedHits = hits.map(h => ({
    ...h,
    col: (h.bar % 4) * beatsPerBar + h.beat,
  }))

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `40px repeat(${totalCols}, 1fr)`,
      gap: '1px',
      width: '100%',
      aspectRatio: `${totalCols + 1} / ${Math.max(displayRows.length, 1)}`,
    }}>
      {/* Row labels */}
      {displayRows.map(inst => (
        <div key={inst.row} style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 7,
          color: 'var(--lk-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 4,
        }}>
          {inst.short}
        </div>
      ))}
      {/* Cells */}
      {displayRows.map(inst => (
        <React.Fragment key={inst.row}>
          {Array.from({ length: totalCols }, (_, col) => {
            const hit = normalizedHits.find(h => h.row === inst.row && h.col === col)
            return (
              <div key={col} style={{
                background: hit ? 'var(--lk-pink)' : 'var(--lk-void)',
                borderRadius: 2,
                opacity: hit ? (0.4 + hit.velocity * 0.6) : 0.3,
                boxShadow: hit ? `0 0 4px var(--lk-pink-glow)` : 'none',
              }} />
            )
          })}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pattern Card
// ─────────────────────────────────────────────────────────────

interface PatternCardProps {
  pattern: SavedPattern
  onLoad: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function PatternCard({ pattern, onLoad, onDuplicate, onDelete }: PatternCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dateStr = new Date(pattern.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const hitCount = pattern.patternData.hits.length
  const bpm = pattern.patternData.bpm
  const ts = pattern.patternData.timeSignature

  return (
    <div style={{
      background: 'var(--lk-void)',
      border: '1px solid var(--lk-subtle)',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      transition: 'border-color 0.2s',
    }}>
      {/* Mini Preview */}
      <div style={{
        padding: '12px 12px 8px',
        background: 'var(--lk-black)',
        borderBottom: '1px solid var(--lk-subtle)',
      }}>
        <MiniPreview hits={pattern.patternData.hits} timeSignature={pattern.patternData.timeSignature} />
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--lk-white)',
          letterSpacing: 1,
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {pattern.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--lk-muted)',
          letterSpacing: 1,
        }}>
          {dateStr} · {bpm} BPM · {ts} · {hitCount} hits
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '10px 12px',
        borderTop: '1px solid var(--lk-subtle)',
        background: 'var(--lk-deep)',
      }}>
        <button
          onClick={onLoad}
          style={{
            flex: 1,
            padding: '6px 8px',
            background: 'var(--lk-pink)',
            border: 'none',
            borderRadius: 6,
            color: 'var(--lk-black)',
            fontFamily: 'var(--font-heading)',
            fontSize: 10,
            letterSpacing: 1,
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--lk-pink-glow)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--lk-pink)')}
        >
          Load
        </button>
        <button
          onClick={onDuplicate}
          style={{
            padding: '6px 8px',
            background: 'transparent',
            border: '1px solid var(--lk-subtle)',
            borderRadius: 6,
            color: 'var(--lk-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: 10,
            letterSpacing: 1,
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lk-teal)'; e.currentTarget.style.color = 'var(--lk-teal)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lk-subtle)'; e.currentTarget.style.color = 'var(--lk-muted)' }}
        >
          Copy
        </button>
        {confirmDelete ? (
          <>
            <button
              onClick={onDelete}
              style={{
                padding: '6px 8px',
                background: '#ff4444',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                fontFamily: 'var(--font-heading)',
                fontSize: 10,
                letterSpacing: 1,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                padding: '6px 8px',
                background: 'transparent',
                border: '1px solid var(--lk-subtle)',
                borderRadius: 6,
                color: 'var(--lk-muted)',
                fontFamily: 'var(--font-heading)',
                fontSize: 10,
                letterSpacing: 1,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              No
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              padding: '6px 8px',
              background: 'transparent',
              border: '1px solid var(--lk-subtle)',
              borderRadius: 6,
              color: 'var(--lk-muted)',
              fontFamily: 'var(--font-heading)',
              fontSize: 10,
              letterSpacing: 1,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff4444'; e.currentTarget.style.color = '#ff4444' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lk-subtle)'; e.currentTarget.style.color = 'var(--lk-muted)' }}
          >
            Del
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pattern Library Modal
// ─────────────────────────────────────────────────────────────

export default function PatternLibrary({ isOpen, onClose, currentPattern, onLoadPattern }: PatternLibraryProps) {
  const [patterns, setPatterns] = useState<SavedPattern[]>([])
  const [saveName, setSaveName] = useState('')
  const [saveError, setSaveError] = useState('')

  // Load from storage on mount / whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPatterns(loadPatterns())
      setSaveName('')
      setSaveError('')
    }
  }, [isOpen])

  const handleSave = useCallback(() => {
    if (!currentPattern) {
      setSaveError('No pattern to save — add some hits first.')
      return
    }
    const name = saveName.trim()
    if (!name) {
      setSaveError('Please enter a name.')
      return
    }

    const newPattern: SavedPattern = {
      id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      createdAt: new Date().toISOString(),
      patternData: { ...currentPattern },
    }

    const updated = [newPattern, ...patterns]
    setPatterns(updated)
    savePatterns(updated)
    setSaveName('')
    setSaveError('')
  }, [currentPattern, saveName, patterns])

  const handleLoad = useCallback((pattern: SavedPattern) => {
    onLoadPattern(pattern.patternData)
    onClose()
  }, [onLoadPattern, onClose])

  const handleDuplicate = useCallback((pattern: SavedPattern) => {
    const copy: SavedPattern = {
      ...pattern,
      id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${pattern.name} (copy)`,
      createdAt: new Date().toISOString(),
      patternData: JSON.parse(JSON.stringify(pattern.patternData)),
    }
    const updated = [copy, ...patterns]
    setPatterns(updated)
    savePatterns(updated)
  }, [patterns])

  const handleDelete = useCallback((id: string) => {
    const updated = patterns.filter(p => p.id !== id)
    setPatterns(updated)
    savePatterns(updated)
  }, [patterns])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hasCurrentPattern = currentPattern && currentPattern.hits.length > 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(8, 6, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--lk-void)',
          border: '1px solid var(--lk-subtle)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 760,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(255, 45, 155, 0.12), 0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--lk-subtle)',
          background: 'var(--lk-deep)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              letterSpacing: 3,
              color: 'var(--lk-pink)',
              margin: 0,
            }}>
              Pattern Library
            </h2>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--lk-muted)',
              letterSpacing: 1,
              marginTop: 4,
            }}>
              {patterns.length} saved pattern{patterns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--lk-subtle)',
              borderRadius: 8,
              color: 'var(--lk-muted)',
              fontSize: 18,
              width: 36,
              height: 36,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lk-pink)'; e.currentTarget.style.color = 'var(--lk-pink)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lk-subtle)'; e.currentTarget.style.color = 'var(--lk-muted)' }}
          >
            ×
          </button>
        </div>

        {/* ── Save bar ───────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--lk-subtle)',
          background: 'var(--lk-void)',
          flexShrink: 0,
        }}>
          {hasCurrentPattern ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                className="input"
                type="text"
                placeholder="Name this pattern..."
                value={saveName}
                onChange={e => { setSaveName(e.target.value); setSaveError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                onClick={handleSave}
                className="btn btn-primary"
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Save Pattern
              </button>
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--lk-muted)',
              letterSpacing: 1,
            }}>
              Add hits to the drummer grid to save a pattern
            </div>
          )}
          {saveError && (
            <div style={{
              marginTop: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#ff4444',
              letterSpacing: 1,
            }}>
              {saveError}
            </div>
          )}
        </div>

        {/* ── Pattern grid ────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          {patterns.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{ fontSize: 40, opacity: 0.3 }}>🥁</div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  letterSpacing: 2,
                  color: 'var(--lk-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}>
                  No saved patterns yet
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--lk-muted)',
                  letterSpacing: 1,
                }}>
                  Hit Save in the grid to store your first pattern.
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}>
              {patterns.map(pattern => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onLoad={() => handleLoad(pattern)}
                  onDuplicate={() => handleDuplicate(pattern)}
                  onDelete={() => handleDelete(pattern.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}