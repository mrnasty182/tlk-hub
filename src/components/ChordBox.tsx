'use client'

import React from 'react'
import { getChord, CHORD_LIBRARY, type ChordShape } from '@/lib/chords'

interface ChordBoxProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  fallback?: 'show-name' | 'placeholder'
}

/**
 * Renders a chord diagram as SVG.
 * Falls back to text-only chord name if shape is not in the library.
 */
export default function ChordBox({ name, size = 'md', showName = true, fallback = 'show-name' }: ChordBoxProps) {
  const shape = getChord(name)

  if (!shape) {
    if (fallback === 'placeholder') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 8px',
          background: '#1E1830',
          border: '1px dashed #6B6180',
          borderRadius: 6,
          color: '#6B6180',
          fontFamily: 'Oswald, sans-serif',
          fontSize: 11,
          letterSpacing: 1,
          minWidth: 60,
          minHeight: 60,
        }}>
          ?
        </span>
      )
    }
    // Just show the name as a chip
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        background: 'rgba(255, 45, 155, 0.12)',
        color: '#FF2D9B',
        borderRadius: 4,
        fontFamily: 'Oswald, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 0.5,
      }}>
        {name}
      </span>
    )
  }

  // Dimensions per size
  const dims = {
    sm: { w: 60, h: 75, fretH: 12, fretW: 50, dotR: 3, nameFs: 11, fretFs: 9, stringFs: 8, nut: 2 },
    md: { w: 90, h: 110, fretH: 18, fretW: 75, dotR: 4.5, nameFs: 14, fretFs: 10, stringFs: 9, nut: 3 },
    lg: { w: 130, h: 160, fretH: 26, fretW: 110, dotR: 6.5, nameFs: 18, fretFs: 12, stringFs: 11, nut: 4 },
  }[size]

  const margin = { top: dims.nameFs + 4, right: 6, bottom: dims.fretFs + 4, left: dims.fretFs + 6 }
  const innerH = dims.h - margin.top - margin.bottom
  const innerW = dims.w - margin.left - margin.right
  const fretSpacing = innerH / 4   // 4 frets shown
  const stringSpacing = innerW / 5  // 6 strings (5 gaps)

  // Strings: 1 = high E (rightmost), 6 = low E (leftmost)
  const strings = shape.fingerings ?? [0, 0, 0, 0, 0, 0]  // fallback for type narrowing
  const baseFret = shape.baseFret
  const showNut = baseFret === 1
  const fretOffset = baseFret - 1  // if baseFret=3, top of diagram is fret 3, so visually shift

  // Calculate the max fret used
  const maxFret = strings.reduce((max, f) => f !== null && f > max ? f : max, 0)

  return (
    <span style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      margin: '0 4px',
      verticalAlign: 'top',
    }}>
      {showName && (
        <span style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: dims.nameFs,
          fontWeight: 600,
          color: '#FF2D9B',
          letterSpacing: 0.5,
          lineHeight: 1,
        }}>
          {shape.name}
        </span>
      )}
      <svg width={dims.w} height={dims.h - dims.nameFs - 4} viewBox={`0 0 ${dims.w} ${dims.h - dims.nameFs - 4}`} style={{ display: 'block' }}>
        {/* Fret lines (horizontal) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={margin.left}
            y1={margin.top + i * fretSpacing}
            x2={margin.left + innerW}
            y2={margin.top + i * fretSpacing}
            stroke="#6B6180"
            strokeWidth={1}
          />
        ))}
        {/* String lines (vertical) */}
        {Array.from({ length: 6 }).map((_, i) => {
          const x = margin.left + i * stringSpacing
          return (
            <line
              key={`string-${i}`}
              x1={x}
              y1={margin.top}
              x2={x}
              y2={margin.top + 4 * fretSpacing}
              stroke="#6B6180"
              strokeWidth={i < 3 ? 0.8 : 1} // bass strings thicker visually (left = low E)
            />
          )
        })}
        {/* Nut (top thick line for open chords) */}
        {showNut && (
          <rect
            x={margin.left - 1}
            y={margin.top - dims.nut}
            width={innerW + 2}
            height={dims.nut}
            fill="#F0EBF8"
          />
        )}
        {/* Base fret label (if not 1) */}
        {!showNut && (
          <text
            x={margin.left - dims.fretFs - 2}
            y={margin.top + fretSpacing / 2 + 3}
            fontSize={dims.fretFs}
            fill="#9080A8"
            fontFamily="Space Mono, monospace"
            textAnchor="end"
          >
            {baseFret}
          </text>
        )}
        {/* Barres */}
        {shape.barres?.map((barre, i) => {
          const y = margin.top + (barre.fret - baseFret + 0.5) * fretSpacing
          const fromX = margin.left + (6 - barre.fromString) * stringSpacing
          const toX = margin.left + (6 - barre.toString) * stringSpacing
          return (
            <rect
              key={`barre-${i}`}
              x={Math.min(fromX, toX) - dims.dotR}
              y={y - dims.dotR}
              width={Math.abs(toX - fromX) + dims.dotR * 2}
              height={dims.dotR * 2}
              rx={dims.dotR}
              fill="#FF2D9B"
            />
          )
        })}
        {/* Finger dots */}
        {strings.map((fret, i) => {
          if (fret === null) return null
          const stringIdx = 6 - i // string 1 (high E) is rightmost
          const x = margin.left + (stringIdx - 1) * stringSpacing
          if (fret === -1) {
            // Muted (x)
            return (
              <text
                key={`mute-${i}`}
                x={x}
                y={margin.top - 4}
                fontSize={dims.stringFs + 2}
                fill="#6B6180"
                fontFamily="Oswald, sans-serif"
                textAnchor="middle"
              >
                ×
              </text>
            )
          }
          if (fret === 0) {
            // Open (o)
            return (
              <text
                key={`open-${i}`}
                x={x}
                y={margin.top - 4}
                fontSize={dims.stringFs + 2}
                fill="#F0EBF8"
                fontFamily="Oswald, sans-serif"
                textAnchor="middle"
              >
                ○
              </text>
            )
          }
          // Pressed: place dot between frets (fret - baseFret + 0.5)
          const y = margin.top + (fret - baseFret + 0.5) * fretSpacing
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={dims.dotR}
              fill="#FF2D9B"
            />
          )
        })}
      </svg>
    </span>
  )
}

/**
 * Renders a ChordPro string with chord diagrams inline.
 * e.g. "[Am]We don't [C]stop" → chord boxes + lyric text
 */
export function ChordProLine({ text, boxSize = 'sm' }: { text: string; boxSize?: 'sm' | 'md' | 'lg' }) {
  // Match [chord] tokens
  const parts: Array<{ type: 'text' | 'chord'; value: string }> = []
  const regex = /\[([^\]]+)\]/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'chord', value: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return (
    <span style={{ display: 'inline', whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) => {
        if (part.type === 'text') return <span key={i}>{part.value}</span>
        return <ChordBox key={i} name={part.value} size={boxSize} fallback="show-name" />
      })}
    </span>
  )
}
