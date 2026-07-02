'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Section, SectionType, Song } from '@/types/music'
import { SECTION_TYPES, SECTION_TYPE_LABELS } from '@/types/music'
import { createEmptySection } from '@/lib/sections'
import { parseFreeformToSections } from '@/lib/chordpro'
import { supabase } from '@/lib/supabase'
import { transposeChordName } from '@/lib/chords'
import { detectKey } from '@/lib/keyDetect'
import PerformanceView from '@/components/PerformanceView'
import ExportModal from '@/components/ExportModal'

// ── Demo songs with v2 section structure ───────────────────────

const DEMO_SONGS: Song[] = [
  {
    id: 'demo-1',
    user_id: null,
    band_id: null,
    title: 'A Quickenin\' in Their Loins',
    key: 'A',
    bpm: 124,
    time_sig: '4/4',
    visibility: 'private',
    raw_lyrics: '',
    version_name: '',
    parent_song_id: null,
    transpose_delta: 0,
    sections: [
      {
        id: 's1', type: 'verse', name: 'Verse 1', order_index: 0,
        chords: '[A]We don\'t stop when the [E]lights go down\n[F#m]We run it back like we [D]own this town',
        lyrics: 'We don\'t stop when the lights go down\nWe run it back like we own this town',
        guitar_tab: '', bass_tab: '', drum_grid: null, notes: '', audio_url: '',
      },
      {
        id: 's2', type: 'chorus', name: 'Chorus', order_index: 1,
        chords: '[D]Stay hard, stay [A]loud, stay [E]live\nWe are the [F#m]kings — we multi[E]ply',
        lyrics: 'Stay hard, stay loud, stay live\nWe are the kings — we multiply',
        guitar_tab: '', bass_tab: '', drum_grid: null, notes: '', audio_url: '',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    user_id: null,
    band_id: null,
    title: 'Grinder',
    key: 'E',
    bpm: 140,
    time_sig: '4/4',
    visibility: 'private',
    raw_lyrics: '',
    version_name: '',
    parent_song_id: null,
    transpose_delta: 0,
    sections: [
      {
        id: 's1', type: 'intro', name: 'Intro', order_index: 0,
        chords: '[E] [B] [E] [B]',
        lyrics: '',
        guitar_tab: 'e|----------------|\nB|----------------|\nG|----------------|\nD|----------------|\nA|-------2--0-----|\nE|-0--3--------3--|',
        bass_tab: '', drum_grid: null, notes: 'Heavy distortion', audio_url: '',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    user_id: null,
    band_id: null,
    title: 'Bear\'s Last Ride',
    key: 'Am',
    bpm: 90,
    time_sig: '6/8',
    visibility: 'private',
    raw_lyrics: '',
    version_name: '',
    parent_song_id: null,
    transpose_delta: 0,
    sections: [
      {
        id: 's1', type: 'verse', name: 'Verse 1', order_index: 0,
        chords: '[Am]Rolling down the [G]highway\n[F]Bear in the back[E]seat',
        lyrics: 'Rolling down the highway\nBear in the backseat',
        guitar_tab: '', bass_tab: '', drum_grid: null, notes: '6/8 feel', audio_url: '',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

type ViewMode = 'write' | 'arrange' | 'performance'

const LS_KEY = 'tlk-songs'

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>(DEMO_SONGS)
  const [selectedId, setSelectedId] = useState<string>(DEMO_SONGS[0].id)
  const [viewMode, setViewMode] = useState<ViewMode>('arrange')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showExport, setShowExport] = useState(false)
  const [tapTimes, setTapTimes] = useState<number[]>([])
  const [keySuggestion, setKeySuggestion] = useState<{ key: string; confidence: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([DEMO_SONGS[0].sections[0]?.id]))
  const [writeText, setWriteText] = useState('')
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  const selectedSong = songs.find(s => s.id === selectedId) ?? songs[0]

  // ── Song CRUD ──────────────────────────────────────────────

  const updateSong = useCallback((id: string, updates: Partial<Song>) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s))
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1500)
    }, 800)
  }, [])

  const addSong = useCallback(() => {
    const newSong: Song = {
      id: crypto.randomUUID(),
      user_id: null,
      band_id: null,
      title: 'New Song',
      key: 'A',
      bpm: 120,
      time_sig: '4/4',
      visibility: 'private',
      raw_lyrics: '',
      version_name: '',
      parent_song_id: null,
      transpose_delta: 0,
      sections: [createEmptySection('verse', 0)],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSongs(prev => [...prev, newSong])
    setSelectedId(newSong.id)
    setExpandedSections(new Set([newSong.sections[0].id]))
    setViewMode('arrange')
  }, [])

  const deleteSong = useCallback(async (id: string) => {
    if (!confirm('Delete this song permanently? This cannot be undone.')) return
    setSongs(prev => {
      const next = prev.filter(s => s.id !== id)
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? '')
      }
      return next
    })
    // Delete from Supabase
    try {
      const { error } = await supabase.from('songs').delete().eq('id', id)
      if (error) console.error('Delete failed:', error.message)
    } catch (e) {
      console.error('Delete error:', e)
    }
  }, [selectedId])

  // ── Section CRUD ───────────────────────────────────────────

  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    if (!selectedSong) return
    updateSong(selectedSong.id, {
      sections: selectedSong.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    })
  }, [selectedSong, updateSong])

  const addSection = useCallback((afterId?: string) => {
    if (!selectedSong) return
    const sections = selectedSong.sections
    let insertIndex = sections.length
    let orderIndex = sections.length

    if (afterId) {
      const idx = sections.findIndex(s => s.id === afterId)
      if (idx >= 0) {
        insertIndex = idx + 1
        orderIndex = sections[idx].order_index + 0.5
      }
    }

    const newSection = createEmptySection('verse', orderIndex)
    const newSections = [...sections]
    newSections.splice(insertIndex, 0, newSection)

    // Re-index
    newSections.forEach((s, i) => s.order_index = i)

    updateSong(selectedSong.id, { sections: newSections })
    setExpandedSections(prev => new Set([...prev, newSection.id]))
  }, [selectedSong, updateSong])

  const deleteSection = useCallback((sectionId: string) => {
    if (!selectedSong) return
    updateSong(selectedSong.id, {
      sections: selectedSong.sections.filter(s => s.id !== sectionId),
    })
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.delete(sectionId)
      return next
    })
  }, [selectedSong, updateSong])

  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    if (!selectedSong) return
    const sections = [...selectedSong.sections]
    const idx = sections.findIndex(s => s.id === sectionId)
    if (idx < 0) return

    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= sections.length) return

    ;[sections[idx], sections[swapWith]] = [sections[swapWith], sections[idx]]
    sections.forEach((s, i) => s.order_index = i)
    updateSong(selectedSong.id, { sections })
  }, [selectedSong, updateSong])

  // ── Write mode: Convert to Sections ────────────────────────

  const convertWriteToSections = useCallback(() => {
    if (!selectedSong || !writeText.trim()) return
    const parsed = parseFreeformToSections(writeText)
    if (parsed.length === 0) return

    const newSections: Section[] = parsed.map((p, i) => ({
      ...createEmptySection(p.type as SectionType, i),
      name: p.name,
      lyrics: p.content,
      chords: '',
    }))

    updateSong(selectedSong.id, { sections: newSections, raw_lyrics: writeText })
    setExpandedSections(new Set(newSections.map(s => s.id)))
    setViewMode('arrange')
  }, [selectedSong, writeText, updateSong])

  // ── Toggle section expand ──────────────────────────────────

  const toggleExpand = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }, [])

  // ── Sync write text when switching to write mode ───────────

  useEffect(() => {
    if (viewMode === 'write' && selectedSong) {
      setWriteText(selectedSong.raw_lyrics || '')
    }
  }, [viewMode, selectedId])

  // ── Load songs from Supabase on mount ────────────────────────

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      if (cancelled || error || !data) return

      const loaded: Song[] = data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        band_id: row.band_id,
        title: row.title,
        key: row.key,
        bpm: row.bpm,
        time_sig: row.time_sig,
        visibility: row.visibility,
        raw_lyrics: row.raw_lyrics || '',
        sections: row.sections || [],
        version_name: row.version_name || '',
        parent_song_id: row.parent_song_id || null,
        transpose_delta: row.transpose_delta ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))
      if (loaded.length > 0) {
        setSongs(loaded)
        setSelectedId(loaded[0].id)
        setExpandedSections(new Set([loaded[0].sections[0]?.id].filter(Boolean) as string[]))
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Persist song updates to Supabase ────────────────────────

  useEffect(() => {
    if (songs.length === 0) return
    const persist = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return
      // Only persist the currently selected song (avoid persisting during initial load)
      const sel = songs.find(s => s.id === selectedId)
      if (!sel) return
      // Skip demo songs (id starts with 'demo-')
      if (sel.id.startsWith('demo-')) return
      // For new songs (no user_id set), fetch the user's band_id so the song is band-shared by default
      let bandId = sel.band_id
      if (!bandId) {
        const { data: membership } = await supabase
          .from('band_members')
          .select('band_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()
        bandId = membership?.band_id ?? null
      }
      const { error } = await supabase.from('songs').upsert({
        id: sel.id,
        user_id: userId,
        title: sel.title,
        key: sel.key,
        bpm: sel.bpm,
        time_sig: sel.time_sig,
        sections: sel.sections,
        raw_lyrics: sel.raw_lyrics || '',
        version_name: sel.version_name || '',
        parent_song_id: sel.parent_song_id || null,
        transpose_delta: sel.transpose_delta ?? 0,
        visibility: bandId ? 'band' : (sel.visibility || 'private'),
        band_id: bandId,
        created_at: sel.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (error) {
        console.error('Persist failed for song', sel.id, ':', error.message)
      } else if (!sel.user_id) {
        // First-time save: update local state so band_id is set
        setSongs(prev => prev.map(s => s.id === sel.id ? { ...s, user_id: userId, band_id: bandId, visibility: bandId ? 'band' : s.visibility } : s))
      }
    }
    const timer = setTimeout(persist, 800)
    return () => clearTimeout(timer)
  }, [songs, selectedId])

  // ── Transpose ───────────────────────────────────────────────
  //
  // Transpose all section chords in the selected song by N semitones,
  // and shift the song's key by the same amount. Persists via the existing
  // debounced upsert.
  const transposeSong = useCallback((semitones: number) => {
    if (!selectedSong) return
    const newKey = transposeChordName(selectedSong.key || 'C', semitones)
    const newSections = selectedSong.sections.map(s => ({
      ...s,
      chords: s.chords
        ? s.chords.replace(/\[([A-G][#b]?[a-z0-9susmajdim+\-#]*)\]/g, (full: string, chord: string) => {
            const t = transposeChordName(chord, semitones)
            return `[${t}]`
          })
        : s.chords,
    }))
    updateSong(selectedSong.id, {
      key: newKey,
      sections: newSections,
      transpose_delta: (selectedSong.transpose_delta ?? 0) + semitones,
    })
  }, [selectedSong, updateSong])

  // ── Save as new version ─────────────────────────────────────
  //
  // Creates a new song row that links to this one via parent_song_id,
  // so the song library shows them grouped. User gives the version a name.
  const saveAsNewVersion = useCallback(async (label: string) => {
    if (!selectedSong) return
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return

    const parentId = selectedSong.parent_song_id ?? selectedSong.id
    const newId = crypto.randomUUID()
    const { error } = await supabase.from('songs').insert({
      id: newId,
      user_id: userId,
      band_id: selectedSong.band_id,
      title: selectedSong.title,
      key: selectedSong.key,
      bpm: selectedSong.bpm,
      time_sig: selectedSong.time_sig,
      visibility: selectedSong.visibility,
      raw_lyrics: selectedSong.raw_lyrics || '',
      sections: selectedSong.sections,
      version_name: label,
      parent_song_id: parentId,
      transpose_delta: selectedSong.transpose_delta ?? 0,
    })
    if (error) {
      console.error('saveAsNewVersion:', error)
      return
    }
    const newSong: Song = {
      ...selectedSong,
      id: newId,
      version_name: label,
      parent_song_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSongs(prev => [...prev, newSong])
    setSelectedId(newId)
    setViewMode('arrange')
  }, [selectedSong])

  // ── Versions of this song ───────────────────────────────────
  //
  // A "version group" is the parent_id (or self if no parent).
  const versionsOfSelected = useMemo(() => {
    if (!selectedSong) return []
    const groupId = selectedSong.parent_song_id ?? selectedSong.id
    return songs.filter(s =>
      s.id === groupId || s.parent_song_id === groupId
    )
  }, [songs, selectedSong])

  // ── Library search ──────────────────────────────────────────
  //
  // Filters songs by title + key + chord names + section names + version name.
  // Empty query → show all. Case-insensitive substring match.
  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return songs
    return songs.filter(s => {
      // Title
      if (s.title.toLowerCase().includes(q)) return true
      // Key
      if ((s.key || '').toLowerCase().includes(q)) return true
      // Version name
      if ((s.version_name || '').toLowerCase().includes(q)) return true
      // Sections: chords + lyrics + name
      for (const sec of s.sections) {
        if ((sec.name || '').toLowerCase().includes(q)) return true
        if (sec.chords && sec.chords.toLowerCase().includes(q)) return true
        if (sec.lyrics && sec.lyrics.toLowerCase().includes(q)) return true
        if (sec.notes && sec.notes.toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [songs, searchQuery])

  // ── Tap tempo ───────────────────────────────────────────────
  //
  // Tap the big button. We average the intervals between the last N taps (up to 8)
  // and convert to BPM. Reset if the user pauses more than 2 seconds.
  const TAP_WINDOW_MS = 2000
  const handleTap = useCallback(() => {
    const now = Date.now()
    setTapTimes(prev => {
      const filtered = prev.filter(t => now - t < TAP_WINDOW_MS)
      const next = [...filtered, now].slice(-8)
      if (next.length < 2) return next
      // Average interval
      let total = 0
      for (let i = 1; i < next.length; i++) total += next[i] - next[i - 1]
      const avgMs = total / (next.length - 1)
      const bpm = Math.round(60000 / avgMs)
      if (bpm >= 40 && bpm <= 300 && selectedSong) {
        updateSong(selectedSong.id, { bpm })
      }
      return next
    })
  }, [selectedSong, updateSong])

  // ── Key auto-detect ─────────────────────────────────────────
  //
  // Scan all section chords, return the most likely key. Show a confirmation
  // banner with confidence — user clicks to accept, or dismisses.
  const handleDetectKey = useCallback(() => {
    if (!selectedSong) return
    const chordProStrings = selectedSong.sections.map(s => s.chords).filter(Boolean)
    const result = detectKey(chordProStrings)
    if (result.chordCounts && Object.keys(result.chordCounts).length === 0) {
      setKeySuggestion({ key: '—', confidence: 0 })
      return
    }
    setKeySuggestion({ key: result.key, confidence: result.confidence })
  }, [selectedSong])

  const acceptKeySuggestion = useCallback(() => {
    if (keySuggestion && selectedSong && keySuggestion.key !== '—') {
      updateSong(selectedSong.id, { key: keySuggestion.key })
    }
    setKeySuggestion(null)
  }, [keySuggestion, selectedSong, updateSong])

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="songs-page-v2">
      <style>{styles}</style>

      <div className="editor-layout">
        {/* ── Left Sidebar: Song Library ── */}
        <aside className="song-sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">SONGS</span>
            <button className="new-song-btn" onClick={addSong}>+ NEW</button>
          </div>
          <div className="sidebar-search">
            <input
              type="search"
              className="search-input"
              placeholder="🔍 search title, key, chord, lyric…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >✕</button>
            )}
          </div>
          <div className="song-list">
            {filteredSongs.length === 0 ? (
              <div className="song-empty">No songs match "{searchQuery}"</div>
            ) : (
              filteredSongs.map(song => (
                <div
                  key={song.id}
                  className={`song-item ${selectedId === song.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(song.id)}
                >
                  <div className="song-item-title">
                    {song.title}
                    {song.version_name && (
                      <span className="song-item-version">{song.version_name}</span>
                    )}
                  </div>
                  <div className="song-item-meta">
                    <span className="meta-key">{song.key}</span>
                    <span className="meta-bpm">{song.bpm} BPM</span>
                    <span className="meta-sig">{song.time_sig}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Main Editor Area ── */}
        <main className="editor-main">
          {/* Top Bar */}
          <div className="editor-topbar">
            <div className="topbar-left">
              <input
                className="song-title-input"
                value={selectedSong?.title ?? ''}
                onChange={e => updateSong(selectedSong.id, { title: e.target.value })}
                placeholder="Untitled"
              />
              {selectedSong?.version_name && (
                <span className="version-badge" title={`Version: ${selectedSong.version_name}`}>
                  {selectedSong.version_name}
                </span>
              )}
            </div>

            <div className="topbar-meta">
              <select
                className="meta-select"
                value={selectedSong?.key ?? ''}
                onChange={e => updateSong(selectedSong.id, { key: e.target.value })}
              >
                {(() => {
                  const roots = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
                  const opts: string[] = []
                  for (const r of roots) {
                    opts.push(r)
                    opts.push(r + ' major')
                    opts.push(r + ' minor')
                  }
                  return opts.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))
                })()}
              </select>
              <button
                className="detect-key-btn"
                onClick={handleDetectKey}
                title="Guess the key from the chord progression"
              >🔍</button>

              <div className="bpm-control">
                <label>BPM</label>
                <input
                  type="number"
                  className="bpm-input"
                  value={selectedSong?.bpm ?? 120}
                  onChange={e => updateSong(selectedSong.id, { bpm: parseInt(e.target.value) || 120 })}
                  min={40}
                  max={300}
                />
                <button
                  className="tap-btn"
                  onClick={handleTap}
                  title="Tap to set tempo (4+ taps)"
                >TAP</button>
              </div>

              <select
                className="meta-select"
                value={selectedSong?.time_sig ?? '4/4'}
                onChange={e => updateSong(selectedSong.id, { time_sig: e.target.value })}
              >
                {['4/4','3/4','6/8','2/4','5/4','7/8'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="topbar-right">
              <div className="transpose-controls">
                <button
                  className="transpose-btn"
                  onClick={() => transposeSong(-1)}
                  title="Down 1 semitone"
                >−1</button>
                <button
                  className="transpose-btn transpose-bigger"
                  onClick={() => transposeSong(-2)}
                  title="Down whole step"
                >−2</button>
                <span className="transpose-delta" title="Total semitones from original">
                  {selectedSong?.transpose_delta ? `${selectedSong.transpose_delta > 0 ? '+' : ''}${selectedSong.transpose_delta}` : '0'}
                </span>
                <button
                  className="transpose-btn transpose-bigger"
                  onClick={() => transposeSong(2)}
                  title="Up whole step"
                >+2</button>
                <button
                  className="transpose-btn"
                  onClick={() => transposeSong(1)}
                  title="Up 1 semitone"
                >+1</button>
              </div>

              {versionsOfSelected.length > 1 && (
                <select
                  className="version-picker"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  title="Switch between versions of this song"
                >
                  {versionsOfSelected.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.version_name || 'Original'}
                      {v.transpose_delta ? ` (${v.transpose_delta > 0 ? '+' : ''}${v.transpose_delta})` : ''}
                    </option>
                  ))}
                </select>
              )}

              <button
                className="save-version-btn"
                onClick={() => {
                  const label = window.prompt(
                    'Name this version (e.g. "Acoustic", "Live in D", "Boy\'s Key"):',
                    ''
                  )
                  if (label && label.trim()) saveAsNewVersion(label.trim())
                }}
                title="Save the current key/chord changes as a new version"
              >+ VERSION</button>

              <button
                className="export-btn"
                onClick={() => setShowExport(true)}
                title="Export to PDF or Word"
              >📄 EXPORT</button>

              <button
                className="delete-song-btn"
                onClick={() => selectedSong && deleteSong(selectedSong.id)}
                title="Delete this song permanently"
              >🗑 DELETE</button>

              <div className="view-toggle">
                {(['write', 'arrange', 'performance'] as ViewMode[]).map(mode => (
                  <button
                    key={mode}
                    className={`view-btn ${viewMode === mode ? 'active' : ''}`}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="save-indicator">
                {saveState === 'idle' && <span className="save-idle">✓ Saved</span>}
                {saveState === 'saving' && <span className="save-saving">Saving...</span>}
                {saveState === 'saved' && <span className="save-saved">✓ Saved</span>}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="editor-content">
            {viewMode === 'write' && (
              <WriteMode
                text={writeText}
                onChange={setWriteText}
                onConvert={convertWriteToSections}
              />
            )}

            {viewMode === 'arrange' && (
              <ArrangeMode
                song={selectedSong}
                expandedSections={expandedSections}
                onToggleExpand={toggleExpand}
                onUpdateSection={updateSection}
                onAddSection={addSection}
                onDeleteSection={deleteSection}
                onMoveSection={moveSection}
              />
            )}

            {viewMode === 'performance' && selectedSong && (
              <PerformanceView
                song={{
                  id: selectedSong.id,
                  title: selectedSong.title,
                  key: selectedSong.key || 'C',
                  bpm: selectedSong.bpm || 120,
                  timeSig: selectedSong.time_sig || '4/4',
                  sections: selectedSong.sections.map(s => ({
                    id: s.id,
                    type: s.type,
                    name: s.name,
                    chordPro: s.chords,
                    lyrics: typeof s.lyrics === 'string' ? s.lyrics.split('\n').filter(l => l.trim()) : (s.lyrics || []),
                    drumGrid: s.drum_grid,
                  })),
                }}
                onExit={() => setViewMode('arrange')}
              />
            )}
          </div>
        </main>
      </div>

      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        song={selectedSong}
      />

      {keySuggestion && (
        <div className="key-suggestion-banner">
          {keySuggestion.key === '—' ? (
            <>
              <span>🔍 No chords found to detect a key from.</span>
              <button onClick={() => setKeySuggestion(null)}>✕</button>
            </>
          ) : (
            <>
              <span>🔍 Looks like <strong>{keySuggestion.key}</strong> ({Math.round(keySuggestion.confidence * 100)}% confidence)</span>
              <button className="key-accept-btn" onClick={acceptKeySuggestion}>✓ Use {keySuggestion.key}</button>
              <button onClick={() => setKeySuggestion(null)}>✕</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// WRITE MODE — Freeform scratchpad
// ═══════════════════════════════════════════════════════════════

function WriteMode({ text, onChange, onConvert }: {
  text: string
  onChange: (text: string) => void
  onConvert: () => void
}) {
  return (
    <div className="write-mode">
      <div className="write-header">
        <span className="write-hint">Type first. Structure later. Drop [Verse], [Chorus], etc. as you go.</span>
        <button className="convert-btn" onClick={onConvert} disabled={!text.trim()}>
          ⚡ Convert to Sections
        </button>
      </div>
      <textarea
        className="write-textarea"
        value={text}
        onChange={e => onChange(e.target.value)}
        placeholder={`[Verse 1]\nSlam lyrics here...\n\n[Chorus]\nHook goes here...`}
        autoFocus
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ARRANGE MODE — Accordion editor
// ═══════════════════════════════════════════════════════════════

function ArrangeMode({ song, expandedSections, onToggleExpand, onUpdateSection, onAddSection, onDeleteSection, onMoveSection }: {
  song: Song
  expandedSections: Set<string>
  onToggleExpand: (id: string) => void
  onUpdateSection: (id: string, updates: Partial<Section>) => void
  onAddSection: (afterId?: string) => void
  onDeleteSection: (id: string) => void
  onMoveSection: (id: string, dir: 'up' | 'down') => void
}) {
  if (!song) return <div className="empty-state">No song yet. Write something.</div>

  return (
    <div className="arrange-mode">
      {song.sections.map((section, idx) => {
        const isExpanded = expandedSections.has(section.id)
        return (
          <div key={section.id} className="section-accordion">
            {/* Header */}
            <div className="section-header" onClick={() => onToggleExpand(section.id)}>
              <div className="section-header-left">
                <button
                  className="drag-handle"
                  onClick={e => { e.stopPropagation() }}
                  title="Drag to reorder"
                >⠿</button>
                <span className="section-type-badge" data-type={section.type}>
                  {SECTION_TYPE_LABELS[section.type]}
                </span>
                {section.name && <span className="section-name-text">{section.name}</span>}
              </div>
              <div className="section-header-right">
                <div className="section-reorder">
                  <button onClick={e => { e.stopPropagation(); onMoveSection(section.id, 'up') }} disabled={idx === 0}>▲</button>
                  <button onClick={e => { e.stopPropagation(); onMoveSection(section.id, 'down') }} disabled={idx === song.sections.length - 1}>▼</button>
                </div>
                <button
                  className="section-delete"
                  onClick={e => { e.stopPropagation(); onDeleteSection(section.id) }}
                  title="Delete section"
                >✕</button>
                <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▸</span>
              </div>
            </div>

            {/* Body */}
            {isExpanded && (
              <div className="section-body">
                {/* Type + Name row */}
                <div className="section-meta-row">
                  <select
                    className="section-type-select"
                    value={section.type}
                    onChange={e => onUpdateSection(section.id, { type: e.target.value as SectionType })}
                  >
                    {SECTION_TYPES.map(t => (
                      <option key={t} value={t}>{SECTION_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                  <input
                    className="section-name-input"
                    value={section.name}
                    onChange={e => onUpdateSection(section.id, { name: e.target.value })}
                    placeholder="Optional name (e.g. Verse 2, Josh's Hook)"
                  />
                </div>

                {/* Lyrics */}
                <div className="field-group">
                  <label className="field-label">Lyrics</label>
                  <textarea
                    className="field-textarea lyrics-area"
                    value={section.lyrics}
                    onChange={e => onUpdateSection(section.id, { lyrics: e.target.value })}
                    placeholder="You came around when I was low..."
                    rows={4}
                  />
                </div>

                {/* Chords (ChordPro-lite) */}
                <div className="field-group">
                  <label className="field-label">Chords <span className="field-hint">[G]bracket[A]notation</span></label>
                  <textarea
                    className="field-textarea chords-area"
                    value={section.chords}
                    onChange={e => onUpdateSection(section.id, { chords: e.target.value })}
                    placeholder="[G]You came a-[Em]round when I [C]was low"
                    rows={3}
                  />
                </div>

                {/* Guitar Tab */}
                <div className="field-group">
                  <label className="field-label">🎸 Guitar Tab <span className="field-hint">6-string</span></label>
                  <textarea
                    className="field-textarea tab-area guitar-tab"
                    value={section.guitar_tab}
                    onChange={e => onUpdateSection(section.id, { guitar_tab: e.target.value })}
                    placeholder={'e|--------|\nB|--------|\nG|--------|\nD|--------|\nA|--------|\nE|--------|'}
                    rows={7}
                    spellCheck={false}
                  />
                </div>

                {/* Bass Tab */}
                <div className="field-group">
                  <label className="field-label">🎸 Bass Tab <span className="field-hint">4-string</span></label>
                  <textarea
                    className="field-textarea tab-area bass-tab"
                    value={section.bass_tab}
                    onChange={e => onUpdateSection(section.id, { bass_tab: e.target.value })}
                    placeholder={'G|--------|\nD|--------|\nA|--------|\nE|--------|'}
                    rows={5}
                    spellCheck={false}
                  />
                </div>

                {/* Notes */}
                <div className="field-group">
                  <label className="field-label">Notes</label>
                  <textarea
                    className="field-textarea notes-area"
                    value={section.notes}
                    onChange={e => onUpdateSection(section.id, { notes: e.target.value })}
                    placeholder="Production ideas, vibe notes..."
                    rows={2}
                  />
                </div>

                {/* Add section after */}
                <button className="add-section-btn" onClick={() => onAddSection(section.id)}>
                  + Add Section After
                </button>
              </div>
            )}
          </div>
        )
      })}

      {song.sections.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🎵</span>
          <span>No songs yet. Write something.</span>
          <button className="add-section-btn center" onClick={() => onAddSection()}>+ Add First Section</button>
        </div>
      )}

      <button className="add-section-btn bottom" onClick={() => onAddSection()}>
        + Add Section
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE MODE — chord-above-lyric, auto-scroll
// ═══════════════════════════════════════════════════════════════

function PerformanceMode({ song, onExit }: {
  song: Song
  onExit: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const rafRef = useRef<number | null>(null)

  const toggleScroll = useCallback(() => {
    setIsScrolling(prev => !prev)
  }, [])

  useEffect(() => {
    if (!isScrolling) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    let lastTime = performance.now()
    const tick = (time: number) => {
      const dt = time - lastTime
      lastTime = time

      if (scrollRef.current) {
        scrollRef.current.scrollTop += (scrollSpeed * dt) / 16
      }

      // Check if scrolled to bottom
      if (scrollRef.current && scrollRef.current.scrollTop >= scrollRef.current.scrollHeight - scrollRef.current.clientHeight) {
        setIsScrolling(false)
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isScrolling, scrollSpeed])

  // Tap to pause/resume
  const handleTap = useCallback(() => {
    toggleScroll()
  }, [toggleScroll])

  return (
    <div className="performance-mode" onClick={handleTap}>
      {/* Minimal top bar */}
      <div className="perf-topbar">
        <button className="perf-exit" onClick={(e) => { e.stopPropagation(); onExit() }}>✕ EXIT</button>
        <span className="perf-title">{song.title}</span>
        <div className="perf-meta-pills">
          <span className="perf-pill">{song.key}</span>
          <span className="perf-pill">{song.bpm} BPM</span>
          <span className="perf-pill">{song.time_sig}</span>
        </div>
        <div className="perf-speed" onClick={e => e.stopPropagation()}>
          <button onClick={() => setScrollSpeed(s => Math.max(0.3, s - 0.1))}>−</button>
          <span>{Math.round(scrollSpeed * 100)}%</span>
          <button onClick={() => setScrollSpeed(s => Math.min(3, s + 0.1))}>+</button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="perf-scroll" ref={scrollRef}>
        {song.sections.map(section => {
          const lines = section.lyrics.split('\n').filter(l => l.trim() || true)
          return (
            <div key={section.id} className="perf-section">
              <div className="perf-section-header">
                <span className="perf-section-type">{SECTION_TYPE_LABELS[section.type]}</span>
                {section.name && <span className="perf-section-name">{section.name}</span>}
              </div>
              <div className="perf-lines">
                {lines.map((line, i) => (
                  <PerfLine key={i} line={line} chords={section.chords} lineIndex={i} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating play indicator */}
      <div className="perf-play-indicator">
        {isScrolling ? '⏸ TAP TO PAUSE' : '▶ TAP TO SCROLL'}
      </div>
    </div>
  )
}

// Render a single performance line with chord-above-lyric
function PerfLine({ line, chords, lineIndex }: {
  line: string
  chords: string
  lineIndex: number
}) {
  // Parse the chord line that corresponds to this lyric line
  // Chords are stored as ChordPro-lite in the chords field
  // We match by line index
  const chordLines = chords.split('\n')
  const matchingChordLine = chordLines[lineIndex] || ''

  // Parse [G]text[Em]more into positioned chords
  const chordPositions: { chord: string; pos: number }[] = []
  let strippedChord = ''
  let ci = 0
  while (ci < matchingChordLine.length) {
    if (matchingChordLine[ci] === '[') {
      const close = matchingChordLine.indexOf(']', ci)
      if (close > ci) {
        chordPositions.push({
          chord: matchingChordLine.slice(ci + 1, close),
          pos: strippedChord.length,
        })
        ci = close + 1
        continue
      }
    }
    strippedChord += matchingChordLine[ci]
    ci++
  }

  // If no chords, just render the lyric line
  if (chordPositions.length === 0) {
    return (
      <div className="perf-line">
        <span className="perf-lyric-only">{line || '\u00A0'}</span>
      </div>
    )
  }

  // Build segments with chord-above-lyric
  const segments: { chord?: string; text: string }[] = []
  let lastPos = 0

  for (const { chord, pos } of chordPositions) {
    const textSegment = line.slice(lastPos, pos)
    segments.push({ text: textSegment })
    segments.push({ chord, text: '' })
    lastPos = pos
  }
  segments.push({ text: line.slice(lastPos) })

  return (
    <div className="perf-line">
      <div className="perf-chord-lyric-row">
        {segments.map((seg, i) => (
          <span key={i} className="perf-segment">
            {seg.chord && <span className="perf-chord">{seg.chord}</span>}
            <span className="perf-lyric">{seg.text || (seg.chord ? '\u00A0' : '')}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = `
  .songs-page-v2 {
    height: 100vh;
    display: flex;
    overflow: hidden;
    background: var(--lk-black);
    color: var(--lk-white);
    font-family: var(--font-body);
  }

  .editor-layout {
    display: flex;
    width: 100%;
    height: 100%;
  }

  /* ── Song Sidebar ── */
  .song-sidebar {
    width: 280px;
    flex-shrink: 0;
    background: var(--lk-void);
    border-right: 1px solid var(--lk-subtle);
    display: flex;
    flex-direction: column;
  }
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--lk-subtle);
  }
  .sidebar-title {
    font-family: var(--font-heading);
    font-size: 11px;
    letter-spacing: 2px;
    color: var(--lk-muted);
  }
  .new-song-btn {
    padding: 6px 14px;
    background: var(--lk-pink);
    color: var(--lk-black);
    border: none;
    border-radius: 6px;
    font-family: var(--font-heading);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .new-song-btn:hover { opacity: 0.85; }
  .song-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  .song-item {
    padding: 12px 14px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 4px;
    border: 1px solid transparent;
    transition: all 0.15s;
  }
  .song-item:hover {
    background: var(--lk-deep);
  }
  .song-item.active {
    background: rgba(255, 45, 155, 0.1);
    border-color: var(--lk-pink);
  }
  .song-item-title {
    font-family: var(--font-heading);
    font-size: 14px;
    color: var(--lk-white);
    margin-bottom: 4px;
  }
  .song-item-meta {
    display: flex;
    gap: 10px;
    font-family: var(--font-mono);
    font-size: 10px;
  }
  .meta-key { color: var(--lk-gold); }
  .meta-bpm { color: var(--lk-teal); }
  .meta-sig { color: var(--lk-muted); }

  /* ── Main Editor ── */
  .editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Top Bar */
  .editor-topbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 24px;
    border-bottom: 1px solid var(--lk-subtle);
    background: var(--lk-void);
    flex-shrink: 0;
  }
  .topbar-left {
    flex: 1;
    min-width: 0;
  }
  .song-title-input {
    width: 100%;
    background: transparent;
    border: none;
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--lk-white);
    outline: none;
  }
  .song-title-input::placeholder {
    color: var(--lk-muted);
  }
  .topbar-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .meta-select {
    background: var(--lk-deep);
    border: 1px solid var(--lk-subtle);
    border-radius: 6px;
    padding: 6px 10px;
    color: var(--lk-teal);
    font-family: var(--font-mono);
    font-size: 13px;
    cursor: pointer;
    outline: none;
  }
  .meta-select:focus { border-color: var(--lk-teal); }
  .bpm-control {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bpm-control label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--lk-muted);
    letter-spacing: 1px;
  }
  .bpm-input {
    width: 56px;
    background: var(--lk-deep);
    border: 1px solid var(--lk-subtle);
    border-radius: 6px;
    padding: 6px 8px;
    color: var(--lk-teal);
    font-family: var(--font-mono);
    font-size: 13px;
    text-align: center;
    outline: none;
  }
  .bpm-input:focus { border-color: var(--lk-teal); }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .view-toggle {
    display: flex;
    background: var(--lk-deep);
    border-radius: 8px;
    padding: 3px;
  }
  .view-btn {
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: var(--lk-muted);
    font-family: var(--font-heading);
    font-size: 11px;
    letter-spacing: 1px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .view-btn:hover { color: var(--lk-white); }
  .view-btn.active {
    background: var(--lk-pink);
    color: var(--lk-black);
  }
  .save-indicator {
    min-width: 80px;
    text-align: right;
    font-size: 11px;
    font-family: var(--font-mono);
  }
  .save-idle, .save-saved { color: var(--lk-teal); }
  .save-saving { color: var(--lk-muted); }

  /* ── Transpose + Version Controls ── */
  .version-badge {
    display: inline-block;
    margin-left: 12px;
    padding: 3px 10px;
    background: var(--lk-violet);
    color: var(--lk-white);
    border-radius: 12px;
    font-size: 10px;
    font-family: var(--font-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    vertical-align: middle;
  }
  .transpose-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
  }
  .transpose-btn {
    background: var(--lk-black);
    border: 1px solid var(--lk-pink);
    color: var(--lk-pink);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    min-width: 32px;
    transition: background 0.1s, color 0.1s;
  }
  .transpose-btn:hover {
    background: var(--lk-pink);
    color: var(--lk-black);
  }
  .transpose-bigger { font-size: 13px; }
  .transpose-delta {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--lk-teal);
    min-width: 24px;
    text-align: center;
    padding: 0 4px;
  }
  .version-picker {
    background: var(--lk-black);
    border: 1px solid var(--lk-violet);
    color: var(--lk-white);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    max-width: 140px;
  }
  .save-version-btn {
    background: transparent;
    border: 1px dashed var(--lk-gold);
    color: var(--lk-gold);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    letter-spacing: 0.05em;
  }
  .save-version-btn:hover {
    background: var(--lk-gold);
    color: var(--lk-black);
  }
  .delete-song-btn {
    background: transparent;
    border: 1px solid rgba(255, 45, 155, 0.3);
    color: rgba(255, 45, 155, 0.7);
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
    letter-spacing: 0.05em;
    padding: 6px 10px;
    transition: all 0.15s;
    max-width: 140px;
  }
  .delete-song-btn:hover {
    border-color: var(--lk-pink);
    color: var(--lk-pink);
    background: rgba(255, 45, 155, 0.05);
  }
  .tap-btn {
    background: var(--lk-black);
    border: 1px solid var(--lk-teal);
    color: var(--lk-teal);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    letter-spacing: 0.05em;
    min-width: 44px;
    min-height: 28px;
    user-select: none;
  }
  .tap-btn:active, .tap-btn.tapping {
    background: var(--lk-teal);
    color: var(--lk-black);
    transform: scale(0.95);
  }
  .detect-key-btn {
    background: var(--lk-black);
    border: 1px solid var(--lk-violet);
    color: var(--lk-violet);
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    min-width: 36px;
    min-height: 32px;
  }
  .detect-key-btn:hover {
    background: var(--lk-violet);
    color: var(--lk-white);
  }
  .key-suggestion-banner {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--lk-violet);
    color: var(--lk-white);
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 1000;
    font-family: var(--font-mono);
    font-size: 13px;
  }
  .key-suggestion-banner strong {
    color: var(--lk-gold);
    font-size: 16px;
  }
  .key-suggestion-banner button {
    background: transparent;
    border: 1px solid var(--lk-white);
    color: var(--lk-white);
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 11px;
  }
  .key-accept-btn {
    background: var(--lk-teal) !important;
    color: var(--lk-black) !important;
    border-color: var(--lk-teal) !important;
    font-weight: 700;
  }

  /* ── Sidebar Search ── */
  .sidebar-search {
    padding: 0 14px 10px;
    position: relative;
  }
  .search-input {
    width: 100%;
    background: var(--lk-black);
    border: 1px solid var(--lk-subtle);
    color: var(--lk-white);
    padding: 8px 32px 8px 10px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .search-input:focus {
    outline: none;
    border-color: var(--lk-pink);
  }
  .search-input::placeholder {
    color: var(--lk-muted);
  }
  .search-clear {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--lk-muted);
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
  }
  .search-clear:hover { color: var(--lk-pink); }
  .song-empty {
    color: var(--lk-muted);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 16px;
    text-align: center;
    font-style: italic;
  }
  .song-item-version {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 6px;
    background: var(--lk-violet);
    color: var(--lk-white);
    border-radius: 8px;
    font-size: 9px;
    font-family: var(--font-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    vertical-align: middle;
  }

  /* Content Area */
  .editor-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ── Write Mode ── */
  .write-mode {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    overflow: hidden;
  }
  .write-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .write-hint {
    color: var(--lk-muted);
    font-size: 13px;
  }
  .convert-btn {
    padding: 10px 20px;
    background: var(--lk-teal);
    color: var(--lk-black);
    border: none;
    border-radius: 8px;
    font-family: var(--font-heading);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .convert-btn:hover { opacity: 0.85; }
  .convert-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .write-textarea {
    flex: 1;
    background: var(--lk-void);
    border: 1px solid var(--lk-subtle);
    border-radius: 12px;
    padding: 24px;
    color: var(--lk-white);
    font-family: var(--font-body);
    font-size: 18px;
    line-height: 1.8;
    resize: none;
    outline: none;
  }
  .write-textarea:focus { border-color: var(--lk-pink); }
  .write-textarea::placeholder { color: var(--lk-muted); }

  /* ── Arrange Mode ── */
  .arrange-mode {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px 48px;
  }

  /* Section Accordion */
  .section-accordion {
    background: var(--lk-void);
    border: 1px solid var(--lk-subtle);
    border-radius: 12px;
    margin-bottom: 8px;
    overflow: hidden;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .section-header:hover { background: var(--lk-deep); }
  .section-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .drag-handle {
    background: none;
    border: none;
    color: var(--lk-muted);
    cursor: grab;
    font-size: 16px;
    padding: 4px;
  }
  .section-type-badge {
    font-family: var(--font-heading);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 4px;
    background: rgba(255, 45, 155, 0.15);
    color: var(--lk-pink);
  }
  .section-type-badge[data-type="chorus"] { background: rgba(0, 229, 204, 0.15); color: var(--lk-teal); }
  .section-type-badge[data-type="bridge"] { background: rgba(240, 192, 64, 0.15); color: var(--lk-gold); }
  .section-type-badge[data-type="intro"] { background: rgba(155, 79, 222, 0.15); color: #9B4FDE; }
  .section-type-badge[data-type="solo"] { background: rgba(123, 47, 190, 0.15); color: var(--lk-violet); }
  .section-name-text {
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--lk-muted);
  }
  .section-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-reorder {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .section-reorder button {
    background: none;
    border: none;
    color: var(--lk-muted);
    cursor: pointer;
    font-size: 10px;
    padding: 2px;
  }
  .section-reorder button:hover:not(:disabled) { color: var(--lk-teal); }
  .section-reorder button:disabled { opacity: 0.3; cursor: default; }
  .section-delete {
    background: none;
    border: none;
    color: var(--lk-muted);
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
  }
  .section-delete:hover { color: var(--lk-pink); }
  .expand-arrow {
    color: var(--lk-muted);
    font-size: 14px;
    transition: transform 0.2s;
  }
  .expand-arrow.expanded { transform: rotate(90deg); }

  /* Section Body */
  .section-body {
    padding: 16px;
    border-top: 1px solid var(--lk-subtle);
  }
  .section-meta-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }
  .section-type-select {
    background: var(--lk-deep);
    border: 1px solid var(--lk-subtle);
    border-radius: 6px;
    padding: 8px 12px;
    color: var(--lk-pink);
    font-family: var(--font-heading);
    font-size: 12px;
    cursor: pointer;
    outline: none;
  }
  .section-name-input {
    flex: 1;
    background: var(--lk-deep);
    border: 1px solid var(--lk-subtle);
    border-radius: 6px;
    padding: 8px 12px;
    color: var(--lk-white);
    font-family: var(--font-body);
    font-size: 14px;
    outline: none;
  }
  .section-name-input:focus { border-color: var(--lk-teal); }
  .section-name-input::placeholder { color: var(--lk-muted); }

  /* Fields */
  .field-group {
    margin-bottom: 14px;
  }
  .field-label {
    display: block;
    font-family: var(--font-heading);
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--lk-muted);
    margin-bottom: 6px;
  }
  .field-hint {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--lk-subtle);
    text-transform: none;
    margin-left: 6px;
  }
  .field-textarea {
    width: 100%;
    background: var(--lk-deep);
    border: 1px solid var(--lk-subtle);
    border-radius: 8px;
    padding: 12px 14px;
    color: var(--lk-white);
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.6;
    resize: vertical;
    outline: none;
    min-height: 40px;
  }
  .field-textarea:focus { border-color: var(--lk-teal); }
  .field-textarea::placeholder { color: var(--lk-muted); }

  .chords-area {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--lk-teal);
  }
  .tab-area {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.4;
    color: var(--lk-white);
    white-space: pre;
    overflow-x: auto;
  }

  .add-section-btn {
    padding: 8px 16px;
    background: transparent;
    border: 1px dashed var(--lk-subtle);
    border-radius: 8px;
    color: var(--lk-muted);
    font-family: var(--font-heading);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
  }
  .add-section-btn:hover {
    border-color: var(--lk-pink);
    color: var(--lk-pink);
  }
  .add-section-btn.center { max-width: 200px; margin: 16px auto; }
  .add-section-btn.bottom { margin-top: 16px; }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    gap: 16px;
    color: var(--lk-muted);
  }
  .empty-icon { font-size: 48px; opacity: 0.3; }

  /* ── Performance Mode ── */
  .performance-mode {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--lk-black);
    display: flex;
    flex-direction: column;
  }
  .perf-topbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 24px;
    background: rgba(16, 0, 24, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--lk-subtle);
    flex-shrink: 0;
  }
  .perf-exit {
    background: none;
    border: 1px solid var(--lk-subtle);
    border-radius: 6px;
    padding: 6px 12px;
    color: var(--lk-muted);
    font-family: var(--font-heading);
    font-size: 11px;
    cursor: pointer;
  }
  .perf-exit:hover { color: var(--lk-pink); border-color: var(--lk-pink); }
  .perf-title {
    font-family: var(--font-display);
    font-size: 28px;
    color: var(--lk-white);
    flex: 1;
  }
  .perf-meta-pills {
    display: flex;
    gap: 8px;
  }
  .perf-pill {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--lk-teal);
    background: rgba(0, 229, 204, 0.1);
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid rgba(0, 229, 204, 0.2);
  }
  .perf-speed {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--lk-muted);
  }
  .perf-speed button {
    background: var(--lk-deep);
    border: 1px solid var(--lk-subtle);
    border-radius: 4px;
    width: 24px;
    height: 24px;
    color: var(--lk-white);
    cursor: pointer;
  }

  .perf-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 48px 32px 120px;
    scroll-behavior: auto;
  }
  .perf-scroll::-webkit-scrollbar { display: none; }

  .perf-section {
    margin-bottom: 32px;
  }
  .perf-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    border-left: 3px solid var(--lk-pink);
    padding-left: 12px;
    margin-bottom: 12px;
  }
  .perf-section-type {
    font-family: var(--font-heading);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--lk-pink);
  }
  .perf-section-name {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--lk-muted);
  }
  .perf-lines {
    padding-left: 15px;
  }
  .perf-line {
    margin-bottom: 8px;
    min-height: 24px;
  }
  .perf-lyric-only {
    font-family: var(--font-body);
    font-size: 20px;
    color: var(--lk-white);
    line-height: 1.6;
  }
  .perf-chord-lyric-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
  }
  .perf-segment {
    display: inline-flex;
    flex-direction: column;
  }
  .perf-chord {
    font-family: var(--font-heading);
    font-size: 14px;
    font-weight: 700;
    color: var(--lk-teal);
    line-height: 1.2;
  }
  .perf-lyric {
    font-family: var(--font-body);
    font-size: 20px;
    color: var(--lk-white);
    line-height: 1.4;
  }

  .perf-play-indicator {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 0, 24, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid var(--lk-subtle);
    border-radius: 24px;
    padding: 8px 20px;
    font-family: var(--font-heading);
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--lk-muted);
    pointer-events: none;
  }

  /* ── Responsive ───────────────────────────────────────────────── */
  /* Tablet (768–1023px): narrow sidebar, smaller paddings */
  @media (max-width: 1023px) {
    .song-sidebar { width: 220px; }
    .editor-topbar { padding: 10px 14px; gap: 8px; }
    .song-title-input { font-size: 16px; }
  }
  /* Phone (<768px): sidebar collapses to top horizontal scroll strip, topbar wraps */
  @media (max-width: 767px) {
    .songs-page-v2 { height: auto; min-height: 100vh; overflow: visible; flex-direction: column; }
    .editor-layout { flex-direction: column; height: auto; }
    .song-sidebar {
      width: 100%;
      max-height: none;
      border-right: none;
      border-bottom: 1px solid var(--lk-subtle);
    }
    .sidebar-header { padding: 10px 14px; }
    .song-list {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 8px 14px 12px;
      scrollbar-width: none;
    }
    .song-list::-webkit-scrollbar { display: none; }
    .song-item {
      flex: 0 0 auto;
      min-width: 180px;
      margin-bottom: 0;
      padding: 10px 12px;
    }
    .editor-main { width: 100%; }
    .editor-topbar {
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 12px;
    }
    .topbar-left { flex: 1 1 100%; min-width: 100%; }
    .song-title-input { font-size: 18px; padding: 8px 10px; width: 100%; }
    .topbar-meta { flex: 1 1 auto; flex-wrap: wrap; gap: 6px; }
    .topbar-right { flex: 1 1 auto; justify-content: space-between; flex-wrap: wrap; }
    .transpose-controls { padding: 0; gap: 3px; }
    .transpose-btn { min-width: 36px; min-height: 36px; padding: 6px 8px; font-size: 12px; }
    .save-version-btn { min-height: 36px; padding: 6px 10px; }
    .delete-song-btn { min-height: 36px; padding: 6px 10px; }
    .version-picker { min-height: 36px; }
    .bpm-control { flex: 1; }
    .bpm-input { width: 100%; min-height: 40px; }
    .editor-content { padding: 12px; }
    .section-body { padding: 12px; }
    .field-textarea { min-height: 100px; font-size: 16px; }
    .section-meta-row { flex-direction: column; align-items: stretch; }
    .section-type-select, .section-name-input { width: 100%; min-height: 44px; }
    /* Hide desktop drag handle on touch */
    .drag-handle { display: none; }
    /* Promote up/down buttons to be larger */
    .section-reorder button { min-width: 40px; min-height: 40px; font-size: 14px; }
    .section-delete { min-width: 40px; min-height: 40px; font-size: 14px; }
  }
`
