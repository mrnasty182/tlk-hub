'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'solo' | 'pre-chorus' | 'tag'

export interface ChordPlacement {
  chord: string
  position: number // character index in the lyric line
}

export interface LineData {
  id: string
  lyric: string
  chords: ChordPlacement[]
}

export interface SectionData {
  id: string
  name: string
  type: SectionType
  lines: LineData[]
}

export interface SongData {
  title: string
  artist: string
  key: string
  bpm: number
  timeSignature: string
  sections: SectionData[]
}

interface SongEditorProps {
  /** New structured song data (recommended) */
  initialSong?: SongData
  /** Legacy ChordPro string content */
  initialContent?: string
  onSave?: (song: SongData) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_TYPES: SectionType[] = ['intro', 'verse', 'chorus', 'bridge', 'outro', 'solo', 'pre-chorus', 'tag']

const SECTION_COLORS: Record<SectionType, string> = {
  'intro':       '#9B4FDE',
  'verse':       '#FF2D9B',
  'chorus':      '#00E5CC',
  'bridge':      '#F0C040',
  'outro':       '#FF6EC7',
  'solo':        '#7B2FBE',
  'pre-chorus':  '#CC1F7A',
  'tag':         '#6644AA',
}

const SECTION_LABELS: Record<SectionType, string> = {
  'intro':       'INTRO',
  'verse':       'VERSE',
  'chorus':      'CHORUS',
  'bridge':      'BRIDGE',
  'outro':       'OUTRO',
  'solo':        'SOLO',
  'pre-chorus':  'PRE-CHORUS',
  'tag':         'TAG',
}

const DEFAULT_SONG: SongData = {
  title: 'Stay Hard',
  artist: 'The Loin Kings',
  key: 'A',
  bpm: 124,
  timeSignature: '4/4',
  sections: [
    {
      id: 's1', name: 'Intro', type: 'intro',
      lines: [
        { id: 'l1', lyric: '                    ', chords: [] },
        { id: 'l2', lyric: '                    ', chords: [] },
      ],
    },
    {
      id: 's2', name: 'Verse 1', type: 'verse',
      lines: [
        { id: 'l3', lyric: 'We don\'t stop when the lights go down', chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 18 }, { chord: 'F#m', position: 25 }, { chord: 'D', position: 35 }] },
        { id: 'l4', lyric: 'We run it back like we own this town', chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 18 }, { chord: 'F#m', position: 25 }, { chord: 'D', position: 35 }] },
        { id: 'l5', lyric: '', chords: [] },
        { id: 'l6', lyric: 'Every night we rise, no compromise', chords: [{ chord: 'F#m', position: 0 }, { chord: 'D', position: 23 }, { chord: 'A', position: 32 }, { chord: 'E', position: 40 }] },
        { id: 'l7', lyric: 'The kings are here — we visualize', chords: [{ chord: 'F#m', position: 0 }, { chord: 'D', position: 23 }, { chord: 'A', position: 32 }, { chord: 'E', position: 40 }] },
      ],
    },
    {
      id: 's3', name: 'Chorus', type: 'chorus',
      lines: [
        { id: 'l8', lyric: 'Stay hard, stay loud, stay live', chords: [{ chord: 'D', position: 0 }, { chord: 'A', position: 10 }, { chord: 'E', position: 20 }, { chord: 'F#m', position: 28 }] },
        { id: 'l9', lyric: 'We are the kings — we multiply', chords: [{ chord: 'D', position: 0 }, { chord: 'A', position: 10 }, { chord: 'E', position: 20 }, { chord: 'F#m', position: 28 }] },
        { id: 'l10', lyric: '', chords: [] },
        { id: 'l11', lyric: 'Stay hard, stay loud, stay true', chords: [{ chord: 'D', position: 0 }, { chord: 'A', position: 10 }, { chord: 'E', position: 20 }, { chord: 'F#m', position: 28 }] },
        { id: 'l12', lyric: 'The Loin Kings never say goodbye', chords: [{ chord: 'D', position: 0 }, { chord: 'A', position: 10 }, { chord: 'E', position: 20 }, { chord: 'F#m', position: 28 }] },
      ],
    },
    {
      id: 's4', name: 'Verse 2', type: 'verse',
      lines: [
        { id: 'l13', lyric: 'Bass drops low, drums keep the time', chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 17 }, { chord: 'F#m', position: 27 }, { chord: 'D', position: 37 }] },
        { id: 'l14', lyric: 'Every head nodding — that\'s by design', chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 17 }, { chord: 'F#m', position: 27 }, { chord: 'D', position: 37 }] },
        { id: 'l15', lyric: '', chords: [] },
        { id: 'l16', lyric: 'Guitar cuts clean, you feel the heat', chords: [{ chord: 'F#m', position: 0 }, { chord: 'D', position: 20 }, { chord: 'A', position: 30 }, { chord: 'E', position: 38 }] },
        { id: 'l17', lyric: 'Melody hitting every heartbeat', chords: [{ chord: 'F#m', position: 0 }, { chord: 'D', position: 20 }, { chord: 'A', position: 30 }, { chord: 'E', position: 38 }] },
      ],
    },
    {
      id: 's5', name: 'Bridge', type: 'bridge',
      lines: [
        { id: 'l18', lyric: 'Stand up if you feel it', chords: [{ chord: 'E', position: 0 }, { chord: 'F#m', position: 14 }, { chord: 'D', position: 22 }, { chord: 'A', position: 29 }] },
        { id: 'l19', lyric: 'Stand up if you\'re with it', chords: [{ chord: 'E', position: 0 }, { chord: 'F#m', position: 14 }, { chord: 'D', position: 22 }, { chord: 'A', position: 29 }] },
        { id: 'l20', lyric: '', chords: [] },
        { id: 'l21', lyric: 'Everybody move — this is the groove', chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 22 }, { chord: 'D', position: 31 }, { chord: 'F#m', position: 38 }] },
      ],
    },
    {
      id: 's6', name: 'Chorus', type: 'chorus',
      lines: [
        { id: 'l22', lyric: 'Stay hard, stay loud, stay live', chords: [{ chord: 'D', position: 0 }, { chord: 'A', position: 10 }, { chord: 'E', position: 20 }, { chord: 'F#m', position: 28 }] },
        { id: 'l23', lyric: 'We are the kings — we multiply', chords: [{ chord: 'D', position: 0 }, { chord: 'A', position: 10 }, { chord: 'E', position: 20 }, { chord: 'F#m', position: 28 }] },
        { id: 'l24', lyric: '', chords: [] },
        { id: 'l25', lyric: 'Stay hard — forever we thrive', chords: [{ chord: 'D', position: 0 }, { chord: 'A', position: 10 }, { chord: 'E', position: 20 }, { chord: 'F#m', position: 28 }] },
        { id: 'l26', lyric: 'The Loin Kings stay alive', chords: [{ chord: 'D', position: 0 }, { chord: 'A', position: 10 }, { chord: 'E', position: 20 }, { chord: 'F#m', position: 28 }] },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

let idCounter = 0
function uid(): string {
  return `id_${++idCounter}_${Math.random().toString(36).slice(2, 7)}`
}

function getActiveSection(song: SongData, scrollTop: number, lineHeight: number): string | null {
  // Returns section id at a given scroll position
  let cumHeight = 0
  for (const section of song.sections) {
    const sectionHeight = section.lines.length * lineHeight + 44 // +44 for header
    if (scrollTop < cumHeight + sectionHeight) return section.id
    cumHeight += sectionHeight
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// ChordSheet (read-only / display with auto-scroll)
// ─────────────────────────────────────────────────────────────────────────────

interface ChordSheetProps {
  song: SongData
  isPlaying: boolean
  currentLine: string
  onLineClick: (lineId: string) => void
}

function ChordSheet({ song, isPlaying, currentLine, onLineClick }: ChordSheetProps) {
  return (
    <div className="chord-sheet">
      {song.sections.map((section) => (
        <div key={section.id} className="sheet-section" data-type={section.type}>
          <div
            className="section-sticky-header"
            style={{ '--section-color': SECTION_COLORS[section.type] } as React.CSSProperties}
          >
            <span className="section-type-badge">{SECTION_LABELS[section.type]}</span>
            <span className="section-name">{section.name}</span>
          </div>
          {section.lines.map((line) => {
            const isActive = line.id === currentLine
            return (
              <div
                key={line.id}
                className={`sheet-line ${isActive ? 'active' : ''} ${!line.lyric.trim() ? 'empty' : ''}`}
                onClick={() => onLineClick(line.id)}
              >
                {/* Chord row */}
                <div className="chord-row">
                  {line.chords.map((cp, ci) => (
                    <span
                      key={ci}
                      className="chord-chip-display"
                      style={{
                        left: `calc(${cp.position}ch + 0.5px)`,
                        backgroundColor: SECTION_COLORS[section.type] + '33',
                        color: SECTION_COLORS[section.type],
                        borderColor: SECTION_COLORS[section.type],
                      }}
                    >
                      {cp.chord}
                    </span>
                  ))}
                </div>
                {/* Lyric row */}
                <div className="lyric-row">
                  {line.lyric || <span className="line-placeholder">—</span>}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SongEditor
// ─────────────────────────────────────────────────────────────────────────────

export default function SongEditor({ initialSong, onSave }: SongEditorProps) {
  const [song, setSong] = useState<SongData>(initialSong ?? DEFAULT_SONG)
  const [editMode, setEditMode] = useState<'song' | 'chords'>('song')
  const [selectedSection, setSelectedSection] = useState<string>(song.sections[0]?.id ?? '')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLine, setCurrentLine] = useState<string>('')
  const [bpmInput, setBpmInput] = useState(song.bpm.toString())
  const scrollRef = useRef<HTMLDivElement>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lineIndexRef = useRef(0)

  const allLines = useMemo(() => {
    return song.sections.flatMap(s => s.lines)
  }, [song])

  const lineHeight = 52 // px per line including chord+lyric rows

  // ── Auto-scroll play logic ──────────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
    setIsPlaying(false)
    setCurrentLine('')
    lineIndexRef.current = 0
  }, [])

  const startPlayback = useCallback((startLineId?: string) => {
    stopPlayback()
    const startIdx = startLineId
      ? allLines.findIndex(l => l.id === startLineId)
      : 0
    lineIndexRef.current = startIdx
    setIsPlaying(true)

    const msPerBeat = (60 / song.bpm) * 1000

    playIntervalRef.current = setInterval(() => {
      const idx = lineIndexRef.current
      if (idx >= allLines.length) {
        stopPlayback()
        return
      }
      const line = allLines[idx]
      setCurrentLine(line.id)

      // Scroll into view
      if (scrollRef.current) {
        const lineEl = scrollRef.current.querySelector(`[data-line-id="${line.id}"]`)
        if (lineEl) {
          lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }

      lineIndexRef.current = idx + 1
    }, msPerBeat * 2) // 2 beats per line advance
  }, [allLines, song.bpm, stopPlayback])

  // ── Section editing ─────────────────────────────────────────────────────────

  const updateSection = useCallback((sectionId: string, updates: Partial<SectionData>) => {
    setSong(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }))
  }, [])

  const updateLine = useCallback((sectionId: string, lineId: string, lyric: string) => {
    setSong(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? { ...s, lines: s.lines.map(l => l.id === lineId ? { ...l, lyric } : l) }
          : s
      ),
    }))
  }, [])

  const updateBpm = useCallback((val: string) => {
    setBpmInput(val)
    const n = parseInt(val)
    if (!isNaN(n) && n > 0 && n < 400) {
      setSong(prev => ({ ...prev, bpm: n }))
    }
  }, [])

  const handleSave = useCallback(() => {
    onSave?.(song)
  }, [song, onSave])

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeSection = song.sections.find(s => s.id === selectedSection)

  return (
    <div className="song-editor-v2">
      <style>{`
        .song-editor-v2 {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--lk-black);
          font-family: var(--font-body);
        }

        /* ── Header Bar ── */
        .editor-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          border-bottom: 1px solid var(--lk-subtle);
          flex-shrink: 0;
          background: var(--lk-void);
        }
        .editor-song-title {
          font-family: var(--font-display);
          font-size: 22px;
          letter-spacing: 2px;
          color: var(--lk-pink);
          flex: 1;
        }
        .editor-song-meta {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--lk-muted);
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .meta-bpm-display {
          color: var(--lk-teal);
          font-size: 14px;
          font-weight: 700;
        }
        .meta-key {
          color: var(--lk-gold);
          text-transform: uppercase;
        }

        /* ── Transport Bar ── */
        .transport-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          border-bottom: 1px solid var(--lk-subtle);
          background: var(--lk-deep);
          flex-shrink: 0;
        }
        .transport-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--lk-subtle);
          background: transparent;
          color: var(--lk-white);
          font-size: 18px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .transport-btn:hover {
          border-color: var(--lk-pink);
          color: var(--lk-pink);
        }
        .transport-btn.active {
          background: var(--lk-pink);
          border-color: var(--lk-pink);
          color: var(--lk-black);
        }
        .transport-bpm {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .transport-bpm label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--lk-muted);
          letter-spacing: 1px;
        }
        .bpm-control {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .bpm-control button {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid var(--lk-subtle);
          background: transparent;
          color: var(--lk-white);
          font-size: 14px;
          cursor: pointer;
        }
        .bpm-control button:hover {
          border-color: var(--lk-teal);
          color: var(--lk-teal);
        }
        .bpm-display {
          font-family: var(--font-mono);
          font-size: 18px;
          color: var(--lk-teal);
          font-weight: 700;
          min-width: 48px;
          text-align: center;
        }
        .bpm-input {
          width: 56px;
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 4px;
          padding: 4px 8px;
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--lk-teal);
          text-align: center;
        }
        .bpm-input:focus {
          outline: none;
          border-color: var(--lk-teal);
        }
        .transport-section-select {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }
        .section-tab-btn {
          padding: 6px 14px;
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 4px;
          border: 1px solid var(--lk-subtle);
          background: transparent;
          color: var(--lk-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .section-tab-btn:hover {
          color: var(--lk-white);
          border-color: var(--lk-muted);
        }
        .section-tab-btn.active {
          color: var(--lk-white);
          background: var(--lk-violet);
          border-color: var(--lk-violet);
        }

        /* ── Main area ── */
        .editor-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* ── Chord Sheet (center) ── */
        .chord-sheet-container {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .chord-sheet-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .chord-sheet-scroll::-webkit-scrollbar { width: 4px; }
        .chord-sheet-scroll::-webkit-scrollbar-track { background: var(--lk-void); }
        .chord-sheet-scroll::-webkit-scrollbar-thumb { background: var(--lk-violet); border-radius: 2px; }

        /* Section block */
        .sheet-section { margin-bottom: 32px; }

        /* Sticky section header */
        .section-sticky-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: color-mix(in srgb, var(--section-color) 15%, transparent);
          border-left: 3px solid var(--section-color);
          border-radius: 4px 4px 0 0;
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(8px);
        }
        .section-type-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--section-color);
          text-transform: uppercase;
          opacity: 0.9;
        }
        .section-name {
          font-family: var(--font-heading);
          font-size: 12px;
          letter-spacing: 1px;
          color: var(--section-color);
          text-transform: uppercase;
        }

        /* Line rows */
        .sheet-line {
          display: flex;
          flex-direction: column;
          padding: 2px 0;
          cursor: pointer;
          border-radius: 3px;
          transition: background 0.1s;
          position: relative;
        }
        .sheet-line:hover { background: rgba(255,255,255,0.03); }
        .sheet-line.active {
          background: rgba(255, 45, 155, 0.08);
        }
        .sheet-line.empty .lyric-row { opacity: 0.3; }

        /* Chord row */
        .chord-row {
          height: 22px;
          position: relative;
          font-family: var(--font-mono);
          font-size: 10px;
          white-space: pre;
          overflow: hidden;
        }
        .chord-chip-display {
          position: absolute;
          top: 2px;
          padding: 1px 5px;
          border-radius: 3px;
          border: 1px solid;
          font-weight: 700;
          letter-spacing: 0.5px;
          white-space: pre;
          transform: translateX(0);
        }

        /* Lyric row */
        .lyric-row {
          font-size: 15px;
          color: var(--lk-white);
          white-space: pre;
          line-height: 1.5;
          font-family: var(--font-body);
          min-height: 24px;
        }
        .line-placeholder { color: var(--lk-subtle); }

        /* ── Edit Panel (left) ── */
        .edit-panel {
          width: 340px;
          flex-shrink: 0;
          border-right: 1px solid var(--lk-subtle);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--lk-void);
        }
        .edit-panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--lk-subtle);
          display: flex;
          gap: 8px;
        }
        .edit-panel-header span {
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
        }
        .edit-section-picker {
          padding: 8px 16px;
          border-bottom: 1px solid var(--lk-subtle);
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .section-pick-btn {
          padding: 5px 12px;
          font-family: var(--font-heading);
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 4px;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
        }
        .edit-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .edit-panel-body::-webkit-scrollbar { width: 3px; }
        .edit-panel-body::-webkit-scrollbar-track { background: transparent; }
        .edit-panel-body::-webkit-scrollbar-thumb { background: var(--lk-subtle); border-radius: 2px; }

        .line-edit-item {
          border: 1px solid var(--lk-subtle);
          border-radius: 6px;
          overflow: hidden;
        }
        .line-edit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--lk-deep);
          border-bottom: 1px solid var(--lk-subtle);
        }
        .line-edit-header span {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--lk-muted);
        }
        .line-edit-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--lk-subtle);
          padding: 10px 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--lk-white);
          resize: none;
          min-height: 48px;
          box-sizing: border-box;
        }
        .line-edit-input:focus {
          outline: none;
          border-bottom-color: var(--lk-pink);
          background: rgba(255,45,155,0.03);
        }
        .line-edit-input::placeholder { color: var(--lk-muted); }

        /* ── Chord Editor (right) ── */
        .chord-editor-panel {
          width: 260px;
          flex-shrink: 0;
          border-left: 1px solid var(--lk-subtle);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--lk-void);
        }
        .chord-editor-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--lk-subtle);
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
        }
        .chord-editor-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .chord-editor-section-title {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 2px;
          color: var(--lk-violet);
          text-transform: uppercase;
          margin-bottom: 8px;
          margin-top: 16px;
        }
        .chord-editor-section-title:first-child { margin-top: 0; }
        .chord-line-edit {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .chord-line-preview {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--lk-muted);
          padding: 4px 8px;
          background: var(--lk-deep);
          border-radius: 4px;
          min-height: 20px;
        }
        .chord-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .chord-pill {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .chord-pill input {
          width: 54px;
          background: var(--lk-deep);
          border: 1px solid var(--lk-subtle);
          border-radius: 4px;
          padding: 4px 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--lk-teal);
          text-align: center;
        }
        .chord-pill input:focus {
          outline: none;
          border-color: var(--lk-teal);
        }
        .chord-pill input::placeholder { color: var(--lk-muted); }
        .remove-chord-btn {
          background: transparent;
          border: none;
          color: var(--lk-muted);
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .remove-chord-btn:hover { color: var(--lk-pink); }
        .add-chord-btn {
          background: transparent;
          border: 1px dashed var(--lk-subtle);
          border-radius: 4px;
          padding: 6px 12px;
          color: var(--lk-muted);
          font-family: var(--font-mono);
          font-size: 10px;
          cursor: pointer;
          width: 100%;
          transition: all 0.15s;
        }
        .add-chord-btn:hover {
          border-color: var(--lk-pink);
          color: var(--lk-pink);
        }

        /* ── Section type color dots on section pick buttons ── */
        .section-pick-btn { border-color: var(--lk-subtle); color: var(--lk-muted); }
        .section-pick-btn.active { color: var(--lk-white); }
        .section-pick-btn[data-type="intro"]    { border-color: #9B4FDE; }
        .section-pick-btn[data-type="intro"].active    { background: #9B4FDE; color: white; }
        .section-pick-btn[data-type="verse"]    { border-color: #FF2D9B; }
        .section-pick-btn[data-type="verse"].active    { background: #FF2D9B; color: white; }
        .section-pick-btn[data-type="chorus"]   { border-color: #00E5CC; }
        .section-pick-btn[data-type="chorus"].active   { background: #00E5CC; color: black; }
        .section-pick-btn[data-type="bridge"]   { border-color: #F0C040; }
        .section-pick-btn[data-type="bridge"].active   { background: #F0C040; color: black; }
        .section-pick-btn[data-type="outro"]   { border-color: #FF6EC7; }
        .section-pick-btn[data-type="outro"].active   { background: #FF6EC7; color: black; }
        .section-pick-btn[data-type="solo"]     { border-color: #7B2FBE; }
        .section-pick-btn[data-type="solo"].active     { background: #7B2FBE; color: white; }
        .section-pick-btn[data-type="pre-chorus"] { border-color: #CC1F7A; }
        .section-pick-btn[data-type="pre-chorus"].active { background: #CC1F7A; color: white; }
        .section-pick-btn[data-type="tag"]     { border-color: #6644AA; }
        .section-pick-btn[data-type="tag"].active     { background: #6644AA; color: white; }
      `}</style>

      {/* ── Header ── */}
      <div className="editor-header">
        <span className="editor-song-title">{song.title}</span>
        <div className="editor-song-meta">
          <span>{song.artist}</span>
          <span className="meta-key">{song.key}</span>
          <span className="meta-bpm-display">{song.bpm} BPM</span>
          <span>{song.timeSignature}</span>
        </div>
      </div>

      {/* ── Transport Bar ── */}
      <div className="transport-bar">
        <button
          className={`transport-btn ${isPlaying ? 'active' : ''}`}
          onClick={() => isPlaying ? stopPlayback() : startPlayback(currentLine || undefined)}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? '⏹' : '▶'}
        </button>

        <div className="transport-bpm">
          <label>BPM</label>
          <div className="bpm-control">
            <button onClick={() => updateBpm(String(Math.max(40, song.bpm - 1)))}>−</button>
            <input
              className="bpm-input"
              type="number"
              value={bpmInput}
              onChange={e => updateBpm(e.target.value)}
              min={40}
              max={300}
            />
            <button onClick={() => updateBpm(String(Math.min(300, song.bpm + 1)))}>+</button>
          </div>
        </div>

        <div className="transport-section-select">
          {song.sections.map(s => (
            <button
              key={s.id}
              className={`section-tab-btn ${selectedSection === s.id ? 'active' : ''}`}
              style={{ '--active-color': SECTION_COLORS[s.type] } as React.CSSProperties}
              onClick={() => {
                setSelectedSection(s.id)
                if (isPlaying) startPlayback(s.lines[0]?.id)
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        <button
          className="transport-btn"
          style={{ marginLeft: 8, fontSize: 11, width: 56, borderRadius: 6 }}
          onClick={handleSave}
        >
          SAVE
        </button>
      </div>

      {/* ── Main ── */}
      <div className="editor-main">
        {/* Edit Panel */}
        <div className="edit-panel">
          <div className="edit-panel-header">
            <span>✏️ Edit Sections</span>
          </div>
          <div className="edit-section-picker">
            {song.sections.map(s => (
              <button
                key={s.id}
                data-type={s.type}
                className={`section-pick-btn ${selectedSection === s.id ? 'active' : ''}`}
                onClick={() => setSelectedSection(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="edit-panel-body">
            {activeSection?.lines.map((line) => (
              <div key={line.id} className="line-edit-item">
                <div className="line-edit-header">
                  <span>LINE</span>
                  <span>{line.chords.length} chord{line.chords.length !== 1 ? 's' : ''}</span>
                </div>
                <textarea
                  className="line-edit-input"
                  value={line.lyric}
                  onChange={e => updateLine(selectedSection, line.id, e.target.value)}
                  placeholder="Type lyrics here..."
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Chord Sheet */}
        <div className="chord-sheet-container">
          <div className="chord-sheet-scroll" ref={scrollRef}>
            <ChordSheet
              song={song}
              isPlaying={isPlaying}
              currentLine={currentLine}
              onLineClick={(lineId) => {
                if (isPlaying) stopPlayback()
                setCurrentLine(lineId)
                const section = song.sections.find(s => s.lines.some(l => l.id === lineId))
                if (section) setSelectedSection(section.id)
              }}
            />
          </div>
        </div>

        {/* Chord Editor Panel */}
        <div className="chord-editor-panel">
          <div className="chord-editor-header">🎸 Chord Placement</div>
          <div className="chord-editor-body">
            {song.sections.map(section => (
              <div key={section.id}>
                <div className="chord-editor-section-title">
                  {section.name}
                </div>
                {section.lines.map(line => (
                  <div key={line.id} className="chord-line-edit">
                    <div className="chord-line-preview">
                      {line.lyric.trim() || '—'}
                    </div>
                    <div className="chord-pill-row">
                      {line.chords.map((cp, ci) => (
                        <div key={ci} className="chord-pill">
                          <input
                            type="text"
                            value={cp.chord}
                            onChange={e => {
                              const newChords = [...line.chords]
                              newChords[ci] = { ...cp, chord: e.target.value }
                              const updateChord = (sectionId: string, lineId: string, chords: ChordPlacement[]) => {
                                setSong(prev => ({
                                  ...prev,
                                  sections: prev.sections.map(s =>
                                    s.id === sectionId
                                      ? { ...s, lines: s.lines.map(l => l.id === lineId ? { ...l, chords } : l) }
                                      : s
                                  ),
                                }))
                              }
                              updateChord(section.id, line.id, newChords)
                            }}
                            placeholder="C"
                          />
                          <input
                            type="number"
                            value={cp.position}
                            min={0}
                            max={line.lyric.length}
                            onChange={e => {
                              const newChords = [...line.chords]
                              newChords[ci] = { ...cp, position: parseInt(e.target.value) || 0 }
                              setSong(prev => ({
                                ...prev,
                                sections: prev.sections.map(s =>
                                  s.id === section.id
                                    ? { ...s, lines: s.lines.map(l => l.id === line.id ? { ...l, chords: newChords } : l) }
                                    : s
                                ),
                              }))
                            }}
                            style={{ width: 44 }}
                            title="Character position"
                          />
                          <button
                            className="remove-chord-btn"
                            onClick={() => {
                              const newChords = line.chords.filter((_, i) => i !== ci)
                              setSong(prev => ({
                                ...prev,
                                sections: prev.sections.map(s =>
                                  s.id === section.id
                                    ? { ...s, lines: s.lines.map(l => l.id === line.id ? { ...l, chords: newChords } : l) }
                                    : s
                                ),
                              }))
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        className="add-chord-btn"
                        onClick={() => {
                          setSong(prev => ({
                            ...prev,
                            sections: prev.sections.map(s =>
                              s.id === section.id
                                ? {
                                    ...s,
                                    lines: s.lines.map(l =>
                                      l.id === line.id
                                        ? { ...l, chords: [...l.chords, { chord: 'C', position: 0 }] }
                                        : l
                                    ),
                                  }
                                : s
                            ),
                          }))
                        }}
                      >
                        + Add chord
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}