/**
 * Key auto-detection from chord names.
 *
 * Counts chord occurrences in the song, then scores each of the 12 major + 12 minor
 * keys by how many of its diatonic chords appear. Highest score wins.
 * Returns the candidate key plus a confidence score (0-1) based on how
 * dominant that key's chord set is vs the total.
 */

import { transposeChordName } from './chords'

// ── 12 major + 12 minor scales as sets of chord names (sharps) ───────

const MAJOR_SCALES: Record<string, string[]> = {
  'C':  ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
  'C#': ['C#', 'D#m', 'E#m', 'F#', 'G#', 'A#m', 'B#dim'],
  'D':  ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
  'D#': ['D#', 'E#m', 'F##m', 'G#', 'A#', 'Cm', 'Ddim'],
  'E':  ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
  'F':  ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
  'F#': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#dim'],
  'G':  ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
  'G#': ['G#', 'A#m', 'Cm', 'C#', 'D#', 'Fm', 'Gdim'],
  'A':  ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
  'A#': ['A#', 'Cm', 'Dm', 'D#', 'F', 'Gm', 'Adim'],
  'B':  ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
}

const MINOR_SCALES: Record<string, string[]> = Object.fromEntries(
  Object.entries(MAJOR_SCALES).map(([majKey, chords]) => {
    // Relative minor is a minor 3rd below the major
    const minorKey = transposeChordName(majKey, -3) + 'm'
    // Reuse the major key's diatonic chords — they're the same set
    return [minorKey, chords]
  })
)

const ALL_KEYS: Record<string, string[]> = { ...MAJOR_SCALES, ...MINOR_SCALES }

interface DetectResult {
  key: string
  confidence: number  // 0-1
  chordCounts: Record<string, number>
  matchedChords: string[]
}

/**
 * Detect the key of a song given the ChordPro strings from its sections.
 *
 * @param chordProStrings array of ChordPro strings (one per section)
 * @returns the most likely key + confidence
 */
export function detectKey(chordProStrings: string[]): DetectResult {
  // Tally chord occurrences
  const counts: Record<string, number> = {}
  const allChords: string[] = []
  for (const cps of chordProStrings) {
    if (!cps) continue
    // Match chord names like [G] or [Gm7] or [F#m]
    const matches = cps.match(/[A-G][#b]?[a-z0-9susmajdim+\-#]*/g)
    if (!matches) continue
    for (const m of matches) {
      counts[m] = (counts[m] || 0) + 1
      allChords.push(m)
    }
  }

  if (allChords.length === 0) {
    return { key: 'C', confidence: 0, chordCounts: counts, matchedChords: [] }
  }

  // Score each candidate key
  let bestKey = 'C'
  let bestScore = -1
  let bestMatched: string[] = []

  for (const [key, diatonicChords] of Object.entries(ALL_KEYS)) {
    // Normalize the diatonic chord names to root-only
    const diatonicRoots = diatonicChords.map(c => {
      const m = c.match(/^([A-G][#b]?)/)
      return m ? m[1] : c
    })

    let score = 0
    const matched: string[] = []
    for (const [chord, count] of Object.entries(counts)) {
      // Strip quality suffix to get just the root
      const rootMatch = chord.match(/^([A-G][#b]?)/)
      if (!rootMatch) continue
      const root = rootMatch[1]
      if (diatonicRoots.includes(root)) {
        score += count
        matched.push(chord)
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestKey = key
      bestMatched = matched
    }
  }

  // Confidence = matched chord count / total chord count
  const totalChords = allChords.length
  const confidence = totalChords > 0 ? Math.min(1, bestScore / totalChords) : 0

  return { key: bestKey, confidence, chordCounts: counts, matchedChords: bestMatched }
}
