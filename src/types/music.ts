// Music theory types for TLK Hub

export type GuitarFret = {
  string: number // 1-6 (high E to low E)
  fret: number   // 0 = open, -1 = muted
  finger?: number
}

export type ChordDiagram = {
  chord: string
  root: string
  quality: string
  guitarPositions: GuitarFret[]
  pianoKeys: number[]
}

export type Scale = {
  name: string
  intervals: number[]
  degrees: string[]
}

export type ScalePosition = {
  position: number
  rootFrets: number[] // fret numbers where root notes occur
  notes: string[]     // all notes in this position
}

export type Song = {
  id: string
  title: string
  artist?: string
  key?: string
  bpm?: number
  chordPro: string
  sections: Section[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export type Section = {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'solo' | 'custom'
  label?: string
  lines: SectionLine[]
}

export type SectionLine = {
  chords?: string
  lyrics?: string
  comment?: string
}

export type Setlist = {
  id: string
  title: string
  notes?: string
  locked: boolean
  songs: SetlistSong[]
  createdAt: string
  updatedAt: string
}

export type SetlistSong = {
  id: string
  songId: string
  song: Song
  position: number
  notes?: string
}

export type Jam = {
  id: string
  title: string
  date: string
  notes?: string
  jamLink?: string
  practice: boolean
  attendees: JamAttendee[]
  createdAt: string
  updatedAt: string
}

export type JamAttendee = {
  id: string
  attendeeId: string
  attendee: Attendee
  attended: boolean
}

export type Attendee = {
  id: string
  name: string
  email?: string
}