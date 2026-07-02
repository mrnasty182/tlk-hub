/**
 * Chord shape library for TLK Hub.
 * Standard 6-string guitar chord diagrams.
 *
 * Format:
 *   - fingerings[s] = fret on string s (1=high E, 6=low E)
 *     0 = open, -1 = muted (x), null = don't show (strings above nut)
 *   - baseFret = fret shown at the top of the diagram (default 1 for open chords)
 *   - barres = array of { fret, fromString, toString }
 *
 * All chord names use sharps by default. flat variants (Bb, Eb, etc) render the same shape with a different label.
 */

export type Fingerings = [number, number, number, number, number, number] | null
export type Barre = { fret: number; fromString: number; toString: number }

export interface ChordShape {
  name: string                  // canonical name (with sharps)
  altNames?: string[]           // aliases (e.g. ['Bb'] for 'A#')
  fingerings: Fingerings        // [string1, string2, ..., string6] = [high E, B, G, D, A, low E]
  baseFret: number
  barres?: Barre[]
  fingers?: number[]            // finger number per string (1-4), indexed same as fingerings
}

const x: number = -1
const o: number = 0

export const CHORD_LIBRARY: Record<string, ChordShape> = {
  // ═══════════════════════════════════════════════════════════
  // OPEN MAJORS
  // ═══════════════════════════════════════════════════════════
  'C':   { name: 'C',   fingerings: [x, 1, 0, 2, 3, x], baseFret: 1, fingers: [0,1,0,2,3,0] },
  'D':   { name: 'D',   fingerings: [2, 3, 2, 0, x, x], baseFret: 1, fingers: [1,3,2,0,0,0] },
  'E':   { name: 'E',   fingerings: [0, 2, 2, 1, 0, 0], baseFret: 1, fingers: [0,2,3,1,0,0] },
  'F':   { name: 'F',   altNames: ['F*'], fingerings: [1, 3, 3, 2, 1, 1], baseFret: 1, fingers: [1,3,4,2,1,1], barres: [{ fret: 1, fromString: 1, toString: 6 }] },
  'G':   { name: 'G',   fingerings: [3, 0, 0, 0, 2, 3], baseFret: 1, fingers: [2,0,0,0,1,3] },
  'A':   { name: 'A',   fingerings: [x, 0, 2, 2, 2, 0], baseFret: 1, fingers: [0,0,1,2,3,0] },
  'B':   { name: 'B',   fingerings: [x, 2, 4, 4, 4, 2], baseFret: 2, fingers: [0,1,3,4,2,1], barres: [{ fret: 2, fromString: 5, toString: 1 }] },

  // Sharps/flats of open majors
  'C#':  { name: 'C#',  altNames: ['Db'], fingerings: [x, 4, 6, 6, 6, 4], baseFret: 4, fingers: [0,1,3,4,2,1], barres: [{ fret: 4, fromString: 5, toString: 1 }] },
  'D#':  { name: 'D#',  altNames: ['Eb'], fingerings: [x, x, 1, 3, 3, 1], baseFret: 1, fingers: [0,0,1,3,4,2] },
  'F#':  { name: 'F#',  altNames: ['Gb'], fingerings: [2, 4, 4, 3, 2, 2], baseFret: 2, fingers: [1,3,4,2,1,1], barres: [{ fret: 2, fromString: 1, toString: 6 }] },
  'G#':  { name: 'G#',  altNames: ['Ab'], fingerings: [4, 6, 6, 5, 4, 4], baseFret: 4, fingers: [1,3,4,2,1,1], barres: [{ fret: 4, fromString: 1, toString: 6 }] },
  'A#':  { name: 'A#',  altNames: ['Bb'], fingerings: [x, 1, 3, 3, 3, 1], baseFret: 1, fingers: [0,1,3,4,2,1], barres: [{ fret: 1, fromString: 5, toString: 1 }] },

  // ═══════════════════════════════════════════════════════════
  // OPEN MINORS
  // ═══════════════════════════════════════════════════════════
  'Am':  { name: 'Am',  fingerings: [x, 0, 2, 2, 1, 0], baseFret: 1, fingers: [0,0,2,3,1,0] },
  'Dm':  { name: 'Dm',  fingerings: [1, 3, 2, 0, x, x], baseFret: 1, fingers: [1,3,2,0,0,0] },
  'Em':  { name: 'Em',  fingerings: [0, 2, 2, 0, 0, 0], baseFret: 1, fingers: [0,2,3,0,0,0] },
  'Fm':  { name: 'Fm',  fingerings: [1, 3, 3, 1, 1, 1], baseFret: 1, fingers: [1,3,4,1,1,1], barres: [{ fret: 1, fromString: 1, toString: 6 }] },
  'Gm':  { name: 'Gm',  fingerings: [3, 5, 5, 3, 3, 3], baseFret: 3, fingers: [1,3,4,1,1,1], barres: [{ fret: 3, fromString: 1, toString: 6 }] },
  'Bm':  { name: 'Bm',  fingerings: [x, 2, 4, 4, 3, 2], baseFret: 2, fingers: [0,1,3,4,2,1], barres: [{ fret: 2, fromString: 5, toString: 1 }] },

  'Cm':  { name: 'Cm',  fingerings: [x, 4, 6, 6, 5, 4], baseFret: 4, fingers: [0,1,3,4,2,1], barres: [{ fret: 4, fromString: 5, toString: 1 }] },
  'C#m': { name: 'C#m', altNames: ['Dbm'], fingerings: [x, x, 2, 1, 2, 0], baseFret: 1, fingers: [0,0,2,1,3,0] },
  'D#m': { name: 'D#m', altNames: ['Ebm'], fingerings: [x, x, 1, 3, 4, 2], baseFret: 1, fingers: [0,0,1,2,4,3] },
  'F#m': { name: 'F#m', altNames: ['Gbm'], fingerings: [2, 4, 4, 2, 2, 2], baseFret: 2, fingers: [1,3,4,1,1,1], barres: [{ fret: 2, fromString: 1, toString: 6 }] },
  'G#m': { name: 'G#m', altNames: ['Abm'], fingerings: [4, 6, 6, 4, 4, 4], baseFret: 4, fingers: [1,3,4,1,1,1], barres: [{ fret: 4, fromString: 1, toString: 6 }] },
  'A#m': { name: 'A#m', altNames: ['Bbm'], fingerings: [x, 1, 3, 3, 2, 1], baseFret: 1, fingers: [0,1,3,4,2,1], barres: [{ fret: 1, fromString: 5, toString: 1 }] },

  // ═══════════════════════════════════════════════════════════
  // DOMINANT 7
  // ═══════════════════════════════════════════════════════════
  'A7':  { name: 'A7',  fingerings: [x, 0, 2, 0, 2, 0], baseFret: 1, fingers: [0,0,2,0,3,0] },
  'B7':  { name: 'B7',  fingerings: [x, 2, 1, 2, 0, 2], baseFret: 1, fingers: [0,2,1,3,0,4] },
  'C7':  { name: 'C7',  fingerings: [x, 1, 3, 2, 3, 1], baseFret: 1, fingers: [0,1,3,2,4,1] },
  'D7':  { name: 'D7',  fingerings: [1, 3, 1, 2, 1, x], baseFret: 1, fingers: [1,3,1,2,1,0] },
  'E7':  { name: 'E7',  fingerings: [0, 2, 0, 1, 0, 0], baseFret: 1, fingers: [0,2,0,1,0,0] },
  'F7':  { name: 'F7',  fingerings: [1, 3, 1, 2, 1, 1], baseFret: 1, fingers: [1,3,1,2,1,1], barres: [{ fret: 1, fromString: 1, toString: 6 }] },
  'G7':  { name: 'G7',  fingerings: [3, 2, 0, 0, 0, 1], baseFret: 1, fingers: [3,2,0,0,0,1] },

  // ═══════════════════════════════════════════════════════════
  // POWER CHORDS (5)
  // ═══════════════════════════════════════════════════════════
  'A5':  { name: 'A5',  fingerings: [x, x, 2, 2, x, x], baseFret: 1, fingers: [0,0,1,2,0,0] },
  'B5':  { name: 'B5',  fingerings: [x, x, 4, 4, x, x], baseFret: 2, fingers: [0,0,1,2,0,0] },
  'C5':  { name: 'C5',  fingerings: [x, 3, 5, 5, x, x], baseFret: 3, fingers: [0,1,3,4,0,0] },
  'D5':  { name: 'D5',  fingerings: [5, 5, 5, x, x, x], baseFret: 5, fingers: [1,1,1,0,0,0], barres: [{ fret: 5, fromString: 6, toString: 4 }] },
  'E5':  { name: 'E5',  fingerings: [0, 2, 2, x, x, x], baseFret: 1, fingers: [0,1,2,0,0,0] },
  'F5':  { name: 'F5',  fingerings: [1, 3, 3, x, x, x], baseFret: 1, fingers: [1,3,4,0,0,0] },
  'G5':  { name: 'G5',  fingerings: [3, 5, 5, x, x, x], baseFret: 3, fingers: [1,3,4,0,0,0] },

  // ═══════════════════════════════════════════════════════════
  // MAJOR 7 (limited useful ones)
  // ═══════════════════════════════════════════════════════════
  'Cmaj7': { name: 'Cmaj7', fingerings: [x, 3, 2, 0, 0, 0], baseFret: 1, fingers: [0,3,2,0,0,0] },
  'Dmaj7': { name: 'Dmaj7', fingerings: [2, 2, 2, 0, x, x], baseFret: 1, fingers: [1,1,1,0,0,0], barres: [{ fret: 2, fromString: 6, toString: 4 }] },
  'Emaj7': { name: 'Emaj7', fingerings: [0, 2, 1, 1, 0, 0], baseFret: 1, fingers: [0,3,1,2,0,0] },
  'Gmaj7': { name: 'Gmaj7', fingerings: [3, 2, 0, 0, 0, 2], baseFret: 1, fingers: [3,2,0,0,0,1] },
  'Amaj7': { name: 'Amaj7', fingerings: [x, 0, 2, 1, 2, 0], baseFret: 1, fingers: [0,0,2,1,3,0] },

  // ═══════════════════════════════════════════════════════════
  // MINOR 7 (useful ones)
  // ═══════════════════════════════════════════════════════════
  'Am7':  { name: 'Am7',  fingerings: [x, 0, 2, 0, 1, 0], baseFret: 1, fingers: [0,0,2,0,1,0] },
  'Dm7':  { name: 'Dm7',  fingerings: [1, 1, 2, 0, x, x], baseFret: 1, fingers: [1,1,2,0,0,0], barres: [{ fret: 1, fromString: 6, toString: 5 }] },
  'Em7':  { name: 'Em7',  fingerings: [0, 2, 0, 0, 0, 0], baseFret: 1, fingers: [0,2,0,0,0,0] },
  'Bm7':  { name: 'Bm7',  fingerings: [x, 2, 0, 2, 0, 2], baseFret: 1, fingers: [0,1,0,2,0,3] },
  'Gm7':  { name: 'Gm7',  fingerings: [3, 5, 3, 3, 3, 3], baseFret: 3, fingers: [1,3,1,1,1,1], barres: [{ fret: 3, fromString: 1, toString: 6 }] },
}

