'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import GuitarScalesPage from '@/components/GuitarScales'
import RiffAnalyzer from '@/components/RiffAnalyzer'

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

const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F']
// Practical minor key names guitarists actually use
const RELATIVE_MINORS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m', 'Fm', 'Cm', 'Gm', 'Dm']
const MINOR_KEYS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m', 'Fm', 'Cm', 'Gm', 'Dm']

const SHARPS_FLATS: Record<string, { count: number; type: 'sharp' | 'flat' }> = {
  'C': { count: 0, type: 'sharp' },
  'G': { count: 1, type: 'sharp' },
  'D': { count: 2, type: 'sharp' },
  'A': { count: 3, type: 'sharp' },
  'E': { count: 4, type: 'sharp' },
  'B': { count: 5, type: 'sharp' },
  'F#': { count: 6, type: 'sharp' },
  'C#': { count: 7, type: 'sharp' },
  'F': { count: 1, type: 'flat' },
  'Bb': { count: 2, type: 'flat' },
  'Eb': { count: 3, type: 'flat' },
  'Ab': { count: 4, type: 'flat' },
  'Db': { count: 5, type: 'flat' },
  'Gb': { count: 6, type: 'flat' },
  'Cb': { count: 7, type: 'flat' },
}

// Diatonic chords — major: I ii iii IV V vi vii°, minor: i ii° III iv v VI VII
function getDiatonicChords(key: string): { numeral: string; chord: string; quality: string }[] {
  const isMinor = key.endsWith('m')
  const root = key.replace('m', '')

  if (isMinor) {
    // Natural minor diatonic: i, ii°, III, iv, v, VI, VII
    const minorMap: Record<string, { numeral: string; chord: string; quality: string }[]> = {
      'Am':  [{ numeral: 'i', chord: 'Am', quality: 'minor' }, { numeral: 'ii°', chord: 'Bdim', quality: 'dim' }, { numeral: 'III', chord: 'C', quality: 'major' }, { numeral: 'iv', chord: 'Dm', quality: 'minor' }, { numeral: 'v', chord: 'Em', quality: 'minor' }, { numeral: 'VI', chord: 'F', quality: 'major' }, { numeral: 'VII', chord: 'G', quality: 'major' }],
      'Em':  [{ numeral: 'i', chord: 'Em', quality: 'minor' }, { numeral: 'ii°', chord: 'F#dim', quality: 'dim' }, { numeral: 'III', chord: 'G', quality: 'major' }, { numeral: 'iv', chord: 'Am', quality: 'minor' }, { numeral: 'v', chord: 'Bm', quality: 'minor' }, { numeral: 'VI', chord: 'C', quality: 'major' }, { numeral: 'VII', chord: 'D', quality: 'major' }],
      'Bm':  [{ numeral: 'i', chord: 'Bm', quality: 'minor' }, { numeral: 'ii°', chord: 'C#dim', quality: 'dim' }, { numeral: 'III', chord: 'D', quality: 'major' }, { numeral: 'iv', chord: 'Em', quality: 'minor' }, { numeral: 'v', chord: 'F#m', quality: 'minor' }, { numeral: 'VI', chord: 'G', quality: 'major' }, { numeral: 'VII', chord: 'A', quality: 'major' }],
      'F#m': [{ numeral: 'i', chord: 'F#m', quality: 'minor' }, { numeral: 'ii°', chord: 'G#dim', quality: 'dim' }, { numeral: 'III', chord: 'A', quality: 'major' }, { numeral: 'iv', chord: 'Bm', quality: 'minor' }, { numeral: 'v', chord: 'C#m', quality: 'minor' }, { numeral: 'VI', chord: 'D', quality: 'major' }, { numeral: 'VII', chord: 'E', quality: 'major' }],
      'C#m': [{ numeral: 'i', chord: 'C#m', quality: 'minor' }, { numeral: 'ii°', chord: 'D#dim', quality: 'dim' }, { numeral: 'III', chord: 'E', quality: 'major' }, { numeral: 'iv', chord: 'F#m', quality: 'minor' }, { numeral: 'v', chord: 'G#m', quality: 'minor' }, { numeral: 'VI', chord: 'A', quality: 'major' }, { numeral: 'VII', chord: 'B', quality: 'major' }],
      'G#m': [{ numeral: 'i', chord: 'G#m', quality: 'minor' }, { numeral: 'ii°', chord: 'A#dim', quality: 'dim' }, { numeral: 'III', chord: 'B', quality: 'major' }, { numeral: 'iv', chord: 'C#m', quality: 'minor' }, { numeral: 'v', chord: 'D#m', quality: 'minor' }, { numeral: 'VI', chord: 'E', quality: 'major' }, { numeral: 'VII', chord: 'F#', quality: 'major' }],
      'D#m': [{ numeral: 'i', chord: 'D#m', quality: 'minor' }, { numeral: 'ii°', chord: 'E#dim', quality: 'dim' }, { numeral: 'III', chord: 'F#', quality: 'major' }, { numeral: 'iv', chord: 'G#m', quality: 'minor' }, { numeral: 'v', chord: 'A#m', quality: 'minor' }, { numeral: 'VI', chord: 'B', quality: 'major' }, { numeral: 'VII', chord: 'C#', quality: 'major' }],
      'A#m': [{ numeral: 'i', chord: 'A#m', quality: 'minor' }, { numeral: 'ii°', chord: 'B#dim', quality: 'dim' }, { numeral: 'III', chord: 'C#', quality: 'major' }, { numeral: 'iv', chord: 'D#m', quality: 'minor' }, { numeral: 'v', chord: 'E#m', quality: 'minor' }, { numeral: 'VI', chord: 'F#', quality: 'major' }, { numeral: 'VII', chord: 'G#', quality: 'major' }],
      'Dm':  [{ numeral: 'i', chord: 'Dm', quality: 'minor' }, { numeral: 'ii°', chord: 'Edim', quality: 'dim' }, { numeral: 'III', chord: 'F', quality: 'major' }, { numeral: 'iv', chord: 'Gm', quality: 'minor' }, { numeral: 'v', chord: 'Am', quality: 'minor' }, { numeral: 'VI', chord: 'Bb', quality: 'major' }, { numeral: 'VII', chord: 'C', quality: 'major' }],
      'Cm':  [{ numeral: 'i', chord: 'Cm', quality: 'minor' }, { numeral: 'ii°', chord: 'Ddim', quality: 'dim' }, { numeral: 'III', chord: 'Eb', quality: 'major' }, { numeral: 'iv', chord: 'Fm', quality: 'minor' }, { numeral: 'v', chord: 'Gm', quality: 'minor' }, { numeral: 'VI', chord: 'Ab', quality: 'major' }, { numeral: 'VII', chord: 'Bb', quality: 'major' }],
      'Gm':  [{ numeral: 'i', chord: 'Gm', quality: 'minor' }, { numeral: 'ii°', chord: 'Adim', quality: 'dim' }, { numeral: 'III', chord: 'Bb', quality: 'major' }, { numeral: 'iv', chord: 'Cm', quality: 'minor' }, { numeral: 'v', chord: 'Dm', quality: 'minor' }, { numeral: 'VI', chord: 'Eb', quality: 'major' }, { numeral: 'VII', chord: 'F', quality: 'major' }],
      'Fm':  [{ numeral: 'i', chord: 'Fm', quality: 'minor' }, { numeral: 'ii°', chord: 'Gdim', quality: 'dim' }, { numeral: 'III', chord: 'Ab', quality: 'major' }, { numeral: 'iv', chord: 'Bbm', quality: 'minor' }, { numeral: 'v', chord: 'Cm', quality: 'minor' }, { numeral: 'VI', chord: 'Db', quality: 'major' }, { numeral: 'VII', chord: 'Eb', quality: 'major' }],
    }
    return minorMap[key] || minorMap['Am']
  }

  const map: Record<string, { numeral: string; chord: string; quality: string }[]> = {
    'C':  [{ numeral: 'I', chord: 'C', quality: 'major' }, { numeral: 'ii', chord: 'Dm', quality: 'minor' }, { numeral: 'iii', chord: 'Em', quality: 'minor' }, { numeral: 'IV', chord: 'F', quality: 'major' }, { numeral: 'V', chord: 'G', quality: 'major' }, { numeral: 'vi', chord: 'Am', quality: 'minor' }, { numeral: 'vii°', chord: 'Bdim', quality: 'dim' }],
    'G':  [{ numeral: 'I', chord: 'G', quality: 'major' }, { numeral: 'ii', chord: 'Am', quality: 'minor' }, { numeral: 'iii', chord: 'Bm', quality: 'minor' }, { numeral: 'IV', chord: 'C', quality: 'major' }, { numeral: 'V', chord: 'D', quality: 'major' }, { numeral: 'vi', chord: 'Em', quality: 'minor' }, { numeral: 'vii°', chord: 'F#dim', quality: 'dim' }],
    'D':  [{ numeral: 'I', chord: 'D', quality: 'major' }, { numeral: 'ii', chord: 'Em', quality: 'minor' }, { numeral: 'iii', chord: 'F#m', quality: 'minor' }, { numeral: 'IV', chord: 'G', quality: 'major' }, { numeral: 'V', chord: 'A', quality: 'major' }, { numeral: 'vi', chord: 'Bm', quality: 'minor' }, { numeral: 'vii°', chord: 'C#dim', quality: 'dim' }],
    'A':  [{ numeral: 'I', chord: 'A', quality: 'major' }, { numeral: 'ii', chord: 'Bm', quality: 'minor' }, { numeral: 'iii', chord: 'C#m', quality: 'minor' }, { numeral: 'IV', chord: 'D', quality: 'major' }, { numeral: 'V', chord: 'E', quality: 'major' }, { numeral: 'vi', chord: 'F#m', quality: 'minor' }, { numeral: 'vii°', chord: 'G#dim', quality: 'dim' }],
    'E':  [{ numeral: 'I', chord: 'E', quality: 'major' }, { numeral: 'ii', chord: 'F#m', quality: 'minor' }, { numeral: 'iii', chord: 'G#m', quality: 'minor' }, { numeral: 'IV', chord: 'A', quality: 'major' }, { numeral: 'V', chord: 'B', quality: 'major' }, { numeral: 'vi', chord: 'C#m', quality: 'minor' }, { numeral: 'vii°', chord: 'D#dim', quality: 'dim' }],
    'B':  [{ numeral: 'I', chord: 'B', quality: 'major' }, { numeral: 'ii', chord: 'C#m', quality: 'minor' }, { numeral: 'iii', chord: 'D#m', quality: 'minor' }, { numeral: 'IV', chord: 'E', quality: 'major' }, { numeral: 'V', chord: 'F#', quality: 'major' }, { numeral: 'vi', chord: 'G#m', quality: 'minor' }, { numeral: 'vii°', chord: 'A#dim', quality: 'dim' }],
    'F#': [{ numeral: 'I', chord: 'F#', quality: 'major' }, { numeral: 'ii', chord: 'G#m', quality: 'minor' }, { numeral: 'iii', chord: 'A#m', quality: 'minor' }, { numeral: 'IV', chord: 'B', quality: 'major' }, { numeral: 'V', chord: 'C#', quality: 'major' }, { numeral: 'vi', chord: 'D#m', quality: 'minor' }, { numeral: 'vii°', chord: 'E#dim', quality: 'dim' }],
    'C#': [{ numeral: 'I', chord: 'C#', quality: 'major' }, { numeral: 'ii', chord: 'D#m', quality: 'minor' }, { numeral: 'iii', chord: 'E#m', quality: 'minor' }, { numeral: 'IV', chord: 'F#', quality: 'major' }, { numeral: 'V', chord: 'G#', quality: 'major' }, { numeral: 'vi', chord: 'A#m', quality: 'minor' }, { numeral: 'vii°', chord: 'B#dim', quality: 'dim' }],
    'F':  [{ numeral: 'I', chord: 'F', quality: 'major' }, { numeral: 'ii', chord: 'Gm', quality: 'minor' }, { numeral: 'iii', chord: 'Am', quality: 'minor' }, { numeral: 'IV', chord: 'Bb', quality: 'major' }, { numeral: 'V', chord: 'C', quality: 'major' }, { numeral: 'vi', chord: 'Dm', quality: 'minor' }, { numeral: 'vii°', chord: 'Edim', quality: 'dim' }],
    'Bb': [{ numeral: 'I', chord: 'Bb', quality: 'major' }, { numeral: 'ii', chord: 'Cm', quality: 'minor' }, { numeral: 'iii', chord: 'Dm', quality: 'minor' }, { numeral: 'IV', chord: 'Eb', quality: 'major' }, { numeral: 'V', chord: 'F', quality: 'major' }, { numeral: 'vi', chord: 'Gm', quality: 'minor' }, { numeral: 'vii°', chord: 'Adim', quality: 'dim' }],
    'Eb': [{ numeral: 'I', chord: 'Eb', quality: 'major' }, { numeral: 'ii', chord: 'Fm', quality: 'minor' }, { numeral: 'iii', chord: 'Gm', quality: 'minor' }, { numeral: 'IV', chord: 'Ab', quality: 'major' }, { numeral: 'V', chord: 'Bb', quality: 'major' }, { numeral: 'vi', chord: 'Cm', quality: 'minor' }, { numeral: 'vii°', chord: 'Ddim', quality: 'dim' }],
    'Ab': [{ numeral: 'I', chord: 'Ab', quality: 'major' }, { numeral: 'ii', chord: 'Bbm', quality: 'minor' }, { numeral: 'iii', chord: 'Cm', quality: 'minor' }, { numeral: 'IV', chord: 'Db', quality: 'major' }, { numeral: 'V', chord: 'Eb', quality: 'major' }, { numeral: 'vi', chord: 'Fm', quality: 'minor' }, { numeral: 'vii°', chord: 'Gdim', quality: 'dim' }],
    'Db': [{ numeral: 'I', chord: 'Db', quality: 'major' }, { numeral: 'ii', chord: 'Ebm', quality: 'minor' }, { numeral: 'iii', chord: 'Fm', quality: 'minor' }, { numeral: 'IV', chord: 'Gb', quality: 'major' }, { numeral: 'V', chord: 'Ab', quality: 'major' }, { numeral: 'vi', chord: 'Bbm', quality: 'minor' }, { numeral: 'vii°', chord: 'Cdim', quality: 'dim' }],
    'Gb': [{ numeral: 'I', chord: 'Gb', quality: 'major' }, { numeral: 'ii', chord: 'Abm', quality: 'minor' }, { numeral: 'iii', chord: 'Bbm', quality: 'minor' }, { numeral: 'IV', chord: 'Cb', quality: 'major' }, { numeral: 'V', chord: 'Db', quality: 'major' }, { numeral: 'vi', chord: 'Ebm', quality: 'minor' }, { numeral: 'vii°', chord: 'Fdim', quality: 'dim' }],
  }
  return map[key] || map['C']
}

