export type SectionType =
  | 'Intro'
  | 'Verse'
  | 'Pre-Chorus'
  | 'Chorus'
  | 'Hook'
  | 'Post-Chorus'
  | 'Bridge'
  | 'Breakdown'
  | 'Musical Break'
  | 'Instrumental'
  | 'Tag'
  | 'Solo'
  | 'Outro';

export interface DrumGridData {
  bpm: number;
  timeSig: string;
  /** Map of instrument name (e.g. "Kick", "Snare", "Hi-Hat") to array of hit positions (0..15) */
  hits: Record<string, number[]>;
}

export interface SongSection {
  id: string;
  type: SectionType;
  chordPro: string;
  lyrics: string[];
  /** v2.0 fields */
  name?: string;
  guitarTab?: string;
  bassTab?: string;
  drumGrid?: DrumGridData;
  notes?: string;
  audioUrl?: string;
}

export interface Song {
  id: string;
  title: string;
  key: string;
  bpm: number;
  timeSig: string;
  sections: SongSection[];
  rawLyrics?: string;
  createdAt: number;
  updatedAt: number;
}