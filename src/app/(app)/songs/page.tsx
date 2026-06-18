'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Section, SectionType, Song } from '@/types/music'
import { SECTION_TYPES, SECTION_TYPE_LABELS } from '@/types/music'
import { createEmptySection, uid } from '@/lib/sections'
import { parseFreeformToSections } from '@/lib/chordpro'
import { supabase } from '@/lib/supabase'
import PerformanceView from '@/components/PerformanceView'

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
      id: uid(),
      user_id: null,
      band_id: null,
      title: 'New Song',
      key: 'A',
      bpm: 120,
      time_sig: '4/4',
      visibility: 'private',
      raw_lyrics: '',
      sections: [createEmptySection('verse', 0)],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSongs(prev => [...prev, newSong])
    setSelectedId(newSong.id)
    setExpandedSections(new Set([newSong.sections[0].id]))
    setViewMode('arrange')
  }, [])

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
      await supabase.from('songs').upsert({
        id: sel.id,
        user_id: userId,
        title: sel.title,
        key: sel.key,
        bpm: sel.bpm,
        time_sig: sel.time_sig,
        sections: sel.sections,
        raw_lyrics: sel.raw_lyrics || '',
        updated_at: new Date().toISOString(),
      })
    }
    const timer = setTimeout(persist, 800)
    return () => clearTimeout(timer)
  }, [songs, selectedId])

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
          <div className="song-list">
            {songs.map(song => (
              <div
                key={song.id}
                className={`song-item ${selectedId === song.id ? 'active' : ''}`}
                onClick={() => setSelectedId(song.id)}
              >
                <div className="song-item-title">{song.title}</div>
                <div className="song-item-meta">
                  <span className="meta-key">{song.key}</span>
                  <span className="meta-bpm">{song.bpm} BPM</span>
                  <span className="meta-sig">{song.time_sig}</span>
                </div>
              </div>
            ))}
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
            </div>

            <div className="topbar-meta">
              <select
                className="meta-select"
                value={selectedSong?.key ?? ''}
                onChange={e => updateSong(selectedSong.id, { key: e.target.value })}
              >
                {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Am','A#m','Bm','Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

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
    .topbar-right { flex: 1 1 auto; justify-content: space-between; }
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
