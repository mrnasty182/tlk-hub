import { supabase } from './supabase'

interface SetlistItem {
  id: string
  title: string
  key: string
  bpm: number
  timeSig: string
  sections: any[]
  rawLyrics?: string
  createdAt: number
  updatedAt: number
  order: number
}

export interface SavedSetlist {
  id: string
  name: string
  items: SetlistItem[]
  totalDuration: number
  createdAt: number
}

interface SetlistRow {
  id: string
  user_id: string
  name: string
  items: any
  total_duration: number
  created_at: string
}

export async function loadSetlists(userId: string): Promise<SavedSetlist[]> {
  // Load all setlists visible to this user (own + band-visible)
  const { data, error } = await supabase
    .from('setlists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading setlists:', error)
    return []
  }

  return (data || []).map((row: SetlistRow) => ({
    id: row.id,
    name: row.name,
    items: row.items || [],
    totalDuration: row.total_duration || 0,
    createdAt: new Date(row.created_at).getTime(),
  }))
}

export async function saveSetlist(setlist: SavedSetlist, userId: string): Promise<boolean> {
  // Look up band_id for this user
  let bandId: string | null = null
  const { data: member } = await supabase
    .from('band_members')
    .select('band_id')
    .eq('user_id', userId)
    .single()
  if (member?.band_id) bandId = member.band_id

  const { error } = await supabase.from('setlists').upsert({
    id: setlist.id,
    user_id: userId,
    name: setlist.name,
    items: setlist.items,
    total_duration: setlist.totalDuration,
    created_at: new Date(setlist.createdAt).toISOString(),
    band_id: bandId,
    visibility: bandId ? 'band' : 'private',
  }, {
    onConflict: 'id',
  })

  if (error) {
    console.error('Error saving setlist:', error)
    return false
  }
  return true
}

export async function deleteSetlist(setlistId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('setlists')
    .delete()
    .eq('id', setlistId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting setlist:', error)
    return false
  }
  return true
}

export async function migrateLocalStorageSetlistsToSupabase(userId: string): Promise<number> {
  const stored = localStorage.getItem('tlk-setlists-v2')
  if (!stored) return 0

  try {
    const setlists: SavedSetlist[] = JSON.parse(stored)
    let migrated = 0

    for (const setlist of setlists) {
      const ok = await saveSetlist(setlist, userId)
      if (ok) migrated++
    }

    return migrated
  } catch (e) {
    console.error('Migration error:', e)
    return 0
  }
}
