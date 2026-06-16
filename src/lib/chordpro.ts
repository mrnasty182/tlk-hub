// ChordPro-lite parser for TLK Hub
// Format: [G]You came a-[Em]round when I [C]was low
// Chords in brackets sit directly above the character they precede.

export interface ParsedChord {
  chord: string
  /** Character index in the lyric line where this chord sits */
  position: number
}

export interface ParsedLine {
  /** Raw text with chords stripped out */
  lyric: string
  chords: ParsedChord[]
}

/**
 * Parse a ChordPro-lite string into lines with positioned chords.
 * Handles inline [Chord] markup. Empty lines preserved.
 */
export function parseChordProLine(line: string): ParsedLine {
  const chords: ParsedChord[] = []
  let lyric = ''
  let i = 0

  while (i < line.length) {
    if (line[i] === '[') {
      // Find closing bracket
      const close = line.indexOf(']', i)
      if (close === -1) {
        // No closing bracket — treat as literal
        lyric += line[i]
        i++
        continue
      }
      const chord = line.slice(i + 1, close).trim()
      if (chord) {
        chords.push({ chord, position: lyric.length })
      }
      i = close + 1
    } else {
      lyric += line[i]
      i++
    }
  }

  return { lyric, chords }
}

/**
 * Parse a full ChordPro-lite block (multi-line) into structured lines.
 */
export function parseChordProBlock(text: string): ParsedLine[] {
  return text.split('\n').map(parseChordProLine)
}

/**
 * Convert a parsed line back to ChordPro-lite markup.
 */
export function toChordProLine(line: ParsedLine): string {
  if (line.chords.length === 0) return line.lyric

  let result = ''
  let lastPos = 0

  const sorted = [...line.chords].sort((a, b) => a.position - b.position)

  for (const { chord, position } of sorted) {
    result += line.lyric.slice(lastPos, position)
    result += `[${chord}]`
    lastPos = position
  }

  result += line.lyric.slice(lastPos)
  return result
}

/**
 * Parse freeform Write-mode text into sections.
 * Detects section headers: [Verse], [Chorus], [Bridge], etc.
 * or markdown-style: ## Verse 1
 * 
 * Lines before the first header go into an "Intro" or unnamed section.
 */
export function parseFreeformToSections(text: string): { type: string; name: string; content: string }[] {
  const lines = text.split('\n')
  const sections: { type: string; name: string; content: string }[] = []
  let current: { type: string; name: string; content: string } | null = null

  const headerPatterns = [
    /^\[(intro|verse|pre-chorus|chorus|hook|post-chorus|bridge|breakdown|musical break|instrumental|tag|solo|outro)\s*(\d*)\]/i,
    /^#{1,3}\s*(intro|verse|pre-chorus|chorus|hook|post-chorus|bridge|breakdown|musical break|instrumental|tag|solo|outro)\s*(\d*)/i,
  ]

  for (const line of lines) {
    let matched = false

    for (const pattern of headerPatterns) {
      const m = line.match(pattern)
      if (m) {
        const type = m[1].toLowerCase().replace(/\s+/g, '-')
        const num = m[2] || ''
        const name = num ? `${m[1]} ${num}` : m[1]

        if (current) sections.push(current)
        current = { type, name, content: '' }
        matched = true
        break
      }
    }

    if (!matched) {
      if (!current) {
        current = { type: 'verse', name: '', content: '' }
      }
      current.content += (current.content ? '\n' : '') + line
    }
  }

  if (current) sections.push(current)
  return sections.filter(s => s.content.trim() || s.name)
}

/**
 * Subdivisions per bar based on time signature.
 * 4/4 = 16 sixteenths, 3/4 = 12, 6/8 = 12 (or 24 if compound).
 */
export function subdivisionsForTimeSig(timeSig: string, subdivision: 8 | 16 = 16): number {
  const [beats, unit] = timeSig.split('/').map(Number)

  // Compound meter (6/8, 9/8, 12/8) — beat unit is the dotted eighth
  if (unit === 8 && beats % 3 === 0) {
    const dottedBeats = beats / 3
    return subdivision === 16 ? dottedBeats * 6 : dottedBeats * 3
  }

  // Simple meter
  return subdivision === 16 ? beats * 4 : beats * 2
}