/** Look up a chord by name, trying aliases too */
export function getChord(name: string): ChordShape | null {
  const cleaned = name.trim()
  // Try exact match
  if (CHORD_LIBRARY[cleaned]) return CHORD_LIBRARY[cleaned]
  // Try alt names
  for (const chord of Object.values(CHORD_LIBRARY)) {
    if (chord.altNames?.includes(cleaned)) return chord
  }
  return null
}

/** List of all chord names available, for autocomplete */
export const ALL_CHORD_NAMES = Object.keys(CHORD_LIBRARY).sort()

/**
 * Transpose a chord name by N semitones.
 * Returns null if the chord isn't in the library.
 */
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function parseChordName(name: string): { root: string; quality: string } | null {
  const match = name.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return null
  return { root: match[1], quality: match[2] || '' }
}

export function transposeChordName(name: string, semitones: number, preferFlats = false): string {
  const parsed = parseChordName(name)
  if (!parsed) return name
  const fromArr = parsed.root.includes('b') ? FLAT_NAMES : SHARP_NAMES
  const idx = fromArr.indexOf(parsed.root)
  if (idx < 0) return name
  const newIdx = ((idx + semitones) % 12 + 12) % 12
  const newRoot = (preferFlats ? FLAT_NAMES : SHARP_NAMES)[newIdx]
  return newRoot + parsed.quality
}

/** Transpose a chordPro string, only touching chord names inside [brackets] */
export function transposeChordPro(chordPro: string, semitones: number): string {
  if (!chordPro || semitones === 0) return chordPro
  // Only transpose text inside [brackets] — leave lyrics untouched
  return chordPro.replace(/\[([A-G][#b]?[a-z0-9susmajdim+\-#]*)\]/g, (full: string, chord: string) => {
    return `[${transposeChordName(chord, semitones)}]`
  })
}
