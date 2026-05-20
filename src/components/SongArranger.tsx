'use client'

import React, { useState, useMemo, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SongArrangerProps {
  /** Full ChordPro content including metadata and sections */
  content: string
  onChordClick?: (chord: string) => void
}

interface ParsedSection {
  type: 'section' | 'chords' | 'lyrics' | 'blank' | 'comment' | 'meta'
  content: string
  sectionType?: string // intro | verse | chorus | bridge | outro | solo
  metaKey?: string
  metaValue?: string
}

interface SectionBlock {
  type: string
  lines: ParsedSection[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_COLORS: Record<string, string> = {
  intro:   'var(--lk-violet)',
  verse:   'var(--lk-pink)',
  chorus:  'var(--lk-teal)',
  bridge:  'var(--lk-gold)',
  outro:   'var(--lk-pink-glow)',
  solo:    'var(--lk-violet-mid)',
  prechorus: 'var(--lk-muted)',
  tag:     'var(--lk-muted)',
}

const SECTION_LABELS: Record<string, string> = {
  intro:   'INTRO',
  verse:   'VERSE',
  chorus:  'CHORUS',
  bridge:  'BRIDGE',
  outro:   'OUTRO',
  solo:    'SOLO',
  prechorus: 'PRE-CHORUS',
  tag:     'TAG',
}

// ── Parser ─────────────────────────────────────────────────────────────────────

function parseChordPro(content: string): { meta: Record<string, string>, blocks: SectionBlock[] } {
  const lines = content.split('\n')
  const meta: Record<string, string> = {}
  const blocks: SectionBlock[] = []
  let currentBlock: SectionBlock | null = null

  for (const raw of lines) {
    const line = raw.trimEnd()

    // Metadata: {key: value}
    const metaMatch = line.match(/^\{(\w+):\s*(.+)\}\}$/)
    if (metaMatch) {
      meta[metaMatch[1].toLowerCase()] = metaMatch[2].trim()
      continue
    }

    // Comment: # ...
    if (line.startsWith('#')) {
      if (currentBlock) {
        currentBlock.lines.push({ type: 'comment', content: line.slice(1).trim() })
      } else {
        blocks.push({ type: 'comment', lines: [{ type: 'comment', content: line.slice(1).trim() }] })
      }
      continue
    }

    // Section marker: [sectionname]
    const sectionMatch = line.match(/^\[(\w+)\](?:\s*(.*))?$/)
    if (sectionMatch) {
      if (currentBlock) blocks.push(currentBlock)
      const sectionType = sectionMatch[1].toLowerCase()
      currentBlock = {
        type: sectionType,
        lines: [{
          type: 'section',
          content: sectionMatch[2] || sectionType,
          sectionType,
        }],
      }
      continue
    }

    // Chord line
    if (isChordLine(line)) {
      if (currentBlock) {
        currentBlock.lines.push({ type: 'chords', content: line })
      } else {
        // Orphan chord line — wrap in verse
        currentBlock = { type: 'verse', lines: [] }
        currentBlock.lines.push({ type: 'chords', content: line })
      }
      continue
    }

    // Lyrics line
    if (line.trim()) {
      if (currentBlock) {
        currentBlock.lines.push({ type: 'lyrics', content: line })
      } else {
        currentBlock = { type: 'verse', lines: [] }
        currentBlock.lines.push({ type: 'lyrics', content: line })
      }
      continue
    }

    // Blank line
    if (currentBlock) {
      currentBlock.lines.push({ type: 'blank', content: '' })
    }
  }

  if (currentBlock) blocks.push(currentBlock)
  return { meta, blocks }
}

function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/)
  if (tokens.length === 0) return false
  // A line is a chord line if all tokens look like chords
  const chordPattern = /^([A-G][#b]?)(m|maj|min|dim|aug|sus|add|7|9|11|13|M)*[A-Gb#]?$/
  return tokens.every(t => chordPattern.test(t))
}

// ── ChordChip component ───────────────────────────────────────────────────────

interface ChordChipProps {
  chord: string
  onClick?: (chord: string) => void
}

function ChordChip({ chord, onClick }: ChordChipProps) {
  return (
    <span
      className="song-arranger-chip"
      onClick={() => onClick?.(chord)}
      title={`${chord} — click to see fingering`}
    >
      {chord}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SongArranger({ content, onChordClick }: SongArrangerProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Auto-inject styles once on mount
  useEffect(() => {
    injectSongArrangerStyles()
  }, [])

  const { meta, blocks } = useMemo(() => parseChordPro(content), [content])

  const toggleSection = (idx: number) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(String(idx))) next.delete(String(idx))
      else next.add(String(idx))
      return next
    })
  }

  const title    = meta.title   || ''
  const artist   = meta.artist  || ''
  const key      = meta.key     || ''
  const bpm      = meta.bpm     || ''
  const timeSig  = meta.t       || ''

  return (
    <div className="song-arranger">
      {/* ── Song Header ── */}
      {(title || artist || key || bpm) && (
        <div className="sa-header">
          {title && <h1 className="sa-title">{title}</h1>}
          {artist && <p className="sa-artist">{artist}</p>}
          <div className="sa-meta-row">
            {key && (
              <span className="sa-meta-badge">
                <span className="sa-meta-label">Key</span>
                <span className="sa-meta-value">{key}</span>
              </span>
            )}
            {bpm && (
              <span className="sa-meta-badge">
                <span className="sa-meta-label">BPM</span>
                <span className="sa-meta-value">{bpm}</span>
              </span>
            )}
            {timeSig && (
              <span className="sa-meta-badge">
                <span className="sa-meta-label">Time</span>
                <span className="sa-meta-value">{timeSig}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Section Blocks ── */}
      <div className="sa-blocks">
        {blocks.map((block, blockIdx) => {
          const isCommentOnly = block.type === 'comment'
          const color = SECTION_COLORS[block.type] || 'var(--lk-muted)'
          const label = SECTION_LABELS[block.type] || block.type.toUpperCase()
          const isCollapsed = collapsed.has(String(blockIdx))

          if (isCommentOnly) {
            return (
              <div key={blockIdx} className="sa-block sa-block--comment">
                {block.lines.map((line, lineIdx) => (
                  <span key={lineIdx} className="sa-comment">{line.content}</span>
                ))}
              </div>
            )
          }

          return (
            <div
              key={blockIdx}
              className={`sa-block sa-block--${block.type}`}
              style={{ '--section-color': color } as React.CSSProperties}
            >
              {/* Section Header (clickable) */}
              <button
                className="sa-section-header"
                onClick={() => toggleSection(blockIdx)}
                style={{ color }}
              >
                <span className="sa-section-label" style={{ color }}>{label}</span>
                {block.lines[0]?.content && block.lines[0].content !== block.type && (
                  <span className="sa-section-name">{block.lines[0].content}</span>
                )}
                <span className={`sa-collapse-icon ${isCollapsed ? 'sa-collapse-icon--collapsed' : ''}`}>
                  {isCollapsed ? '▼' : '▲'}
                </span>
              </button>

              {/* Section Content (collapsible) */}
              {!isCollapsed && (
                <div className="sa-section-content">
                  <SectionLines lines={block.lines.slice(1)} onChordClick={onChordClick} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Render Line ────────────────────────────────────────────────────────────────

function RenderLine({ line, onChordClick }: { line: ParsedSection; onChordClick?: (c: string) => void }) {
  if (line.type === 'blank') {
    return <div className="sa-blank-line" />
  }

  if (line.type === 'comment') {
    return <div className="sa-comment-line">{line.content}</div>
  }

  if (line.type === 'chords') {
    const chords = line.content.split(/\s+/).filter(Boolean)
    return (
      <div className="sa-chord-line">
        {chords.map((chord, idx) => (
          <ChordChip key={idx} chord={chord} onClick={onChordClick} />
        ))}
      </div>
    )
  }

  if (line.type === 'lyrics') {
    return (
      <div className="sa-lyrics-line">
        <span>{line.content}</span>
      </div>
    )
  }

  return null
}

// ── Section Lines ──────────────────────────────────────────────────────────────
// Renders lines with chord-lyric pairing (chord line followed by its lyric line)

function SectionLines({ lines, onChordClick }: { lines: ParsedSection[]; onChordClick?: (c: string) => void }) {
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // If we have a chord line followed by a lyrics line, render as a pair
    if (line.type === 'chords' && i + 1 < lines.length && lines[i + 1].type === 'lyrics') {
      elements.push(
        <ChordLyricPair
          key={`pair-${i}`}
          chordLine={line.content}
          lyricLine={lines[i + 1].content}
          onChordClick={onChordClick}
        />
      )
      i += 2
      continue
    }

    // Otherwise render individually
    elements.push(<RenderLine key={`line-${i}`} line={line} onChordClick={onChordClick} />)
    i++
  }

  return <>{elements}</>
}

// ── Chord-Lyric Pair Component ─────────────────────────────────────────────────
// Renders a chord line followed immediately by its lyric line with alignment

interface ChordLyricPairProps {
  chordLine: string
  lyricLine: string
  onChordClick?: (chord: string) => void
}

export function ChordLyricPair({ chordLine, lyricLine, onChordClick }: ChordLyricPairProps) {
  const chords = chordLine.trim().split(/\s+/).filter(Boolean)
  const words  = lyricLine.trim().split(/(\s+)/) // keep whitespace tokens

  // Simple equal-division placement: spread chords across the lyric line
  // For better accuracy, map chords to syllable positions
  const chordPositions = distributeChordsOverWords(chords, words)

  return (
    <div className="sa-chord-lyric-pair">
      {/* Chord row */}
      <div className="sa-chord-row">
        {chordPositions.map((pos, idx) => (
          <span
            key={idx}
            className="sa-chord-placed"
            style={{ '--col-start': pos.col, '--col-span': pos.span } as React.CSSProperties}
          >
            <ChordChip chord={pos.chord} onClick={onChordClick} />
          </span>
        ))}
      </div>
      {/* Lyric row */}
      <div className="sa-lyric-row">
        {words.map((word, idx) => (
          <span key={idx} className="sa-lyric-word">{word}</span>
        ))}
      </div>
    </div>
  )
}

interface ChordPosition {
  chord: string
  col: number  // grid column start (1-indexed)
  span: number
}

function distributeChordsOverWords(chords: string[], words: string[]): ChordPosition[] {
  const wordCount = words.filter(w => w.trim()).length
  if (chords.length === 0 || wordCount === 0) return []

  // Distribute chords as evenly as possible across words
  const positions: ChordPosition[] = []
  const step = wordCount / chords.length

  chords.forEach((chord, idx) => {
    const startWord = Math.floor(idx * step)
    const endWord   = Math.floor((idx + 1) * step)
    const col = startWord + 1
    const span = Math.max(1, endWord - startWord)
    positions.push({ chord, col, span })
  })

  return positions
}

// ── Styles ─────────────────────────────────────────────────────────────────────

/*
  Styles injected via a <style> tag since we can't rely on CSS modules here.
  Mirrors globals.css design language: dark glam, neon accents, premium card look.
*/

const STYLES = `
.song-arranger {
  --sa-chip-bg:    var(--lk-deep);
  --sa-chip-border: var(--lk-teal);
  --sa-chip-color:  var(--lk-teal);
  --sa-chip-hover-bg: var(--lk-teal);
  --sa-chip-hover-color: var(--lk-black);

  font-family: var(--font-body);
  color: var(--lk-white);
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* ── Header ── */
.sa-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--lk-subtle);
}

.sa-title {
  font-family: var(--font-display);
  font-size: 48px;
  letter-spacing: 3px;
  color: var(--lk-white);
  margin: 0 0 4px;
  line-height: 1;
}

.sa-artist {
  font-family: var(--font-heading);
  font-size: 14px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--lk-muted);
  margin: 0 0 16px;
}

.sa-meta-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.sa-meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--lk-deep);
  border: 1px solid var(--lk-subtle);
  border-radius: 20px;
}

.sa-meta-label {
  font-family: var(--font-heading);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--lk-muted);
}

.sa-meta-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--lk-teal);
}

/* ── Blocks ── */
.sa-blocks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sa-block {
  background: var(--lk-void);
  border: 1px solid var(--lk-subtle);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.sa-block:hover {
  border-color: var(--section-color, var(--lk-subtle));
}

.sa-block--comment {
  background: transparent;
  border: none;
  border-radius: 0;
}

/* ── Section Header ── */
.sa-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}

.sa-block:not(.sa-block--comment):hover .sa-section-header {
  background: rgba(255,255,255,0.03);
}

.sa-section-header:hover {
  border-bottom-color: var(--section-color, var(--lk-subtle));
}

.sa-section-label {
  font-family: var(--font-heading);
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.7;
}

.sa-section-name {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--lk-white);
  opacity: 0.6;
  font-style: italic;
}

.sa-collapse-icon {
  margin-left: auto;
  font-size: 10px;
  opacity: 0.5;
  transition: transform 0.2s;
}

.sa-collapse-icon--collapsed {
  transform: rotate(-90deg);
}

/* ── Section Content ── */
.sa-section-content {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Chord Line ── */
.sa-chord-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 0 2px;
  min-height: 32px;
  align-items: center;
}

/* ── Chord Lyric Pair ── */
.sa-chord-lyric-pair {
  display: flex;
  flex-direction: column;
}

.sa-chord-row {
  display: flex;
  gap: 0;
  padding: 0 0 2px;
  min-height: 28px;
  align-items: flex-end;
  position: relative;
}

.sa-chord-placed {
  display: inline-flex;
  align-items: flex-end;
  padding: 0 2px;
}

.sa-lyric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding: 2px 0;
  font-size: 16px;
  line-height: 1.8;
}

.sa-lyric-word {
  padding: 0 4px;
  white-space: pre-wrap;
}

/* ── Chord Chip ── */
.song-arranger-chip {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  background: var(--sa-chip-bg);
  border: 1px solid var(--sa-chip-border);
  border-radius: 4px;
  color: var(--sa-chip-color);
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.song-arranger-chip:hover {
  background: var(--sa-chip-hover-bg);
  color: var(--sa-chip-hover-color);
  border-color: var(--sa-chip-hover-bg);
}

/* ── Lyrics Line ── */
.sa-lyrics-line {
  font-size: 15px;
  color: var(--lk-white);
  padding: 3px 0;
  line-height: 1.7;
  opacity: 0.9;
}

/* ── Blank & Comment ── */
.sa-blank-line {
  height: 16px;
}

.sa-comment-line {
  font-size: 12px;
  color: var(--lk-muted);
  font-style: italic;
  padding: 4px 0;
}

.sa-comment {
  font-size: 12px;
  color: var(--lk-muted);
  font-style: italic;
}

/* ── Section-specific accent lines ── */
.sa-block--verse .sa-section-header { border-left: 3px solid var(--lk-pink); }
.sa-block--chorus .sa-section-header { border-left: 3px solid var(--lk-teal); }
.sa-block--bridge .sa-section-header { border-left: 3px solid var(--lk-gold); }
.sa-block--intro .sa-section-header { border-left: 3px solid var(--lk-violet); }
.sa-block--outro .sa-section-header { border-left: 3px solid var(--lk-pink-glow); }
.sa-block--solo .sa-section-header { border-left: 3px solid var(--lk-violet-mid); }
.sa-block--prechorus .sa-section-header { border-left: 3px solid var(--lk-muted); }
.sa-block--tag .sa-section-header { border-left: 3px solid var(--lk-muted); }

/* ── Print Styles ── */
@media print {
  .song-arranger {
    background: white;
    color: black;
    max-width: 100%;
    padding: 0;
  }
  .sa-block {
    border: 1px solid #ccc;
    break-inside: avoid;
  }
  .sa-section-header {
    background: #f5f5f5 !important;
  }
  .song-arranger-chip {
    background: #f0f0f0;
    border-color: #999;
    color: black;
  }
  .sa-chord-row {
    min-height: 20px;
  }
  .sa-lyric-row {
    font-size: 14px;
  }
  .sa-collapse-icon {
    display: none;
  }
  .sa-header {
    border-bottom-color: #ccc;
  }
}
`

export function injectSongArrangerStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('song-arranger-styles')) return
  const style = document.createElement('style')
  style.id = 'song-arranger-styles'
  style.textContent = STYLES
  document.head.appendChild(style)
}