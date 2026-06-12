'use client'

import React from 'react'
import type { SongSection } from '@/lib/types'

interface ChordSheetDisplayProps {
  section: SongSection
  highlightLine?: number
}

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
  Intro: '#7B2FBE',
  Verse: '#00E5CC',
  'Pre-Chorus': '#FF2D9B',
  Chorus: '#F0C040',
  Hook: '#FF6B35',
  'Post-Chorus': '#FF6D00',
  Bridge: '#9D4EDD',
  Breakdown: '#E040FB',
  'Musical Break': '#00BCD4',
  Instrumental: '#78909C',
  Tag: '#78909C',
  Solo: '#FF8A65',
  Outro: '#06D6A0',
}

function parseChordBar(chordPro: string): string[] {
  // Parse chordPro format: "| Am . . . | D . . . | C . . . | Am . . . |"
  // Extract just the chord names (first word after |)
  const parts = chordPro.split('|').filter(p => p.trim())
  return parts.map(p => {
    const trimmed = p.trim()
    const firstSpace = trimmed.indexOf(' ')
    return firstSpace > 0 ? trimmed.substring(0, firstSpace) : trimmed
  })
}

export default function ChordSheetDisplay({ section, highlightLine }: ChordSheetDisplayProps) {
  const chords = parseChordBar(section.chordPro)
  const lyricsLines = section.lyrics.filter(l => l && l.trim().length > 0)
  const sectionColor = SECTION_COLORS[section.type] || BRAND.hotPink

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingBottom: 8,
        marginBottom: 12,
        borderBottom: `1px solid ${sectionColor}44`,
      }}>
        <span style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          padding: '3px 10px',
          borderRadius: 10,
          background: `${sectionColor}22`,
          color: sectionColor,
          border: `1px solid ${sectionColor}44`,
        }}>
          {section.type}
        </span>
      </div>

      {/* Per-line chord + lyric display */}
      {lyricsLines.length > 0 ? (
        lyricsLines.map((lyric, lineIdx) => {
          const isHighlighted = highlightLine === lineIdx
          return (
            <div key={lineIdx} style={{ marginBottom: 12 }}>
              {/* Chord line - repeated above each lyric line */}
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 11,
                letterSpacing: 1,
                lineHeight: 1.4,
                color: isHighlighted ? sectionColor : BRAND.electricTeal,
                padding: '0 4px',
                minHeight: 18,
                whiteSpace: 'pre',
              }}>
                {chords.join('   ')}
              </div>
              {/* Lyric line */}
              <div style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 16,
                lineHeight: 1.6,
                color: isHighlighted ? '#fff' : '#F0EBF8',
                padding: '0 4px',
                background: isHighlighted ? `${sectionColor}15` : 'transparent',
                borderRadius: 4,
                transition: 'all 0.15s',
              }}>
                {lyric || '\u00A0'}
              </div>
            </div>
          )
        })
      ) : (
        /* Instrumental section — show just the chord bar */
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 14,
          letterSpacing: 1.5,
          color: sectionColor,
          padding: '8px 4px',
          whiteSpace: 'pre',
          opacity: 0.7,
        }}>
          {chords.join('   ')}
        </div>
      )}
    </div>
  )
}