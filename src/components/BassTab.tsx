'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TimeSignature = '4/4' | '3/4' | '6/8'
export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'custom'

export interface FretHit {
  row: number       // 0=E, 1=A, 2=D, 3=G
  bar: number
  beat: number
  fret: number      // 0-24, 0 = open
}

export interface BassSection {
  id: string
  name: string
  type: SectionType
  bars: number
  startBar: number
}

export interface BassTabData {
  bpm: number
  timeSignature: TimeSignature
  sections: BassSection[]
  tabs: FretHit[]
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const BASS_STRINGS = [
  { note: 'G', row: 3 },
  { note: 'D', row: 2 },
  { note: 'A', row: 1 },
  { note: 'E', row: 0 },
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

const SECTION_NAMES: Record<SectionType, string> = {
  intro: 'Intro', verse: 'Verse', chorus: 'Chorus',
  bridge: 'Bridge', outro: 'Outro', custom: 'Section',
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getBeatsInBar(ts: TimeSignature): number {
  return TIME_SIGNATURE_BEATS[ts]
}

function getTotalBars(sections: BassSection[]): number {
  if (sections.length === 0) return 4
  return Math.max(...sections.map(s => s.startBar + s.bars))
}

function tabAt(tabs: FretHit[], row: number, bar: number, beat: number): FretHit | undefined {
  return tabs.find(t => t.row === row && t.bar === bar && t.beat === beat)
}

function makeId(): string {
  return `bt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─────────────────────────────────────────────────────────────
// FretPicker Modal
// ─────────────────────────────────────────────────────────────

interface FretPickerProps {
  currentFret: number
  onSelect: (fret: number) => void
  onClose: () => void
}

function FretPicker({ currentFret, onSelect, onClose }: FretPickerProps) {
  const [selected, setSelected] = useState(currentFret)

  const openStrings = [0, 5, 7, 12] // natural harmonic positions

  return (
    <div className="fret-picker-overlay" onClick={onClose}>
      <div className="fret-picker" onClick={e => e.stopPropagation()}>
        <div className="fp-header">
          <span className="fp-title">Fret</span>
          <span className="fp-value">{selected}</span>
        </div>
        <div className="fp-grid">
          {Array.from({ length: 25 }, (_, i) => i).map(fret => (
            <button
              key={fret}
              className={`fp-btn ${selected === fret ? 'active' : ''}`}
              onClick={() => setSelected(fret)}
            >
              {fret}
            </button>
          ))}
        </div>
        <div className="fp-harmonics">
          <span className="fp-hint-label">Natural harmonics</span>
          <div className="fp-harm-btns">
            {openStrings.map(f => (
              <button key={f} className="fp-harm-btn" onClick={() => setSelected(f)}>
                ✦ {f}
              </button>
            ))}
            <button className="fp-harm-btn fp-open" onClick={() => setSelected(0)}>
              ○ Open
            </button>
          </div>
        </div>
        <div className="fp-actions">
          <button className="fp-clear-btn" onClick={() => { onSelect(-1); onClose() }}>
            ✕ Clear
          </button>
          <button className="fp-done-btn" onClick={() => { onSelect(selected); onClose() }}>
            ✓ Done
          </button>
        </div>
      </div>

      <style jsx>{`
        .fret-picker-overlay {
          position: fixed; inset: 0;
          background: rgba(8,6,15,0.85);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .fret-picker {
          background: var(--lk-void);
          border: 1px solid var(--lk-pink);
          border-radius: 16px;
          padding: 20px;
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 0 40px rgba(255,45,155,0.2);
        }
        .fp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fp-title {
          font-family: var(--font-heading);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
        }
        .fp-value {
          font-family: var(--font-mono);
          font-size: 28px;
          font-weight: 700;
          color: var(--lk-gold);
        }
        .fp-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .fp-btn {
          height: 44px;
          border-radius: 8px;
          border: 1px solid var(--lk-subtle);
          background: var(--lk-deep);
          color: var(--lk-white);
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fp-btn:hover { border-color: var(--lk-pink); color: var(--lk-pink); }
        .fp-btn.active {
          background: var(--lk-pink);
          color: var(--lk-black);
          border-color: var(--lk-pink);
        }
        .fp-harmonics {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .fp-hint-label {
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--lk-muted);
        }
        .fp-harm-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .fp-harm-btn {
          font-family: var(--font-mono);
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid var(--lk-violet);
          background: transparent;
          color: var(--lk-violet);
          cursor: pointer;
          transition: all 0.15s;
        }
        .fp-harm-btn:hover { background: var(--lk-violet); color: var(--lk-black); }
        .fp-open { border-color: var(--lk-teal); color: var(--lk-teal); }
        .fp-open:hover { background: var(--lk-teal); color: var(--lk-black); }
        .fp-actions {
          display: flex;
          gap: 10px;
        }
        .fp-clear-btn, .fp-done-btn {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          font-family: var(--font-heading);
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fp-clear-btn {
          background: transparent;
          border: 1px solid var(--lk-muted);
          color: var(--lk-muted);
        }
        .fp-clear-btn:hover { border-color: #ff4444; color: #ff4444; }
        .fp-done-btn {
          background: var(--lk-pink);
          border: none;
          color: var(--lk-black);
        }
        .fp-done-btn:hover { background: var(--lk-pink-glow); }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// BassTab Component
// ─────────────────────────────────────────────────────────────

interface BassTabProps {
  initialData?: BassTabData
  onChange?: (data: BassTabData) => void
}

export default function BassTab({ initialData, onChange }: BassTabProps) {
  const [bpm, setBpm] = useState(initialData?.bpm ?? 120)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(initialData?.timeSignature ?? '4/4')
  const [sections, setSections] = useState<BassSection[]>(initialData?.sections ?? [
    { id: 's1', name: 'Verse 1', type: 'verse', bars: 4, startBar: 0 },
  ])
  const [tabs, setTabs] = useState<FretHit[]>(initialData?.tabs ?? [])

  const [fretPicker, setFretPicker] = useState<{ row: number; bar: number; beat: number } | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; bar: number; beat: number } | null>(null)
  const [copiedTabs, setCopiedTabs] = useState<FretHit[] | null>(null)
  const [dragMode, setDragMode] = useState<'copy' | 'paste' | 'clear' | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  const beatsPerBar = getBeatsInBar(timeSignature)
  const totalBars = getTotalBars(sections)
  const totalCols = totalBars * beatsPerBar

  // ── Emit changes ────────────────────────────────────────────

  const emit = useCallback((newTabs: FretHit[]) => {
    onChange?.({ bpm, timeSignature, sections, tabs: newTabs })
  }, [bpm, timeSignature, sections, onChange])

  // ── BPM Controls ────────────────────────────────────────────

  const adjustBpm = (delta: number) => {
    const next = Math.max(40, Math.min(300, bpm + delta))
    setBpm(next)
    emit(tabs)
  }

  // ── Time Signature ──────────────────────────────────────────

  const cycleTimeSignature = () => {
    const sigs: TimeSignature[] = ['4/4', '3/4', '6/8']
    const idx = sigs.indexOf(timeSignature)
    const next = sigs[(idx + 1) % sigs.length]
    setTimeSignature(next)
    emit(tabs)
  }

  // ── Section Management ──────────────────────────────────────

  const addSection = (type: SectionType) => {
    const lastBar = sections.length > 0
      ? sections[sections.length - 1].startBar + sections[sections.length - 1].bars
      : 0
    const count = sections.filter(s => s.type === type).length + 1
    const id = makeId()
    const newSection: BassSection = {
      id,
      name: `${SECTION_NAMES[type]} ${count}`,
      type,
      bars: 4,
      startBar: lastBar,
    }
    const updated = [...sections, newSection]
    setSections(updated)
    emit(tabs)
  }

  const removeSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id)
    setSections(updated)
    // Remove tabs in that section
    const removedSection = sections.find(s => s.id === id)
    let filtered = tabs
    if (removedSection) {
      const start = removedSection.startBar
      const end = start + removedSection.bars
      filtered = tabs.filter(t => t.bar < start || t.bar >= end)
    }
    setTabs(filtered)
    emit(filtered)
  }

  // ── Cell Interaction ───────────────────────────────────────

  const openFretPicker = (row: number, bar: number, beat: number) => {
    setFretPicker({ row, bar, beat })
    setSelectedCell({ row, bar, beat })
  }

  const handleFretSelect = (fret: number) => {
    if (!fretPicker) return
    const { row, bar, beat } = fretPicker
    const existing = tabAt(tabs, row, bar, beat)

    let newTabs: FretHit[]
    if (fret < 0) {
      // Clear
      newTabs = tabs.filter(t => t !== existing)
    } else if (existing) {
      newTabs = tabs.map(t => t === existing ? { ...t, fret } : t)
    } else {
      newTabs = [...tabs, { row, bar, beat, fret }]
    }

    setTabs(newTabs)
    emit(newTabs)
    setFretPicker(null)
  }

  const handleCellClick = (row: number, bar: number, beat: number, e: React.MouseEvent) => {
    e.preventDefault()

    if (dragMode === 'paste' && copiedTabs) {
      // Paste copied tabs
      const offsetRow = row - (selectedCell?.row ?? 0)
      const offsetBar = bar - (selectedCell?.bar ?? 0)
      const offsetBeat = beat - (selectedCell?.beat ?? 0)
      const newTabs = copiedTabs.map(t => ({
        ...t,
        row: t.row + offsetRow,
        bar: t.bar + offsetBar,
        beat: t.beat + offsetBeat,
      })).filter(t => t.row >= 0 && t.row < 4)
      const merged = [
        ...tabs.filter(t => !newTabs.some(n => n.row === t.row && n.bar === t.bar && n.beat === t.beat)),
        ...newTabs,
      ]
      setTabs(merged)
      emit(merged)
      setDragMode(null)
      setCopiedTabs(null)
      setSelectedCell(null)
      return
    }

    openFretPicker(row, bar, beat)
  }

  // ── Copy / Paste / Clear ───────────────────────────────────

  const copyTabs = (row: number, bar: number, beat: number) => {
    const existing = tabAt(tabs, row, bar, beat)
    if (!existing) return
    setCopiedTabs([existing])
    setDragMode('paste')
    setSelectedCell({ row, bar, beat })
  }

  const clearRow = (row: number) => {
    const newTabs = tabs.filter(t => t.row !== row)
    setTabs(newTabs)
    emit(newTabs)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell) return

    if (e.key === 'ArrowRight') {
      const nextBeat = selectedCell.beat + 1
      if (nextBeat < beatsPerBar) {
        setSelectedCell({ ...selectedCell, beat: nextBeat })
      } else {
        const nextBar = selectedCell.bar + 1
        if (nextBar < totalBars) {
          setSelectedCell({ ...selectedCell, bar: nextBar, beat: 0 })
        }
      }
    } else if (e.key === 'ArrowLeft') {
      if (selectedCell.beat > 0) {
        setSelectedCell({ ...selectedCell, beat: selectedCell.beat - 1 })
      } else if (selectedCell.bar > 0) {
        setSelectedCell({ ...selectedCell, bar: selectedCell.bar - 1, beat: beatsPerBar - 1 })
      }
    } else if (e.key === 'ArrowDown') {
      if (selectedCell.row < 3) {
        setSelectedCell({ ...selectedCell, row: selectedCell.row + 1 })
      }
    } else if (e.key === 'ArrowUp') {
      if (selectedCell.row > 0) {
        setSelectedCell({ ...selectedCell, row: selectedCell.row - 1 })
      }
    } else if (e.key === 'Enter') {
      openFretPicker(selectedCell.row, selectedCell.bar, selectedCell.beat)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      const existing = tabAt(tabs, selectedCell.row, selectedCell.bar, selectedCell.beat)
      if (existing) {
        const newTabs = tabs.filter(t => t !== existing)
        setTabs(newTabs)
        emit(newTabs)
      }
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      const existing = tabAt(tabs, selectedCell.row, selectedCell.bar, selectedCell.beat)
      if (existing) {
        setCopiedTabs([existing])
        setDragMode('paste')
      }
    }
  }, [selectedCell, beatsPerBar, totalBars, tabs, emit])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Section header spans ────────────────────────────────────

  const sectionSpans = useMemo(() => {
    return sections.map(section => ({
      section,
      colStart: section.startBar * beatsPerBar,
      colWidth: section.bars * beatsPerBar,
    }))
  }, [sections, beatsPerBar])

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="bass-tab">
      {/* Top Controls */}
      <div className="bt-topbar">
        <div className="bt-topbar-section">
          <span className="bt-label">BPM</span>
          <div className="bt-bpm-display">
            <button className="bt-bpm-btn" onClick={() => adjustBpm(-5)}>−</button>
            <span className="bt-bpm-value">{bpm}</span>
            <button className="bt-bpm-btn" onClick={() => adjustBpm(5)}>+</button>
          </div>
        </div>

        <div className="bt-topbar-section">
          <span className="bt-label">Time</span>
          <button className="bt-ts-btn" onClick={cycleTimeSignature}>{timeSignature}</button>
        </div>

        <div className="bt-topbar-section bt-section-btns">
          {(['intro', 'verse', 'chorus', 'bridge', 'outro'] as SectionType[]).map(type => (
            <button
              key={type}
              className="bt-add-section-btn"
              style={{ '--section-color': SECTION_COLORS[type] } as React.CSSProperties}
              onClick={() => addSection(type)}
            >
              + {SECTION_NAMES[type]}
            </button>
          ))}
        </div>

        {dragMode === 'paste' && (
          <button className="bt-cancel-paste-btn" onClick={() => { setDragMode(null); setCopiedTabs(null); setSelectedCell(null) }}>
            ✕ Cancel Paste
          </button>
        )}
      </div>

      {/* Section Headers Row */}
      <div className="bt-section-headers">
        <div className="bt-row-label-spacer" />
        <div className="bt-section-header-scroll">
          {sectionSpans.map(({ section, colStart, colWidth }) => (
            <div
              key={section.id}
              className="bt-section-header-cell"
              style={{
                '--section-color': SECTION_COLORS[section.type],
                left: colStart * 48,
                width: colWidth * 48,
              } as React.CSSProperties}
            >
              <span className="bt-section-name">{section.name}</span>
              <span className="bt-section-bars-label">{section.bars}b</span>
              <button
                className="bt-section-remove"
                onClick={() => removeSection(section.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="bt-grid-container" ref={gridRef}>
        <div className="bt-grid">

          {/* String Rows */}
          {BASS_STRINGS.map(string => (
            <div key={string.row} className="bt-string-row">
              <div className="bt-row-label">
                <span className="bt-string-note">{string.note}</span>
                <button
                  className="bt-clear-row-btn"
                  onClick={() => clearRow(string.row)}
                  title="Clear row"
                >
                  ⊗
                </button>
              </div>

              <div className="bt-row-scroll">
                <div className="bt-row-inner" style={{ width: totalCols * 48 }}>

                  {/* Bar dividers */}
                  {Array.from({ length: totalBars }, (_, i) => (
                    <div
                      key={i}
                      className="bt-bar-divider"
                      style={{ left: i * beatsPerBar * 48 }}
                    />
                  ))}

                  {/* Beat cells */}
                  {Array.from({ length: totalCols }, (_, i) => {
                    const bar = Math.floor(i / beatsPerBar)
                    const beat = i % beatsPerBar
                    const hit = tabAt(tabs, string.row, bar, beat)
                    const isSelected = selectedCell?.row === string.row &&
                                     selectedCell?.bar === bar &&
                                     selectedCell?.beat === beat

                    return (
                      <div
                        key={i}
                        className={`bt-cell ${isSelected ? 'selected' : ''} ${hit ? 'has-fret' : ''}`}
                        style={{ left: i * 48 }}
                        onClick={(e) => handleCellClick(string.row, bar, beat, e)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          if (hit) copyTabs(string.row, bar, beat)
                        }}
                      >
                        {hit && (
                          <span className="bt-fret-num">{hit.fret}</span>
                        )}
                        <div className="bt-cell-dot" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Beat numbering row */}
          <div className="bt-beat-numbers">
            <div className="bt-row-label-spacer" />
            <div className="bt-row-scroll">
              <div className="bt-row-inner" style={{ width: totalCols * 48 }}>
                {Array.from({ length: totalCols }, (_, i) => {
                  const beat = i % beatsPerBar
                  return (
                    <div key={i} className="bt-beat-num" style={{ left: i * 48 }}>
                      {beat + 1}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mode indicator */}
      <div className="bt-status-bar">
        {dragMode === 'paste' && copiedTabs && (
          <span className="bt-paste-indicator">
            🎵 Paste mode — click to place {copiedTabs.length} note{copiedTabs.length > 1 ? 's' : ''}
          </span>
        )}
        <span className="bt-hint">Tap cell to add/edit fret • Right-click to copy • Arrow keys to navigate • Enter to edit • Del to clear</span>
      </div>

      {/* Fret Picker Modal */}
      {fretPicker && (
        <FretPicker
          currentFret={tabAt(tabs, fretPicker.row, fretPicker.bar, fretPicker.beat)?.fret ?? 0}
          onSelect={handleFretSelect}
          onClose={() => { setFretPicker(null) }}
        />
      )}

      <style jsx>{`
        .bass-tab {
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
        .bt-topbar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: var(--lk-deep);
          border-bottom: 1px solid var(--lk-subtle);
          flex-wrap: wrap;
        }

        .bt-topbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bt-label {
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
        }

        .bt-bpm-display {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .bt-bpm-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--lk-teal);
          min-width: 48px;
          text-align: center;
        }

        .bt-bpm-btn {
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
        .bt-bpm-btn:hover { border-color: var(--lk-teal); color: var(--lk-teal); }
        .bt-bpm-btn:active { transform: scale(0.95); }

        .bt-ts-btn {
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
        .bt-ts-btn:hover { border-color: var(--lk-pink); }

        .bt-section-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .bt-add-section-btn {
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid var(--section-color);
          background: transparent;
          color: var(--section-color);
          cursor: pointer;
          transition: all 0.15s;
        }
        .bt-add-section-btn:hover {
          background: var(--section-color);
          color: var(--lk-black);
        }

        .bt-cancel-paste-btn {
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 6px;
          border: 1px solid #ff4444;
          background: transparent;
          color: #ff4444;
          cursor: pointer;
          transition: all 0.15s;
        }
        .bt-cancel-paste-btn:hover { background: #ff4444; color: var(--lk-black); }

        /* ── SECTION HEADERS ── */
        .bt-section-headers {
          display: flex;
          background: var(--lk-void);
          border-bottom: 1px solid var(--lk-subtle);
          position: sticky;
          top: 0;
          z-index: 10;
          height: 32px;
        }

        .bt-row-label-spacer {
          width: 56px;
          flex-shrink: 0;
          border-right: 1px solid var(--lk-subtle);
        }

        .bt-section-header-scroll {
          position: relative;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          flex: 1;
        }

        .bt-section-header-cell {
          position: absolute;
          top: 0;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border-right: 1px solid var(--lk-subtle);
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .bt-section-header-cell::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--section-color);
          opacity: 0.7;
        }

        .bt-section-name {
          color: var(--section-color);
          font-weight: 600;
        }

        .bt-section-bars-label {
          font-size: 9px;
          color: var(--lk-muted);
        }

        .bt-section-remove {
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
        .bt-section-header-cell:hover .bt-section-remove { opacity: 1; }
        .bt-section-remove:hover { background: #ff4444; color: white; }

        /* ── GRID ── */
        .bt-grid-container {
          overflow-x: auto;
          overflow-y: hidden;
        }

        .bt-grid {
          display: flex;
          flex-direction: column;
          min-width: max-content;
        }

        .bt-string-row {
          display: flex;
          height: 48px;
          border-bottom: 1px solid var(--lk-subtle);
          background: var(--lk-black);
          position: relative;
        }

        /* Graph paper horizontal lines */
        .bt-string-row::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(123,47,190,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(123,47,190,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .bt-row-label {
          width: 56px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          background: var(--lk-void);
          border-right: 1px solid var(--lk-subtle);
          position: relative;
          z-index: 5;
        }

        .bt-string-note {
          font-size: 16px;
          font-weight: 700;
          color: var(--lk-gold);
          letter-spacing: 1px;
        }

        .bt-clear-row-btn {
          font-size: 10px;
          border: none;
          background: transparent;
          color: var(--lk-muted);
          cursor: pointer;
          opacity: 0;
          transition: all 0.15s;
          line-height: 1;
        }
        .bt-string-row:hover .bt-clear-row-btn { opacity: 1; }
        .bt-clear-row-btn:hover { color: #ff4444; }

        .bt-row-scroll {
          flex: 1;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .bt-row-inner {
          position: relative;
          height: 100%;
        }

        .bt-bar-divider {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255,45,155,0.2);
          z-index: 2;
        }

        .bt-cell {
          position: absolute;
          top: 4px;
          width: 48px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.1s;
        }

        .bt-cell:hover {
          background: rgba(255,45,155,0.1);
        }

        .bt-cell.selected {
          outline: 2px solid var(--lk-pink);
          outline-offset: -1px;
          background: rgba(255,45,155,0.15);
        }

        .bt-cell.has-fret {
          background: rgba(0,229,204,0.1);
        }

        .bt-cell-dot {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--lk-subtle);
        }

        .bt-fret-num {
          font-size: 18px;
          font-weight: 700;
          color: var(--lk-gold);
          z-index: 1;
          text-shadow: 0 0 10px rgba(240,192,64,0.5);
        }

        /* Beat numbers row */
        .bt-beat-numbers {
          display: flex;
          height: 24px;
          border-top: 1px solid var(--lk-subtle);
        }

        .bt-beat-num {
          position: absolute;
          bottom: 4px;
          font-size: 9px;
          color: var(--lk-muted);
          text-align: center;
          width: 48px;
        }

        /* Status bar */
        .bt-status-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: var(--lk-deep);
          border-top: 1px solid var(--lk-subtle);
          font-family: var(--font-mono);
          font-size: 10px;
        }

        .bt-paste-indicator {
          color: var(--lk-teal);
          font-weight: 600;
        }

        .bt-hint {
          color: var(--lk-muted);
        }
      `}</style>
    </div>
  )
}