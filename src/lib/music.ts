// Music theory utilities for TLK Hub
// Handles chords, scales, fretboards, and chord diagrams

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

// Standard tuning: E A D G B E (low to high)
export const STRING_TUNING = [4, 9, 14, 19, 23, 28] // E=4, A=9, D=14, G=19, B=23, E=28

// Get note index (0-11)
export function getNoteIndex(note: string): number {
  const idx = NOTES.indexOf(note)
  if (idx !== -1) return idx
  const flatIdx = FLAT_NOTES.indexOf(note)
  return flatIdx !== -1 ? flatIdx : 0
}

// Get note by adding semitones
export function addSemitones(root: string, semitones: number): string {
  const idx = getNoteIndex(root)
  return NOTES[(idx + semitones + 120) % 12]
}

// Get interval name
export function getIntervalName(semitones: number): string {
  const intervals: Record<number, string> = {
    0: 'R', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
    6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7'
  }
  return intervals[semitones] || String(semitones)
}

// Scale definitions
export const SCALES: Record<string, { intervals: number[]; degrees: string[] }> = {
  'Minor Pentatonic': {
    intervals: [0, 3, 5, 7, 10],
    degrees: ['1', 'b3', '4', '5', 'b7']
  },
  'Major Pentatonic': {
    intervals: [0, 2, 4, 7, 9],
    degrees: ['1', '2', '3', '5', '6']
  },
  'Blue Scale': {
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: ['1', 'b3', '4', 'b5', '5', 'b7']
  }
}

// Chord quality definitions (semitones from root)
export const CHORD_QUALITIES: Record<string, number[]> = {
  '': [0, 4, 7],
  'm': [0, 3, 7],
  'maj7': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10],
  '7': [0, 4, 7, 10],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  'add9': [0, 4, 7, 14],
  '6': [0, 4, 7, 9],
  'm6': [0, 3, 7, 9],
}

// Parse chord name into root and quality
export function parseChord(chordName: string): { root: string; quality: string } {
  const match = chordName.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return { root: 'C', quality: '' }
  return { root: match[1], quality: match[2] || '' }
}

// Get chord notes
export function getChordNotes(root: string, quality: string): string[] {
  const intervals = CHORD_QUALITIES[quality] || CHORD_QUALITIES['']
  return intervals.map((i: number) => addSemitones(root, i))
}

// Get piano keys for a chord (white and black key indices 0-88, mapped to 0-11)
export function getPianoKeys(root: string, quality: string): number[] {
  const notes = getChordNotes(root, quality)
  return notes.map(n => getNoteIndex(n))
}

// Generate scale positions on fretboard
export function getScalePositions(root: string, scaleName: string): {
  position: number
  fret: number
  string: number
  note: string
  isRoot: boolean
}[] {
  const scaleData = SCALES[scaleName]
  if (!scaleData) return []

  const rootIdx = getNoteIndex(root)
  const scaleNotes = scaleData.intervals.map((i: number) => NOTES[(rootIdx + i) % 12])

  const positions: { position: number; fret: number; string: number; note: string; isRoot: boolean }[] = []

  // For each string, find where scale notes appear
  for (let string = 0; string < 6; string++) {
    const openNote = STRING_TUNING[string] % 12
    for (let fret = 0; fret <= 24; fret++) {
      const fretNote = (openNote + fret) % 12
      const noteIdx = scaleNotes.findIndex((n: string) => getNoteIndex(n) === fretNote)
      if (noteIdx !== -1) {
        positions.push({
          position: getBoxPosition(fret),
          fret,
          string,
          note: scaleNotes[noteIdx],
          isRoot: noteIdx === 0
        })
      }
    }
  }

  return positions
}

// Get box position (1-5) from fret number
export function getBoxPosition(fret: number): number {
  if (fret <= 4) return 1
  if (fret <= 9) return 2
  if (fret <= 14) return 3
  if (fret <= 19) return 4
  return 5
}

// Get scale notes for a chord (for auto-display)
export function getScaleForChord(chordName: string): { scale: string; root: string } | null {
  const { root, quality } = parseChord(chordName)
  
  if (quality === 'm' || quality === 'm7' || quality === 'dim') {
    return { scale: 'Minor Pentatonic', root }
  }
  if (quality === '' || quality === '7' || quality === 'maj7') {
    return { scale: 'Major Pentatonic', root }
  }
  return null
}

// Format chord for display
export function formatChord(chord: string): string {
  return chord.replace('b', '♭').replace('#', '♯')
}

// Common chord shapes for diagram generation
const CHORD_SHAPES: Record<string, Record<string, [number[], number]>> = {
  major: {
    'C': [[-1, 3, 2, 0, 1, 0], 3],
    'D': [[-1, -1, 0, 2, 3, 2], 0],
    'E': [[0, 2, 2, 1, 0, 0], 0],
    'F': [[1, 1, 2, 3, 3, 1], 1],
    'G': [[3, 2, 0, 0, 0, 3], 0],
    'A': [[-1, 0, 2, 2, 2, 0], 0],
    'B': [[-1, 2, 4, 4, 4, 2], 2],
  },
  minor: {
    'Am': [[-1, 0, 2, 2, 1, 0], 0],
    'Bm': [[-1, 2, 4, 4, 3, 2], 2],
    'Cm': [[-1, 3, 5, 5, 4, 3], 3],
    'Dm': [[-1, -1, 0, 2, 3, 1], 0],
    'Em': [[0, 2, 2, 0, 0, 0], 0],
    'Fm': [[1, 1, 3, 3, 2, 1], 1],
    'Gm': [[3, 1, 0, 0, 0, 3], 0],
  }
}

// Generate guitar chord diagram
export function generateChordDiagram(chordName: string): {
  frets: number[][]
  baseFret: number
} {
  const { root, quality } = parseChord(chordName)
  
  // Try major shapes
  if (!quality || quality === 'maj7' || quality === '7' || quality === '6') {
    const majorRoot = root.replace('b', '').replace('#', '')
    if (CHORD_SHAPES.major[majorRoot]) {
      return { frets: [CHORD_SHAPES.major[majorRoot][0]], baseFret: CHORD_SHAPES.major[majorRoot][1] }
    }
  }
  
  // Try minor shapes
  if (quality.startsWith('m') || quality === 'dim') {
    const minorRoot = root + 'm'
    if (CHORD_SHAPES.minor[minorRoot]) {
      return { frets: [CHORD_SHAPES.minor[minorRoot][0]], baseFret: CHORD_SHAPES.minor[minorRoot][1] }
    }
  }
  
  // Fall back to generic barre chord shape based on root
  const barreShapes: Record<string, [number[], number]> = {
    'C': [[-1, 3, 5, 5, 5, 3], 3],
    'D': [[-1, -1, 0, 2, 3, 2], 0],
    'E': [[0, 2, 2, 1, 0, 0], 0],
    'F': [[1, 1, 1, 2, 3, 1], 1],
    'G': [[3, 3, 3, 2, 0, 3], 3],
    'A': [[-1, 0, 2, 2, 2, 0], 0],
    'B': [[-1, 2, 4, 4, 4, 2], 2],
  }
  
  const cleanRoot = root.replace('b', '').replace('#', '')
  if (barreShapes[cleanRoot]) {
    return { frets: [barreShapes[cleanRoot][0]], baseFret: barreShapes[cleanRoot][1] }
  }
  
  return { frets: [[-1, -1, -1, -1, -1, -1]], baseFret: 1 }
}