// TLK Hub v2.0 — Database Types (Supabase)
// Matches the schema in supabase/migrations/001_v2_schema_and_rls.sql

import type { Section, SongVisibility, InstrumentType } from './music'

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string
          user_id: string | null
          band_id: string | null
          title: string
          key: string | null
          bpm: number | null
          time_sig: string
          visibility: SongVisibility
          raw_lyrics: string | null
          sections: Section[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          band_id?: string | null
          title: string
          key?: string | null
          bpm?: number | null
          time_sig?: string
          visibility?: SongVisibility
          raw_lyrics?: string | null
          sections?: Section[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          band_id?: string | null
          title?: string
          key?: string | null
          bpm?: number | null
          time_sig?: string
          visibility?: SongVisibility
          raw_lyrics?: string | null
          sections?: Section[]
          created_at?: string
          updated_at?: string
        }
      }
      setlists: {
        Row: {
          id: string
          user_id: string | null
          name: string
          notes: string | null
          locked: boolean
          songs: { song_id: string; position: number }[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          notes?: string | null
          locked?: boolean
          songs?: { song_id: string; position: number }[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          notes?: string | null
          locked?: boolean
          songs?: { song_id: string; position: number }[]
          created_at?: string
          updated_at?: string
        }
      }
      bands: {
        Row: {
          id: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          created_at?: string
        }
      }
      band_members: {
        Row: {
          id: string
          band_id: string
          user_id: string
          instrument: InstrumentType | null
          role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          band_id: string
          user_id: string
          instrument?: InstrumentType | null
          role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          band_id?: string
          user_id?: string
          instrument?: InstrumentType | null
          role?: string | null
          created_at?: string
        }
      }
      song_history: {
        Row: {
          id: string
          song_id: string
          user_id: string
          snapshot: Section[]
          saved_at: string
        }
        Insert: {
          id?: string
          song_id: string
          user_id: string
          snapshot?: Section[]
          saved_at?: string
        }
        Update: {
          id?: string
          song_id?: string
          user_id?: string
          snapshot?: Section[]
          saved_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          type: string
          date: string
          time: string | null
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          type: string
          date: string
          time?: string | null
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: string
          date?: string
          time?: string | null
          location?: string | null
          created_at?: string
        }
      }
    }
  }
}
