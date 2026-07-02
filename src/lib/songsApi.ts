import { supabase } from './supabase'
import type { Song } from './types'

export async function loadSongs(userId: string): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error loading songs from Supabase:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    key: row.key,
    bpm: row.bpm,
    timeSig: row.time_sig,
    sections: row.sections || [],
    rawLyrics: row.raw_lyrics || '',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }))
}

export async function saveSong(song: Song, userId: string): Promise<boolean> {
  const { error } = await supabase.from('songs').upsert({
    id: song.id,
    user_id: userId,
    title: song.title,
    key: song.key,
    bpm: song.bpm,
    time_sig: song.timeSig,
    sections: song.sections,
    raw_lyrics: song.rawLyrics || '',
    updated_at: new Date(song.updatedAt).toISOString(),
    created_at: new Date(song.createdAt).toISOString(),
  })

  if (error) {
    console.error('Error saving song:', error)
    return false
  }
  return true
}

export async function deleteSong(songId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting song:', error)
    return false
  }
  return true
}

export async function migrateLocalStorageToSupabase(userId: string): Promise<number> {
  const stored = localStorage.getItem('tlk-songs-v2')
  if (!stored) return 0

  try {
    const songs: Song[] = JSON.parse(stored)
    let migrated = 0

    for (const song of songs) {
      const success = await saveSong(song, userId)
      if (success) migrated++
    }

    return migrated
  } catch (e) {
    console.error('Migration error:', e)
    return 0
  }
}