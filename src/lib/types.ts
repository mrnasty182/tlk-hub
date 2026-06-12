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

export interface SongSection {
  id: string;
  type: SectionType;
  chordPro: string;
  lyrics: string[];
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