const SCALES: Record<string, { name: string; intervals: number[] }> = {
  major: { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  naturalMinor: { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  pentatonicMajor: { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9] },
  pentatonicMinor: { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10] },
  blues: { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
}

function getScaleNotes(root: string, scale: { name: string; intervals: number[] }): string[] {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  const useFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root)
  let rootIdx = notes.indexOf(root)
  if (rootIdx === -1) rootIdx = flatNotes.indexOf(root)
  if (rootIdx === -1) rootIdx = 0
  return scale.intervals.map(i => (useFlats ? flatNotes : notes)[(rootIdx + i) % 12])
}

type TabType = 'circle' | 'chords' | 'scales' | 'riff' | 'keyfinder'

export default function ScalesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('circle')
  const [selectedKey, setSelectedKey] = useState('C')
  const [showCircleHelp, setShowCircleHelp] = useState(false)

  return (
    <div className="scales-shell" style={{ minHeight: '100vh', background: BRAND.midnight, color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Page-specific sub-header — NavBar is above this */}
      <div className="scales-tabs" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', height: 64, background: BRAND.surface, borderBottom: `1px solid ${BRAND.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: 4, color: '#F0EBF8' }}>SCALES</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 32 }}>
          {([
            { key: 'circle', label: 'Circle of Fifths' },
            { key: 'chords', label: 'Chord Charts' },
            { key: 'scales', label: 'Scales' },
            { key: 'keyfinder', label: 'Key Finder' },
            { key: 'riff', label: 'Riff Analyzer' },
          ] as { key: TabType; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeTab === key ? BRAND.hotPink : 'transparent', color: activeTab === key ? '#08060F' : BRAND.muted, fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── CIRCLE OF FIFTHS ─────────────────────────────── */}
        {activeTab === 'circle' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: BRAND.hotPink, letterSpacing: 4, margin: 0 }}>CIRCLE OF FIFTHS</h2>
              <button
                onClick={() => setShowCircleHelp(!showCircleHelp)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: `1px solid ${BRAND.electricTeal}`,
                  background: showCircleHelp ? `${BRAND.electricTeal}22` : 'transparent',
                  color: BRAND.electricTeal,
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ?
              </button>
            </div>
            {showCircleHelp && (
              <div style={{ background: `${BRAND.deepViolet}22`, border: `1px solid ${BRAND.deepViolet}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24, maxWidth: 700 }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: BRAND.electricTeal, letterSpacing: 2, marginBottom: 12 }}>WHAT IS THE CIRCLE OF FIFTHS?</div>
                <p style={{ fontFamily: 'system-ui', fontSize: 14, color: '#F0EBF8', lineHeight: 1.7, marginBottom: 12 }}>
                  The Circle of Fifths is a map of all 12 keys and how they relate to each other. Start at the top (C) and move clockwise — each step adds one sharp. Move counter-clockwise — each step adds one flat.
                </p>
                <p style={{ fontFamily: 'system-ui', fontSize: 14, color: '#F0EBF8', lineHeight: 1.7, marginBottom: 12 }}>
                  <span style={{ color: BRAND.hotPink, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1 }}>Why it matters:</span> Keys that are next to each other on the circle sound good together. The relative minor of any key sits directly across from it (e.g. C major and A minor are the same notes, different mood).
                </p>
                <div style={{ fontFamily: 'system-ui', fontSize: 13, color: BRAND.muted }}>
                  <span style={{ color: BRAND.glamGold, fontFamily: 'Space Mono, monospace' }}>Major keys</span> are on the outside ring — {CIRCLE_OF_FIFTHS.join(', ')}.
                  {' '}The <span style={{ color: BRAND.electricTeal, fontFamily: 'Space Mono, monospace' }}>minor keys</span> are on the inside ring — {RELATIVE_MINORS.join(', ')}.
                </div>
                <button
                  onClick={() => setShowCircleHelp(false)}
                  style={{ marginTop: 16, padding: '6px 16px', borderRadius: 8, border: `1px solid ${BRAND.deepViolet}`, background: 'transparent', color: BRAND.electricTeal, fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  Got it
                </button>
              </div>
            )}
            <p style={{ color: BRAND.muted, fontSize: 14, margin: '0 0 32px', maxWidth: 600 }}>The circle of fifths shows the relationship between the 12 keys. Click any key to see its diatonic chords and relative minor.</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
              <svg className="scales-circle-container" width="500" height="500" viewBox="0 0 500 500">
                <circle cx="250" cy="250" r="200" fill="none" stroke={BRAND.border} strokeWidth="2" />
                <circle cx="250" cy="250" r="150" fill="none" stroke={BRAND.border} strokeWidth="1" />
                <circle cx="250" cy="250" r="100" fill="none" stroke={BRAND.border} strokeWidth="1" />
                {CIRCLE_OF_FIFTHS.map((key, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180)
                  const x = 250 + 170 * Math.cos(angle)
                  const y = 250 + 170 * Math.sin(angle)
                  const minor = RELATIVE_MINORS[i]
                  const isSelected = key === selectedKey
                  const isMinorSelected = minor === selectedKey
                  return (
                    <g key={key} style={{ cursor: 'pointer' }}>
                      {/* Major key — outer ring */}
                      <circle
                        cx={x} cy={y} r={22}
                        fill={isSelected ? BRAND.glamGold : BRAND.card}
                        stroke={isSelected ? BRAND.glamGold : BRAND.border}
                        strokeWidth={isSelected ? 2.5 : 1}
                        onClick={() => setSelectedKey(key)}
                      />
                      <text x={x} y={y - 4} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, fill: isSelected ? BRAND.midnight : '#F0EBF8', pointerEvents: 'none' }}>{key}</text>
                      <text x={x} y={y + 12} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, fill: isSelected ? BRAND.midnight : BRAND.muted, pointerEvents: 'none' }}>maj</text>
                      {/* Minor key — inner ring */}
                      <circle
                        cx={x} cy={y} r={16}
                        fill={isMinorSelected ? BRAND.electricTeal : 'transparent'}
                        stroke={isMinorSelected ? BRAND.electricTeal : BRAND.border}
                        strokeWidth={isMinorSelected ? 2 : 1}
                        onClick={() => setSelectedKey(minor)}
                      />
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fill: isMinorSelected ? BRAND.midnight : BRAND.electricTeal, pointerEvents: 'none' }}>{minor}</text>
                    </g>
                  )
                })}
                {['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'].map((key, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180)
                  const x = 250 + 200 * Math.cos(angle)
                  const y = 250 + 200 * Math.sin(angle)
                  const sf = SHARPS_FLATS[key]
                  if (!sf || sf.count === 0) return null
                  return <text key={`sf-${key}`} x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fill: BRAND.muted }}>{sf.type === 'sharp' ? '#'.repeat(sf.count) : 'b'.repeat(sf.count)}</text>
                })}
                <text x="250" y="245" textAnchor="middle" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, fill: BRAND.muted }}>TLK HUB</text>
                <text x="250" y="262" textAnchor="middle" style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, fill: BRAND.muted }}>SCALES REF</text>
              </svg>
            </div>

            {selectedKey && (
              <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: 32, maxWidth: 600, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 48, color: selectedKey.includes('m') ? BRAND.electricTeal : BRAND.hotPink, letterSpacing: 4 }}>{selectedKey}</span>
                  <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 18, color: BRAND.muted, marginLeft: 16, letterSpacing: 2 }}>{selectedKey.includes('m') ? 'MINOR' : 'MAJOR'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
                  {getDiatonicChords(selectedKey).map(({ numeral, chord, quality }) => (
                    <div key={numeral} style={{ background: BRAND.surface, borderRadius: 10, padding: '12px 8px', textAlign: 'center', border: `1px solid ${quality === 'major' ? BRAND.glamGold + '44' : quality === 'minor' ? BRAND.electricTeal + '44' : BRAND.hotPink + '44'}` }}>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted, marginBottom: 4 }}>{numeral}</div>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 1, color: quality === 'major' ? BRAND.glamGold : quality === 'minor' ? BRAND.electricTeal : BRAND.hotPink }}>{chord}</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted, marginTop: 2 }}>{quality}</div>
                    </div>
                  ))}
                </div>
                {SHARPS_FLATS[selectedKey.replace('m', '')] && SHARPS_FLATS[selectedKey.replace('m', '')].count > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 16, fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.electricTeal }}>
                    {SHARPS_FLATS[selectedKey.replace('m', '')].count} {SHARPS_FLATS[selectedKey.replace('m', '')].type === 'sharp' ? 'sharps' : 'flats'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── CHORD CHARTS ─────────────────────────────────── */}
        {activeTab === 'chords' && (
          <div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: BRAND.hotPink, letterSpacing: 4, margin: '0 0 8px' }}>CHORD CHARTS BY KEY</h2>
            <p style={{ color: BRAND.muted, fontSize: 14, margin: '0 0 24px' }}>Diatonic chords for each key.</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].map(k => (
                  <button key={k} onClick={() => setSelectedKey(k)} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${selectedKey === k ? BRAND.hotPink : BRAND.border}`, background: selectedKey === k ? BRAND.hotPink + '22' : 'transparent', color: selectedKey === k ? BRAND.hotPink : BRAND.muted, fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.15s' }}>{k}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MINOR_KEYS.map(k => (
                  <button key={k} onClick={() => setSelectedKey(k)} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${selectedKey === k ? BRAND.electricTeal : BRAND.border}`, background: selectedKey === k ? BRAND.electricTeal + '22' : 'transparent', color: selectedKey === k ? BRAND.electricTeal : BRAND.muted, fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.15s' }}>{k}</button>
                ))}
              </div>
            </div>

            {selectedKey && (
              <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: 32, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, color: selectedKey.includes('m') ? BRAND.electricTeal : BRAND.hotPink, letterSpacing: 2 }}>{selectedKey}</span>
                    <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, color: BRAND.muted, marginLeft: 12, letterSpacing: 2 }}>{selectedKey.includes('m') ? 'MINOR KEY' : 'MAJOR KEY'}</span>
                  </div>
                  {SHARPS_FLATS[selectedKey.replace('m', '')] && SHARPS_FLATS[selectedKey.replace('m', '')].count > 0 && (
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.electricTeal, background: BRAND.surface, padding: '6px 14px', borderRadius: 20 }}>
                      {SHARPS_FLATS[selectedKey.replace('m', '')].type === 'sharp' ? '#'.repeat(SHARPS_FLATS[selectedKey.replace('m', '')].count) : 'b'.repeat(SHARPS_FLATS[selectedKey.replace('m', '')].count)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16 }}>
                  {getDiatonicChords(selectedKey).map(({ numeral, chord, quality }) => {
                    const qualityColor = quality === 'major' ? BRAND.glamGold : quality === 'minor' ? BRAND.electricTeal : BRAND.hotPink
                    return (
                      <div key={numeral} style={{ background: BRAND.surface, borderRadius: 16, padding: '20px 12px', textAlign: 'center', border: `2px solid ${qualityColor}44` }}>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginBottom: 8 }}>{numeral}</div>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 1, color: qualityColor, marginBottom: 4 }}>{chord}</div>
                        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 10, letterSpacing: 2, color: BRAND.muted, textTransform: 'uppercase' }}>{quality}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: BRAND.muted, letterSpacing: 2, marginBottom: 16 }}>ALL KEYS OVERVIEW</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].map(key => (
                <div key={key} onClick={() => setSelectedKey(key)} style={{ background: BRAND.card, borderRadius: 12, padding: '20px 24px', cursor: 'pointer', border: `1px solid ${selectedKey === key ? BRAND.hotPink : BRAND.border}`, transition: 'all 0.15s' }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: BRAND.hotPink, marginBottom: 12 }}>{key}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {getDiatonicChords(key).map(({ chord }) => (
                      <span key={chord} style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, background: BRAND.surface, borderRadius: 6, padding: '4px 10px', color: BRAND.electricTeal }}>{chord}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCALES ──────────────────────────────────────── */}
        {activeTab === 'scales' && (
          <GuitarScalesPage />
        )}

        {/* ── KEY FINDER ───────────────────────────────────── */}
        {activeTab === 'keyfinder' && (
          <div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: BRAND.hotPink, letterSpacing: 4, margin: '0 0 8px' }}>KEY FINDER</h2>
            <p style={{ color: BRAND.muted, fontSize: 14, margin: '0 0 32px', maxWidth: 600 }}>Enter a sequence of chords to discover the musical key and recommended scale.</p>
            <GuitarScalesPage />
          </div>
        )}

        {/* ── RIFF ANALYZER ───────────────────────────────── */}
        {activeTab === 'riff' && (
          <div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: BRAND.hotPink, letterSpacing: 4, margin: '0 0 8px' }}>RIFF ANALYZER</h2>
            <p style={{ color: BRAND.muted, fontSize: 14, margin: '0 0 32px', maxWidth: 600 }}>Play a riff on your guitar. The analyzer will detect the musical note and pitch from your microphone in real time.</p>
            <RiffAnalyzer />
          </div>
        )}
      </div>
    </div>
  )
}