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

  // Score all 24 candidate keys using tonal-center weighting.
  // Each chord root in the candidate's diatonic set has a degree weight:
  //   I, V    = 4 (tonic + dominant — strongest)
  //   IV      = 3 (subdominant)
  //   ii, vi  = 2 (supertonic + submediant)
  //   iii, vii° = 1 (mediant + leading tone)
  // Final score = sum of (chord occurrences × its diatonic weight in this key).
  //
  // Tiebreak: prefer major over relative minor.
  type Cand = { key: string; score: number; isMajor: boolean; matched: string[] }
  const candidates: Cand[] = []

  // Build degree weight maps for each candidate key
  const DEGREE_WEIGHT_BY_QUALITY: Record<string, number> = {
    // tonic position (1st diatonic chord) gets 4, V gets 4
    // We'll assign by index for the 7 diatonic chords:
    // [I, ii, iii, IV, V, vi, vii°]
  }

  for (const isMajorPass of [true, false]) {
    const keys = isMajorPass ? Object.entries(MAJOR_SCALES) : Object.entries(MINOR_SCALES)
    for (const [key, diatonicChords] of keys) {
      // Build a map: chord root → diatonic weight for THIS key
      // Index 0=I (4), 1=ii (2), 2=iii (1), 3=IV (3), 4=V (4), 5=vi (2), 6=vii° (1)
      const weights = [4, 2, 1, 3, 4, 2, 1]
      const rootWeight = new Map<string, number>()
      diatonicChords.forEach((c, i) => {
        const m = c.match(/^([A-G][#b]?)/)
        if (!m) return
        const root = m[1]
        // If two diatonic chords share a root, keep the higher weight
        const w = weights[i] || 1
        const existing = rootWeight.get(root) || 0
        if (w > existing) rootWeight.set(root, w)
      })

      let score = 0
      const matched: string[] = []
      for (const [chord, count] of Object.entries(counts)) {
        const rootMatch = chord.match(/^([A-G][#b]?)/)
        if (!rootMatch) continue
        const root = rootMatch[1]
        const w = rootWeight.get(root) || 0
        if (w > 0) {
          score += count * w
          matched.push(chord)
        }
      }
      candidates.push({ key, score, isMajor: isMajorPass, matched })
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // major beats minor on tie
    if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1
    return 0
  })

  const winner = candidates[0]
  const bestKey = winner?.key ?? 'C'
  const bestMatched = winner?.matched ?? []
  // Confidence: inKeyCount / total (matches prior formulation)
  const totalChords = allChords.length
  const inKeyCount = bestMatched.reduce((acc, c) => acc + (counts[c] || 0), 0)
  const confidence = totalChords > 0 ? Math.min(1, inKeyCount / totalChords) : 0

  return { key: bestKey, confidence, chordCounts: counts, matchedChords: bestMatched }
}
