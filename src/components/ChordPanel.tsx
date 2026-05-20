'use client'

import React, { useState, useMemo } from 'react'
import { generateChordDiagram, getPianoKeys, formatChord, parseChord } from '@/lib/music'

interface ChordPanelProps {
  chord?: string
  autoScale?: string
  autoRoot?: string
}

export default function ChordPanel({ chord, autoScale, autoRoot }: ChordPanelProps) {
  const [selectedChord, setSelectedChord] = useState(chord || 'G')
  
  const chordData = useMemo(() => {
    const { root, quality } = parseChord(selectedChord)
    const diagram = generateChordDiagram(selectedChord)
    const pianoKeys = getPianoKeys(root, quality || '')
    return { root, quality, diagram, pianoKeys }
  }, [selectedChord])

  return (
    <div className="chord-panel">
      <div className="panel-header">
        <h3>Chord Reference</h3>
        {autoScale && autoRoot && (
          <span className="auto-hint">Scale: {autoRoot} {autoScale}</span>
        )}
      </div>
      
      {/* Guitar Fretboard */}
      <div className="fretboard-container">
        <div className="fretboard-label">Guitar — 24 Fret</div>
        <Fretboard diagram={chordData.diagram} />
      </div>
      
      {/* Piano Keys */}
      <div className="piano-container">
        <div className="piano-label">Piano</div>
        <PianoKeys keys={chordData.pianoKeys} root={chordData.root} />
      </div>
      
      {/* Voicing Suggestions */}
      <div className="voicing-section">
        <h4>Common Voicings</h4>
        <div className="voicing-chips">
          <button onClick={() => setSelectedChord(chordData.root)} className="voicing-chip">
            Root
          </button>
          <button onClick={() => setSelectedChord(chordData.root + '7')} className="voicing-chip">
            7th
          </button>
          <button onClick={() => setSelectedChord(chordData.root + 'm')} className="voicing-chip">
            Minor
          </button>
          <button onClick={() => setSelectedChord(chordData.root + 'sus4')} className="voicing-chip">
            Sus4
          </button>
        </div>
      </div>
    </div>
  )
}

function Fretboard({ diagram }: { diagram: { frets: number[][]; baseFret: number } }) {
  const { frets, baseFret } = diagram
  const strings = ['E', 'A', 'D', 'G', 'B', 'e']
  const startFret = Math.max(0, baseFret - 1)
  const endFret = startFret + 12
  
  return (
    <div className="fretboard">
      {/* Nut */}
      <div className="fret-nut" />
      
      {/* Strings and frets */}
      <div className="fretboard-grid">
        {strings.map((string, stringIdx) => (
          <div key={stringIdx} className="string-row">
            <span className="string-label">{string}</span>
            <div className="string-line">
              {Array.from({ length: 13 }, (_, i) => {
                const fretNum = startFret + i
                const fretValue = frets[0]?.[stringIdx] ?? -1
                const isMarked = fretValue === fretNum
                const isOpen = fretValue === 0 && i === 0
                const isMuted = fretValue === -1 && i === 0
                
                return (
                  <div key={i} className={`fret-cell ${i === 0 ? 'first-fret' : ''}`}>
                    {isOpen && <div className="fret-dot open" />}
                    {isMarked && <div className="fret-dot" />}
                    {isMuted && <div className="fret-dot muted" />}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Fret numbers */}
      <div className="fret-numbers">
        <span />
        {Array.from({ length: 13 }, (_, i) => {
          const fretNum = startFret + i + 1
          return (
            <span key={i} className={`fret-num ${[3, 5, 7, 9, 12, 15].includes(fretNum) ? 'accent' : ''}`}>
              {fretNum}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function PianoKeys({ keys, root }: { keys: number[]; root: string }) {
  const octaves = [4, 5]
  
  return (
    <div className="piano">
      {octaves.map(octave => (
        <div key={octave} className="piano-octave">
          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note, idx) => {
            const noteIdx = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(note)
            const isBlack = [1, 3, 6, 8, 10].includes(noteIdx)
            const isActive = keys.includes(noteIdx)
            const isRootNote = noteIdx === ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(root.replace('#', '').replace('b', ''))
            
            return (
              <div
                key={`${note}-${octave}`}
                className={`piano-key ${isBlack ? 'black' : 'white'} ${isActive ? 'active' : ''} ${isRootNote ? 'root' : ''}`}
              >
                <span className="key-label">{note}{octave}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}