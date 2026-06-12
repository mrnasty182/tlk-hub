// Shared localStorage utilities for TLK Hub dashboard
// Used by dashboard and any other component that needs cross-page data

export interface StoredSong {
  id: string
  title: string
  key: string
  bpm: number
  timeSig: string
  sections: { id: string; type: string; chordPro: string; lyrics: string[] }[]
  createdAt: number
  updatedAt: number
}

export interface StoredEvent {
  id: string
  date: string // ISO date string
  type: 'rehearsal' | 'gig' | 'other'
  time: string
  notes: string
  venue?: string
}

const SONGS_KEY = 'tlk-songs-v2'
const EVENTS_KEY = 'tlk-events-v2'

export function getStoredSongs(): StoredSong[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SONGS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredSong[]
  } catch {
    return []
  }
}

export function getStoredEvents(): StoredEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredEvent[]
  } catch {
    return []
  }
}

export function saveStoredEvents(events: StoredEvent[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

// Default events for new users (matches INITIAL_EVENTS in JamCalendar)
export const DEFAULT_EVENTS: StoredEvent[] = [
  { id: '1', date: '2026-05-22', type: 'rehearsal', time: '7:00 PM', notes: 'Practice setlist for upcoming shows' },
  { id: '2', date: '2026-05-29', type: 'rehearsal', time: '7:00 PM', notes: 'New material run-through' },
  { id: '3', date: '2026-06-05', type: 'gig', time: '9:00 PM', notes: 'Main stage performance', venue: 'The Rusty Nail' },
]
