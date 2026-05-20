'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TimeSignature = '4/4' | '3/4' | '6/8'

export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'custom'

export interface Hit {
  row: number
  bar: number
  beat: number
  velocity: number // 0.3 = soft, 0.7 = medium, 1.0 = hard
}

export interface Section {
  id: string
  name: string
  type: SectionType
  bars: number // number of bars in this section
  startBar: number // starting bar index
}

export interface PatternData {
  bpm: number
  timeSignature: TimeSignature
  sections: Section[]
  hits: Hit[]
}

type DragState = {
  active: boolean
  mode: 'copy' | 'paste' | 'clear' | null
  startRow: number | null
  startBar: number | null
  startBeat: number | null
  currentRow: number | null
  currentBar: number | null
  currentBeat: number | null
  copiedHits: Hit[] | null
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

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

const TIME_SIGNATURE_BEATS: Record<TimeSignature, number> = {
  '4/4': 4,
  '3/4': 3,
  '6/8': 6,
}

const SECTION_COLORS: Record<SectionType, string> = {
  intro: 'var(--lk-violet)',
  verse: 'var(--lk-pink)',
  chorus: 'var(--lk-teal)',
  bridge: 'var(--lk-gold)',
  outro: 'var(--lk-pink-glow)',
  custom: 'var(--lk-muted)',
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getBeatsInBar(ts: TimeSignature): number {
  return TIME_SIGNATURE_BEATS[ts]
}

function getTotalBars(sections: Section[]): number {
  if (sections.length === 0) return 4
  return Math.max(...sections.map(s => s.startBar + s.bars))
}

function hitAt(hits: Hit[], row: number, bar: number, beat: number): Hit | undefined {
  return hits.find(h => h.row === row && h.bar === bar && h.beat === beat)
}

function velocityLabel(v: number): string {
  if (v >= 0.9) return 'H'
  if (v >= 0.6) return 'M'
  return 'S'
}

// ─────────────────────────────────────────────────────────────
// DrummerGrid Component
// ─────────────────────────────────────────────────────────────

interface DrummerGridProps {
  initialData?: PatternData
  onChange?: (data: PatternData) => void
}

export default function DrummerGrid({ initialData, onChange }: DrummerGridProps) {
  const [bpm, setBpm] = useState(initialData?.bpm ?? 120)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(initialData?.timeSignature ?? '4/4')
  const [sections, setSections] = useState<Section[]>(initialData?.sections ?? [
    { id: 's1', name: 'Verse 1', type: 'verse', bars: 4, startBar: 0 },
  ])
  const [hits, setHits] = useState<Hit[]>(initialData?.hits ?? [])

  const [dragState, setDragState] = useState<DragState>({
    active: false, mode: null,
    startRow: null, startBar: null, startBeat: null,
    currentRow: null, currentBar: null, currentBeat: null,
    copiedHits: null,
  })

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [velocityEdit, setVelocityEdit] = useState<{ row: number; bar: number; beat: number } | null>(null)
  const [showVelocityMenu, setShowVelocityMenu] = useState(false)

  const gridRef = useRef<HTMLDivElement>(null)

  const beatsPerBar = getBeatsInBar(timeSignature)
  const totalBars = getTotalBars(sections)

  // Calculate total columns (bars * beatsPerBar)
  const totalCols = totalBars * beatsPerBar

  // Notify parent on changes
  const emitChange = useCallback((newHits: Hit[]) => {
    onChange?.({ bpm, timeSignature, sections, hits: newHits })
  }, [bpm, timeSignature, sections, onChange])

  // ── BPM Controls ──────────────────────────────────────

  const adjustBpm = (delta: number) => {
    const next = Math.max(40, Math.min(300, bpm + delta))
    setBpm(next)
    onChange?.({ bpm: next, timeSignature, sections, hits })
  }

  // ── Time Signature ─────────────────────────────────────

  const cycleTimeSignature = () => {
    const sigs: TimeSignature[] = ['4/4', '3/4', '6/8']
    const idx = sigs.indexOf(timeSignature)
    const next = sigs[(idx + 1) % sigs.length]
    setTimeSignature(next)
    onChange?.({ bpm, timeSignature: next, sections, hits })
  }

  // ── Section Management ────────────────────────────────

  const addSection = (type: SectionType) => {
    const lastBar = sections.length > 0 ? sections[sections.length - 1].startBar + sections[sections.length - 1].bars : 0
    const names: Record<SectionType, string> = {
      intro: 'Intro', verse: 'Verse', chorus: 'Chorus',
      bridge: 'Bridge', outro: 'Outro', custom: 'Section',
    }
    const id = `s${Date.now()}`
    const newSection: Section = { id, name: `${names[type]} ${sections.filter(s => s.type === type).length + 1}`, type, bars: 4, startBar: lastBar }
    const updated = [...sections, newSection]
    setSections(updated)
    onChange?.({ bpm, timeSignature, sections: updated, hits })
  }

  const removeSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id)
    setSections(updated)
    onChange?.({ bpm, timeSignature, sections: updated, hits })
  }

  const updateSectionBars = (id: string, bars: number) => {
    const updated = sections.map(s => s.id === id ? { ...s, bars: Math.max(1, Math.min(16, bars)) } : s)
    setSections(updated)
    onChange?.({ bpm, timeSignature, sections: updated, hits })
  }

  // ── Hit Actions ───────────────────────────────────────

  const toggleHit = (row: number, bar: number, beat: number) => {
    if (dragState.active && dragState.mode === 'paste' && dragState.copiedHits) {
      // Paste mode: place copied hits at this location
      const offsetRow = row - (dragState.startRow ?? 0)
      const offsetBar = bar - (dragState.startBar ?? 0)
      const offsetBeat = beat - (dragState.startBeat ?? 0)
      const newHits = dragState.copiedHits.map(h => ({
        ...h,
        row: h.row + offsetRow,
        bar: h.bar + offsetBar,
        beat: h.beat + offsetBeat,
      })).filter(h => h.row >= 0 && h.row < INSTRUMENTS.length)
      const merged = [...hits.filter(h => !newHits.some(n => n.row === h.row && n.bar === h.bar && n.beat === h.beat)), ...newHits]
      setHits(merged)
      emitChange(merged)
      return
    }

    // Normal toggle
    const existing = hitAt(hits, row, bar, beat)
    let newHits: Hit[]
    if (existing) {
      newHits = hits.filter(h => h !== existing)
    } else {
      newHits = [...hits, { row, bar, beat, velocity: 1.0 }]
    }
    setHits(newHits)
    emitChange(newHits)
  }

  const setHitVelocity = (row: number, bar: number, beat: number, velocity: number) => {
    const existing = hitAt(hits, row, bar, beat)
    if (!existing) return
    const newHits = hits.map(h => h === existing ? { ...h, velocity } : h)
    setHits(newHits)
    emitChange(newHits)
    setShowVelocityMenu(false)
    setVelocityEdit(null)
  }

  const clearRow = (row: number) => {
    const newHits = hits.filter(h => h.row !== row)
    setHits(newHits)
    emitChange(newHits)
  }

  // ── Drag Handling ─────────────────────────────────────

  const handleDragStart = (row: number, bar: number, beat: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const existing = hitAt(hits, row, bar, beat)

    if (existing) {
      // Start copy drag
      setDragState({
        active: true,
        mode: 'copy',
        startRow: row, startBar: bar, startBeat: beat,
        currentRow: row, currentBar: bar, currentBeat: beat,
        copiedHits: [existing],
      })
    } else {
      // Start clear drag (drag across empty cells to clear them)
      setDragState({
        active: true,
        mode: 'clear',
        startRow: row, startBar: bar, startBeat: beat,
        currentRow: row, currentBar: bar, currentBeat: beat,
        copiedHits: null,
      })
    }
  }

  const handleDragMove = (row: number, bar: number, beat: number) => {
    if (!dragState.active) return

    setDragState(prev => ({
      ...prev,
      currentRow: row, currentBar: bar, currentBeat: beat,
    }))

    // If moving over existing hits while in copy mode, add to selection
    if (dragState.mode === 'copy') {
      const existing = hitAt(hits, row, bar, beat)
      if (existing && !dragState.copiedHits?.some(h => h.row === row && h.bar === bar && h.beat === beat)) {
        setDragState(prev => ({
          ...prev,
          copiedHits: [...(prev.copiedHits || []), existing],
        }))
      }
    }

    // If in clear mode, clear hits as we drag
    if (dragState.mode === 'clear') {
      const newHits = hits.filter(h => !(h.row === row && h.bar === bar && h.beat === beat))
      if (newHits.length !== hits.length) {
        setHits(newHits)
      }
    }
  }

  const handleDragEnd = () => {
    if (dragState.active && dragState.mode === 'copy' && dragState.copiedHits && dragState.copiedHits.length > 0) {
      // Switch to paste mode - wait for next click
      setDragState({
        active: false,
        mode: 'paste',
        startRow: dragState.startRow,
        startBar: dragState.startBar,
        startBeat: dragState.startBeat,
        currentRow: null, currentBar: null, currentBeat: null,
        copiedHits: dragState.copiedHits,
      })
    } else {
      setDragState({ active: false, mode: null, startRow: null, startBar: null, startBeat: null, currentRow: null, currentBar: null, currentBeat: null, copiedHits: null })
    }
  }

  // ── Long Press for Velocity ────────────────────────────

  const handleLongPressStart = (row: number, bar: number, beat: number, e: React.MouseEvent) => {
    e.preventDefault()
    const timer = setTimeout(() => {
      const existing = hitAt(hits, row, bar, beat)
      if (existing) {
        setVelocityEdit({ row, bar, beat })
        setShowVelocityMenu(true)
      }
    }, 500)
    setLongPressTimer(timer as unknown as NodeJS.Timeout)
  }

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer as unknown as number)
      setLongPressTimer(null)
    }
  }

  // ── Compute grid columns for section headers ────────────

  const sectionSpans = useMemo(() => {
    return sections.map(section => {
      const colStart = section.startBar * beatsPerBar
      const colWidth = section.bars * beatsPerBar
      return { section, colStart, colWidth }
    })
  }, [sections, beatsPerBar])

  // ── Render ────────────────────────────────────────────

  return (
    <div className="drummer-grid">
      <style jsx>{`
        .drummer-grid {
          --cell-size: 36px;
          --label-width: 80px;
          display: flex;
          flex-direction: column;
          gap: 0;
          font-family: var(--font-mono);
          user-select: none;
          background: var(--lk-black);
          border: 1px solid var(--lk-subtle);
          border-radius: 12px;
          overflow: hidden;
        }

        /* ── TOP BAR ── */
        .grid-topbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--lk-deep);
          border-bottom: 1px solid var(--lk-subtle);
          flex-wrap: wrap;
        }

        .topbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .topbar-label {
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
        }

        .bpm-display {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .bpm-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--lk-teal);
          min-width: 48px;
          text-align: center;
        }

        .bpm-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--lk-subtle);
          background: var(--lk-void);
          color: var(--lk-white);
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-mono);
        }

        .bpm-btn:hover {
          border-color: var(--lk-teal);
          color: var(--lk-teal);
        }

        .bpm-btn:active {
          transform: scale(0.95);
        }

        .ts-btn {
          font-family: var(--font-mono);
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid var(--lk-subtle);
          background: var(--lk-void);
          color: var(--lk-pink);
          cursor: pointer;
          transition: all 0.15s;
        }

        .ts-btn:hover {
          border-color: var(--lk-pink);
        }

        /* ── SECTION HEADERS ── */
        .grid-section-headers {
          display: flex;
          background: var(--lk-void);
          border-bottom: 1px solid var(--lk-subtle);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .section-header-spacer {
          flex-shrink: 0;
        }

        .section-header-cell {
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          border-right: 1px solid var(--lk-subtle);
          position: relative;
        }

        .section-header-cell::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--section-color);
          opacity: 0.6;
        }

        .section-name {
          color: var(--section-color);
          font-weight: 600;
        }

        .section-bars-label {
          font-size: 9px;
          color: var(--lk-muted);
          margin-left: 4px;
        }

        .section-remove-btn {
          position: absolute;
          right: 2px;
          top: 2px;
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: none;
          background: transparent;
          color: var(--lk-muted);
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .section-header-cell:hover .section-remove-btn {
          opacity: 1;
        }

        .section-remove-btn:hover {
          background: var(--lk-pink);
          color: var(--lk-black);
        }

        /* ── BEAT NUMBER HEADER ── */
        .grid-beat-header {
          display: flex;
          background: var(--lk-void);
          border-bottom: 1px solid var(--lk-subtle);
        }

        .beat-header-cell {
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: var(--lk-muted);
          border-right: 1px solid var(--lk-subtle);
        }

        .beat-header-cell.downbeat {
          color: var(--lk-pink);
          font-weight: 700;
        }

        .bar-divider {
          border-right: 2px solid var(--lk-muted);
        }

        /* ── GRID BODY ── */
        .grid-body {
          overflow-x: auto;
          overflow-y: hidden;
        }

        .grid-rows {
          display: flex;
          flex-direction: column;
        }

        .grid-row {
          display: flex;
          align-items: stretch;
          border-bottom: 1px solid var(--lk-subtle);
          min-height: var(--cell-size);
        }

        .grid-row:last-child {
          border-bottom: none;
        }

        .grid-row:nth-child(even) {
          background: rgba(255, 255, 255, 0.01);
        }

        /* ── ROW LABEL ── */
        .row-label {
          flex-shrink: 0;
          width: var(--label-width);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          background: var(--lk-void);
          border-right: 1px solid var(--lk-subtle);
          position: sticky;
          left: 0;
          z-index: 5;
          min-height: var(--cell-size);
        }

        .row-label-text {
          font-family: var(--font-heading);
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--lk-muted);
          text-transform: uppercase;
        }

        .row-label:nth-child(1) .row-label-text { color: var(--lk-pink); }
        .row-label:nth-child(2) .row-label-text { color: var(--lk-teal); }

        .clear-row-btn {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: none;
          background: transparent;
          color: var(--lk-muted);
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .grid-row:hover .clear-row-btn {
          opacity: 1;
        }

        .clear-row-btn:hover {
          background: var(--lk-pink);
          color: var(--lk-black);
        }

        /* ── BEAT CELLS ── */
        .beat-cell {
          width: var(--cell-size);
          height: var(--cell-size);
          border-right: 1px solid var(--lk-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          transition: background 0.1s;
        }

        .beat-cell:hover {
          background: rgba(255, 45, 155, 0.1);
        }

        .beat-cell.downbeat {
          border-right-color: var(--lk-muted);
        }

        .beat-cell.bar-start {
          border-left: 2px solid var(--lk-muted);
        }

        .beat-cell.selected {
          background: rgba(0, 229, 204, 0.2);
        }

        /* ── HIT MARKER ── */
        .hit-marker {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: var(--lk-black);
          transition: transform 0.1s;
        }

        .hit-marker:active {
          transform: scale(0.9);
        }

        .hit-marker.normal {
          background: var(--lk-teal);
          box-shadow: 0 0 8px rgba(0, 229, 204, 0.4);
        }

        .hit-marker.accent {
          background: var(--lk-pink);
          box-shadow: 0 0 8px rgba(255, 45, 155, 0.4);
        }

        .hit-marker.soft {
          opacity: 0.5;
        }

        .hit-marker.medium {
          opacity: 0.75;
        }

        /* ── GRAPH PAPER LINES ── */
        .grid-col-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(102, 68, 170, 0.1);
          pointer-events: none;
        }

        /* ── VELOCITY MENU ── */
        .velocity-menu {
          position: fixed;
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 8px;
          padding: 8px;
          z-index: 1000;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .velocity-menu-title {
          font-family: var(--font-heading);
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
          margin-bottom: 4px;
        }

        .velocity-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
          background: var(--lk-deep);
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--lk-white);
        }

        .velocity-option:hover {
          border-color: var(--lk-teal);
        }

        .velocity-option.active {
          border-color: var(--lk-pink);
          background: rgba(255, 45, 155, 0.1);
        }

        .velocity-preview {
          width: 16px;
          height: 16px;
          border-radius: 3px;
        }

        /* ── COPY/PASTE INDICATOR ── */
        .paste-indicator {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--lk-teal);
          color: var(--lk-black);
          font-family: var(--font-heading);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 10px 20px;
          border-radius: 8px;
          z-index: 1000;
          box-shadow: 0 4px 16px rgba(0, 229, 204, 0.4);
        }

        .paste-indicator.copy {
          background: var(--lk-pink);
          box-shadow: 0 4px 16px rgba(255, 45, 155, 0.4);
        }

        /* ── ADD SECTION BUTTONS ── */
        .add-section-bar {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding: 8px 16px;
          background: var(--lk-void);
          border-top: 1px solid var(--lk-subtle);
        }

        .add-section-btn {
          font-family: var(--font-heading);
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 5px;
          border: 1px solid var(--section-color);
          background: transparent;
          color: var(--section-color);
          cursor: pointer;
          transition: all 0.15s;
          opacity: 0.7;
        }

        .add-section-btn:hover {
          opacity: 1;
          background: var(--section-color);
          color: var(--lk-black);
        }

        /* ── DRAG HINT ── */
        .drag-hint {
          font-size: 9px;
          color: var(--lk-muted);
          font-family: var(--font-mono);
        }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 640px) {
          .drummer-grid {
            --cell-size: 32px;
            --label-width: 64px;
          }
          .bpm-value { font-size: 16px; }
          .row-label-text { font-size: 8px; }
        }
      `}</style>

      {/* ── TOP BAR: BPM + TIME SIG ── */}
      <div className="grid-topbar">
        <div className="topbar-section">
          <span className="topbar-label">BPM</span>
          <div className="bpm-display">
            <button className="bpm-btn" onClick={() => adjustBpm(-5)}>−</button>
            <span className="bpm-value">{bpm}</span>
            <button className="bpm-btn" onClick={() => adjustBpm(5)}>+</button>
            <button className="bpm-btn" onClick={() => adjustBpm(-1)} style={{ fontSize: '11px' }}>−</button>
            <button className="bpm-btn" onClick={() => adjustBpm(1)} style={{ fontSize: '11px' }}>+</button>
          </div>
        </div>

        <div className="topbar-section">
          <span className="topbar-label">Time</span>
          <button className="ts-btn" onClick={cycleTimeSignature}>{timeSignature}</button>
        </div>

        <div className="topbar-section">
          <span className="drag-hint">Tap = toggle · Long-press = velocity · Drag = copy/clear</span>
        </div>

        {dragState.mode === 'paste' && dragState.copiedHits && (
          <div className="paste-indicator" onClick={() => setDragState({ active: false, mode: null, startRow: null, startBar: null, startBeat: null, currentRow: null, currentBar: null, currentBeat: null, copiedHits: null })}>
            Paste ({dragState.copiedHits.length} hits) — click to cancel
          </div>
        )}
      </div>

      {/* ── SECTION HEADERS ── */}
      <div className="grid-section-headers">
        <div className="section-header-spacer" style={{ width: 'var(--label-width)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {sectionSpans.map(({ section, colStart, colWidth }) => (
            <div
              key={section.id}
              className="section-header-cell"
              style={{
                width: `${colWidth * 36}px`,
                '--section-color': SECTION_COLORS[section.type],
              } as React.CSSProperties}
            >
              <span className="section-name">{section.name}</span>
              <span className="section-bars-label">{section.bars}b</span>
              <button
                className="section-remove-btn"
                onClick={() => removeSection(section.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── BEAT NUMBER HEADER ── */}
      <div className="grid-beat-header">
        <div style={{ width: 'var(--label-width)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flex: 1 }}>
          {Array.from({ length: totalBars }, (_, barIdx) => (
            <React.Fragment key={barIdx}>
              {Array.from({ length: beatsPerBar }, (_, beatIdx) => {
                const colIdx = barIdx * beatsPerBar + beatIdx
                return (
                  <div
                    key={colIdx}
                    className={`beat-header-cell ${beatIdx === 0 ? 'downbeat' : ''} ${beatIdx === beatsPerBar - 1 ? 'bar-divider' : ''}`}
                    style={{ width: 'var(--cell-size)' }}
                  >
                    {beatIdx === 0 ? barIdx + 1 : ''}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── GRID BODY ── */}
      <div className="grid-body" ref={gridRef}>
        <div className="grid-rows">
          {INSTRUMENTS.map(instr => (
            <div key={instr.row} className="grid-row">
              {/* Row label */}
              <div className="row-label" style={{ width: 'var(--label-width)' }}>
                <span className="row-label-text">{instr.short}</span>
                <button
                  className="clear-row-btn"
                  onClick={() => clearRow(instr.row)}
                  title="Clear row"
                >
                  ✕
                </button>
              </div>

              {/* Beat cells */}
              <div style={{ display: 'flex' }}>
                {Array.from({ length: totalBars }, (_, barIdx) => (
                  <React.Fragment key={barIdx}>
                    {Array.from({ length: beatsPerBar }, (_, beatIdx) => {
                      const colIdx = barIdx * beatsPerBar + beatIdx
                      const hit = hitAt(hits, instr.row, barIdx, beatIdx)
                      const isDownbeat = beatIdx === 0
                      const isBarStart = barIdx > 0 && beatIdx === 0
                      const isSelected = dragState.active &&
                        dragState.currentRow === instr.row &&
                        dragState.currentBar === barIdx &&
                        dragState.currentBeat === beatIdx

                      return (
                        <div
                          key={colIdx}
                          className={`beat-cell ${isDownbeat ? 'downbeat' : ''} ${isBarStart ? 'bar-start' : ''} ${isSelected ? 'selected' : ''}`}
                          style={{ width: 'var(--cell-size)' }}
                          onClick={() => toggleHit(instr.row, barIdx, beatIdx)}
                          onMouseDown={(e) => {
                            if (e.button === 2) return
                            handleDragStart(instr.row, barIdx, beatIdx, e)
                            handleLongPressStart(instr.row, barIdx, beatIdx, e)
                          }}
                          onMouseEnter={() => dragState.active && handleDragMove(instr.row, barIdx, beatIdx)}
                          onMouseUp={() => { handleDragEnd(); cancelLongPress() }}
                          onMouseLeave={() => { cancelLongPress() }}
                          onTouchStart={(e) => handleDragStart(instr.row, barIdx, beatIdx, e)}
                          onTouchMove={(e) => {
                            const touch = e.touches[0]
                            const el = document.elementFromPoint(touch.clientX, touch.clientY)
                            if (el) {
                              const row = parseInt(el.getAttribute('data-row') || '0')
                              const bar = parseInt(el.getAttribute('data-bar') || '0')
                              const beat = parseInt(el.getAttribute('data-beat') || '0')
                              handleDragMove(row, bar, beat)
                            }
                          }}
                          onTouchEnd={handleDragEnd}
                          data-row={instr.row}
                          data-bar={barIdx}
                          data-beat={beatIdx}
                        >
                          {/* Graph paper vertical lines */}
                          {beatIdx === 0 && barIdx > 0 && (
                            <div className="grid-col-line" style={{ left: 0 }} />
                          )}

                          {hit && (
                            <div
                              className={`hit-marker ${hit.velocity >= 0.9 ? 'accent' : 'normal'} ${hit.velocity < 0.6 ? 'soft' : hit.velocity < 0.9 ? 'medium' : ''}`}
                            >
                              {velocityLabel(hit.velocity)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ADD SECTION BUTTONS ── */}
      <div className="add-section-bar">
        {(['intro', 'verse', 'chorus', 'bridge', 'outro', 'custom'] as SectionType[]).map(type => (
          <button
            key={type}
            className="add-section-btn"
            style={{ '--section-color': SECTION_COLORS[type] } as React.CSSProperties}
            onClick={() => addSection(type)}
          >
            + {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* ── VELOCITY MENU ── */}
      {showVelocityMenu && velocityEdit && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => { setShowVelocityMenu(false); setVelocityEdit(null) }}
          />
          <div
            className="velocity-menu"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="velocity-menu-title">Velocity</div>
            {[
              { label: 'Hard', value: 1.0, color: 'var(--lk-pink)' },
              { label: 'Medium', value: 0.7, color: 'var(--lk-pink-dim)' },
              { label: 'Soft', value: 0.3, color: 'var(--lk-teal)' },
            ].map(opt => {
              const existing = hitAt(hits, velocityEdit.row, velocityEdit.bar, velocityEdit.beat)
              const isActive = existing?.velocity === opt.value
              return (
                <button
                  key={opt.label}
                  className={`velocity-option ${isActive ? 'active' : ''}`}
                  onClick={() => setHitVelocity(velocityEdit.row, velocityEdit.bar, velocityEdit.beat, opt.value)}
                >
                  <div className="velocity-preview" style={{ background: opt.color, opacity: opt.value }} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}