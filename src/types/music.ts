// TLK Hub v2.0 — Music Types
// Matches the schema in docs/TLK_Hub_Master_Handoff_v2.md

// ── Section Types ──────────────────────────────────────────────

export type SectionType =
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'hook'
  | 'post-chorus'
  | 'bridge'
  | 'breakdown'
  | 'musical-break'
  | 'instrumental'
  | 'tag'
  | 'solo'
  | 'outro'

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  'intro':           'Intro',
  'verse':           'Verse',
  'pre-chorus':      'Pre-Chorus',
  'chorus':          'Chorus',
  'hook':            'Hook',
  'post-chorus':     'Post-Chorus',
  'bridge':          'Bridge',
  'breakdown':       'Breakdown',
  'musical-break':   'Musical Break',
  'instrumental':    'Instrumental',
  'tag':             'Tag',
  'solo':            'Solo',
  'outro':           'Outro',
}

export const SECTION_TYPES: SectionType[] = [
  'intro', 'verse', 'pre-chorus', 'chorus', 'hook', 'post-chorus',
  'bridge', 'breakdown', 'musical-break', 'instrumental', 'tag', 'solo', 'outro',
]

// ── Drum Grid ──────────────────────────────────────────────────

export type DrumRowName =
  | 'kick' | 'snare' | 'hihat'
  | 'hitom1' | 'hitom2' | 'floortom'
  | 'crash' | 'splash' | 'ride'

export const DRUM_ROWS: DrumRowName[] = [
  'kick', 'snare', 'hihat',
  'hitom1', 'hitom2', 'floortom',
  'crash', 'splash', 'ride',
]

export const DRUM_ROW_LABELS: Record<DrumRowName, string> = {
  kick:     'KICK',
  snare:    'SNARE',
  hihat:    'HI-HAT',
  hitom1:   'HI-TOM 1',
  hitom2:   'HI-TOM 2',
  floortom: 'FLR TOM',
  crash:    'CRASH',
  splash:   'SPLASH',
  ride:     'RIDE',
}

export interface DrumGrid {
  bars: number
  subdivisions: number  // 8 or 16
  rows: Record<DrumRowName, number[]>
}

// ── Section Object (v2 — per handoff spec) ─────────────────────

export interface Section {
  id: string
  type: SectionType
  name: string
  order_index: number
  /** ChordPro-lite markup: [G]You came a-[Em]round when I [C]was low */
  chords: string
  lyrics: string
  guitar_tab: string
  bass_tab: string
  drum_grid: DrumGrid | null
  notes: string
  audio_url: string
}

// ── Song ───────────────────────────────────────────────────────

export type SongVisibility = 'private' | 'band' | 'public'

export interface Song {
  id: string
  user_id: string | null
  band_id: string | null
  title: string
  key: string | null
  bpm: number | null
  time_sig: string
  visibility: SongVisibility
  raw_lyrics: string
  sections: Section[]
  /** Optional version label — e.g. "Acoustic", "Live in D", "Boy's Key" */
  version_name: string
  /** If this is a variant of another song, link to the parent */
  parent_song_id: string | null
  /** Semitones this version is transposed from the original */
  transpose_delta: number
  created_at: string
  updated_at: string
}

// ── Setlist ────────────────────────────────────────────────────

export interface Setlist {
  id: string
  user_id: string | null
  name: string
  notes: string | null
  locked: boolean
  songs: SetlistEntry[]
  created_at: string
  updated_at: string
}

export interface SetlistEntry {
  song_id: string
  position: number
}

// ── Band ───────────────────────────────────────────────────────

export type InstrumentType = 'guitar_chords' | 'guitar_tab' | 'bass_tab' | 'drums'

export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  guitar_chords: 'Guitar (Chords/Lead Tab)',
  guitar_tab:    'Guitar (Tab)',
  bass_tab:      'Bass (Tab)',
  drums:         'Drums (Grid)',
}

export interface Band {
  id: string
  name: string | null
  created_at: string
}

export interface BandMember {
  id: string
  band_id: string
  user_id: string
  instrument: InstrumentType | null
  role: string | null
  created_at: string
}

// ── Song History ───────────────────────────────────────────────

export interface SongHistoryEntry {
  id: string
  song_id: string
  user_id: string
  snapshot: Section[]
  saved_at: string
}

// ── Scale Theory (for Phase 2) ─────────────────────────────────

export type ScaleType =
  | 'minor-pentatonic' | 'major-pentatonic' | 'blues'
  | 'natural-minor' | 'major' | 'dorian' | 'mixolydian' | 'harmonic-minor'

export interface Scale {
  name: string
  intervals: number[]
  degrees: string[]
}

export type GuitarFret = {
  string: number
  fret: number
  finger?: number
}
