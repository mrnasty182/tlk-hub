'use client'

import React, { useState, useMemo } from 'react'
import { SCALES, getScalePositions, getBoxPosition, formatChord } from '@/lib/music'

interface ScaleExplorerProps {
  autoScale?: string
  autoRoot?: string
  onChordTap?: (chord: string) => void
}

const SCALE_NAMES = ['Minor Pentatonic', 'Major Pentatonic', 'Blue Scale']

export default function ScaleExplorer({ autoScale, autoRoot, onChordTap }: ScaleExplorerProps) {
  const [selectedScale, setSelectedScale] = useState<string>(autoScale || 'Minor Pentatonic')
  const [selectedRoot, setSelectedRoot] = useState<string>(autoRoot || 'A')
  const [focusedPosition, setFocusedPosition] = useState<number | null>(null)

  const positions = useMemo(() => {
    return getScalePositions(selectedRoot, selectedScale)
  }, [selectedRoot, selectedScale])

  const positionsByBox = useMemo(() => {
    const boxes: Record<number, typeof positions> = {}
    positions.forEach(p => {
      const box = getBoxPosition(p.fret)
      if (!boxes[box]) boxes[box] = []
      boxes[box].push(p)
    })
    return boxes
  }, [positions])

  const scaleInfo = SCALES[selectedScale]

  return (
    <div className="scale-explorer">
      <div className="panel-header">
        <h3>Scale Explorer</h3>
      </div>

      {/* Scale Selector */}
      <div className="scale-selector">
        <div className="scale-roots">
          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(root => (
            <button
              key={root}
              className={`root-btn ${selectedRoot === root ? 'active' : ''}`}
              onClick={() => setSelectedRoot(root)}
            >
              {root}
            </button>
          ))}
        </div>
        <div className="scale-types">
          {SCALE_NAMES.map(name => (
            <button
              key={name}
              className={`scale-btn ${selectedScale === name ? 'active' : ''}`}
              onClick={() => setSelectedScale(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Scale Info */}
      <div className="scale-info">
        <span className="scale-name">{selectedRoot} {selectedScale}</span>
        <span className="scale-degrees">
          {scaleInfo?.degrees.join(' - ')}
        </span>
      </div>

      {/* Position Tabs */}
      <div className="position-tabs">
        <button
          className={`pos-tab ${focusedPosition === null ? 'active' : ''}`}
          onClick={() => setFocusedPosition(null)}
        >
          All
        </button>
        {[1, 2, 3, 4, 5].map(pos => (
          <button
            key={pos}
            className={`pos-tab ${focusedPosition === pos ? 'active' : ''}`}
            onClick={() => setFocusedPosition(pos)}
          >
            Pos {pos}
          </button>
        ))}
      </div>

      {/* Fretboard */}
      <div className="scale-fretboard">
        <ScaleFretboard
          positions={positions}
          focusedPosition={focusedPosition}
          positionsByBox={positionsByBox}
        />
      </div>

      {/* Scale Notes */}
      <div className="scale-notes">
        <h4>Notes in Scale</h4>
        <div className="note-chips">
          {scaleInfo?.intervals.map((interval, idx) => {
            const noteIdx = (['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(selectedRoot) + interval) % 12
            const note = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][noteIdx]
            return (
              <span key={idx} className={`note-chip ${idx === 0 ? 'root' : ''}`}>
                {note}
                <span className="degree">{scaleInfo.degrees[idx]}</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ScaleFretboard({
  positions,
  focusedPosition,
  positionsByBox
}: {
  positions: { position: number; fret: number; string: number; note: string; isRoot: boolean }[]
  focusedPosition: number | null
  positionsByBox: Record<number, typeof positions>
}) {
  const strings = ['E', 'A', 'D', 'G', 'B', 'e']
  const maxFret = 24
  const startFret = 0
  const endFret = 24

  // Filter positions if a box is focused
  const filteredPositions = focusedPosition
    ? positionsByBox[focusedPosition] || []
    : positions

  return (
    <div className="scale-fretboard-inner">
      {/* Nut */}
      <div className="fret-nut" />
      
      {/* Strings */}
      <div className="scale-strings">
        {strings.map((string, stringIdx) => (
          <div key={stringIdx} className="scale-string-row">
            <span className="string-label">{string}</span>
            <div className="string-track">
              {Array.from({ length: endFret - startFret + 1 }, (_, fretIdx) => {
                const fretNum = startFret + fretIdx
                const posOnFret = filteredPositions.filter(p => p.fret === fretNum && p.string === stringIdx)
                const hasRoot = posOnFret.some(p => p.isRoot)
                const hasOther = posOnFret.some(p => !p.isRoot)
                
                return (
                  <div key={fretIdx} className={`scale-cell ${fretNum === 0 ? 'nut' : ''}`}>
                    {posOnFret.length > 0 && (
                      <div className={`scale-dot ${hasRoot ? 'root' : 'other'}`}>
                        {hasRoot && <span className="root-indicator" />}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Fret numbers */}
      <div className="scale-fret-numbers">
        <span />
        {Array.from({ length: endFret + 1 }, (_, i) => {
          const fretNum = i
          return (
            <span key={i} className={`fret-num ${[3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fretNum) ? 'accent' : ''}`}>
              {fretNum === 0 ? '' : fretNum}
            </span>
          )
        })}
      </div>
      
      {/* Position markers */}
      <div className="position-markers">
        {[1, 2, 3, 4, 5].map(pos => {
          const posFrets = Object.entries(positionsByBox).find(([k]) => Number(k) === pos)?.[1] || []
          const firstFret = Math.min(...posFrets.map((p: { fret: number }) => p.fret))
          const isActive = focusedPosition === pos || focusedPosition === null
          
          return (
            <div
              key={pos}
              className={`position-marker ${isActive ? 'active' : 'dim'}`}
              style={{ left: `${(firstFret / 24) * 100}%` }}
            >
              {pos}
            </div>
          )
        })}
      </div>
    </div>
  )
}