'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import ChordSheetDisplay from './ChordSheetDisplay'
import AuthModal from './AuthModal'
import DrummerGrid from './DrummerGrid'
import BassTab from './BassTab'
import RecorderModal from './RecorderModal'

import { supabase } from '@/lib/supabase'
import { loadSongs, saveSong, deleteSong as apiDeleteSong, migrateLocalStorageToSupabase } from '@/lib/songsApi'
import type { Song, SongSection, SectionType } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const KEYS = ['A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab']

const SECTION_TYPES: SectionType[] = [
  'Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Hook', 'Post-Chorus',
  'Bridge', 'Breakdown', 'Musical Break', 'Instrumental', 'Tag', 'Solo', 'Outro',
]

const SECTION_COLORS: Record<SectionType, string> = {
  Intro: '#7B2FBE', Verse: '#00E5CC', 'Pre-Chorus': '#FF2D9B', Chorus: '#F0C040',
  Hook: '#FF6B35', 'Post-Chorus': '#FF6D00', Bridge: '#9D4EDD', Breakdown: '#E040FB',
  'Musical Break': '#00BCD4', Instrumental: '#78909C', Tag: '#78909C',
  Solo: '#FF8A65', Outro: '#06D6A0',
}

const BRAND = {
  hotPink: '#FF2D9B', electricTeal: '#00E5CC', deepViolet: '#7B2FBE',
  glamGold: '#F0C040', midnight: '#08060F', muted: '#6B6180',
  surface: '#130E20', card: '#0E0B18', border: '#1E1830',
}

// ─── Default Song Data ────────────────────────────────────────────────────────

const EXAMPLE_SONG: Song = {
  id: 'song-1',
  title: "A Quickenin' in Their Loins",
  key: 'Am', bpm: 110, timeSig: '4/4',
  rawLyrics: `Intro
8 Bar musical intro – Am D C

Verse 1
Theres a man that came riding into town with a blue Less Paul guitar
He had is ginger beard on and a flannel he dawned and he sat down at the bar
Then a stranger leaned over, said man you look sober, can I buy that sweet ass a drink
He wore some blue framed goggles with some assless chaps, had a big pari of balls to match

Musical Break 1
8 Bar – Am D C

Verse 2
A voice in the corner said boys come on over, got a hand full or cards to deal
He had steel on his hip and some dip in his lip, and the poker he played was strip
Deal the hand said the flannelled man as he loosened his buckled belt
Then to see whose most macho, they all lifted their panchos and that cowboy smell was smelt

Bridge 1
8 Bar – Am D C

Chorus 1
Underneath that pale moon light them fellers they all felt
A quickening deep down in their loins that tighten their gun belts
Three stallions destine to run, them wild plains of life
To gallop down them dusty roads, with no reward in sight

Post Chorus 1
8 bars – Am D C

Verse 3
The let the cards hit the ground and they rode out of town on the back of a single horse
His name was Scottie and to keep things lean, they rode him straight barback of course
Now they didn't have a saddle and couldn't rope cattle but knew how to harmonize
Three voices stung together like bull whipped leather, put a twinkle in them ladies eyes

Breakdown
When the sheriff caught wind he tried to put a swift end to the song about his sweet Scottie
He tendered a reward for the first man that scored the three heads of the Loin Kings
Though no one would date touch a shot curly hair on the trio of them nasty brutes
All marveled at the power of the musical shower pouring forth from the Loin Kings Gluts

Chorus 2
Underneath that pale moon light them fellers they all felt
A quickening deep down in their loins that tighten their gun belts
Three stallions destine to run, them wild plains of life
To gallop down them dusty roads, with no reward in sight`,
  sections: [
    { id: 's1', type: 'Intro', chordPro: '| Am . . . | D . . . | C . . . | Am . . . |', lyrics: [] },
    { id: 's2', type: 'Verse', chordPro: '| Am . . . | D . . . | C . . . | Am . . . |', lyrics: ['Theres a man that came riding into town with a blue Less Paul guitar', 'He had is ginger beard on and a flannel he dawned and he sat down at the bar', 'Then a stranger leaned over, said man you look sober, can I buy that sweet ass a drink', 'He wore some blue framed goggles with some assless chaps, had a big pari of balls to match'] },
    { id: 's3', type: 'Musical Break', chordPro: '| Am . . . | D . . . | C . . . | Am . . . |', lyrics: [] },
    { id: 's4', type: 'Verse', chordPro: '| Am . . . | D . . . | C . . . | Am . . . |', lyrics: ['A voice in the corner said boys come on over, got a hand full or cards to deal', 'He had steel on his hip and some dip in his lip, and the poker he played was strip', 'Deal the hand said the flannelled man as he loosened his buckled belt', 'Then to see whose most macho, they all lifted their panchos and that cowboy smell was smelt'] },
    { id: 's5', type: 'Bridge', chordPro: '| Am . . . | D . . . | C . . . | Am . . . |', lyrics: [] },
    { id: 's6', type: 'Chorus', chordPro: '| Am . . . | C . . . | D . . . | Am . . . |', lyrics: ['Underneath that pale moon light them fellers they all felt', 'A quickening deep down in their loins that tighten their gun belts', 'Three stallions destine to run, them wild plains of life', 'To gallop down them dusty roads, with no reward in sight'] },
    { id: 's7', type: 'Post-Chorus', chordPro: '| Am . . . | D . . . | C . . . | Am . . . |', lyrics: [] },
    { id: 's8', type: 'Verse', chordPro: '| Am . . . | D . . . | C . . . | Am . . . |', lyrics: ['The let the cards hit the ground and they rode out of town on the back of a single horse', 'His name was Scottie and to keep things lean, they rode him straight barback of course', "Now they didn't have a saddle and couldn't rope cattle but knew how to harmonize", 'Three voices stung together like bull whipped leather, put a twinkle in them ladies eyes'] },
    { id: 's9', type: 'Breakdown', chordPro: '| Am . . . | D . . . | C . . . | Am . . . |', lyrics: ['When the sheriff caught wind he tried to put a swift end to the song about his sweet Scottie', 'He tendered a reward for the first man that scored the three heads of the Loin Kings', 'Though no one would date touch a shot curly hair on the trio of them nasty brutes', "All marveled at the power of the musical shower pouring forth from the Loin Kings Gluts"] },
    { id: 's10', type: 'Chorus', chordPro: '| Am . . . | C . . . | D . . . | Am . . . |', lyrics: ['Underneath that pale moon light them fellers they all felt', 'A quickening deep down in their loins that tighten their gun belts', 'Three stallions destine to run, them wild plains of life', 'To gallop down them dusty roads, with no reward in sight'] },
  ],
  createdAt: Date.now(), updatedAt: Date.now(),
}

const DEFAULT_SONGS: Song[] = [
  EXAMPLE_SONG,
  { id: 'song-2', title: 'Grinder', key: 'E', bpm: 140, timeSig: '4/4', sections: [{ id: 's1', type: 'Intro', chordPro: '| E . . . | E . . . | E . . . | E . . . |', lyrics: [] }, { id: 's2', type: 'Verse', chordPro: '| E . . . | E . . . | E . . . | E . . . |', lyrics: ['', '', '', ''] }, { id: 's3', type: 'Chorus', chordPro: '| E . . . | E . . . | E . . . | E . . . |', lyrics: ['', '', '', ''] }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'song-3', title: 'Fuck Work', key: 'D', bpm: 128, timeSig: '4/4', sections: [{ id: 's1', type: 'Intro', chordPro: '| D . . . | D . . . | D . . . | D . . . |', lyrics: [] }, { id: 's2', type: 'Verse', chordPro: '| D . . . | D . . . | D . . . | D . . . |', lyrics: ['', '', '', ''] }, { id: 's3', type: 'Chorus', chordPro: '| D . . . | D . . . | D . . . | D . . . |', lyrics: ['', '', '', ''] }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'song-4', title: 'Bad Goodbye', key: 'A', bpm: 118, timeSig: '4/4', sections: [{ id: 's1', type: 'Intro', chordPro: '| A . . . | A . . . | A . . . | A . . . |', lyrics: [] }, { id: 's2', type: 'Verse', chordPro: '| A . . . | A . . . | A . . . | A . . . |', lyrics: ['', '', '', ''] }, { id: 's3', type: 'Chorus', chordPro: '| A . . . | A . . . | A . . . | A . . . |', lyrics: ['', '', '', ''] }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'song-5', title: "Bear's Last Ride", key: 'G', bpm: 95, timeSig: '4/4', sections: [{ id: 's1', type: 'Intro', chordPro: '| G . . . | G . . . | G . . . | G . . . |', lyrics: [] }, { id: 's2', type: 'Verse', chordPro: '| G . . . | G . . . | G . . . | G . . . |', lyrics: ['', '', '', ''] }, { id: 's3', type: 'Chorus', chordPro: '| G . . . | G . . . | G . . . | G . . . |', lyrics: ['', '', '', ''] }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'song-6', title: 'Tender Loin Love', key: 'C', bpm: 130, timeSig: '4/4', sections: [{ id: 's1', type: 'Intro', chordPro: '| C . . . | C . . . | C . . . | C . . . |', lyrics: [] }, { id: 's2', type: 'Verse', chordPro: '| C . . . | C . . . | C . . . | C . . . |', lyrics: ['', '', '', ''] }, { id: 's3', type: 'Chorus', chordPro: '| C . . . | C . . . | C . . . | C . . . |', lyrics: ['', '', '', ''] }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'song-7', title: 'Dance', key: 'B', bpm: 142, timeSig: '4/4', sections: [{ id: 's1', type: 'Intro', chordPro: '| B . . . | B . . . | B . . . | B . . . |', lyrics: [] }, { id: 's2', type: 'Verse', chordPro: '| B . . . | B . . . | B . . . | B . . . |', lyrics: ['', '', '', ''] }, { id: 's3', type: 'Chorus', chordPro: '| B . . . | B . . . | B . . . | B . . . |', lyrics: ['', '', '', ''] }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'song-8', title: "Hangman's Noose", key: 'F', bpm: 105, timeSig: '4/4', sections: [{ id: 's1', type: 'Intro', chordPro: '| F . . . | F . . . | F . . . | F . . . |', lyrics: [] }, { id: 's2', type: 'Verse', chordPro: '| F . . . | F . . . | F . . . | F . . . |', lyrics: ['', '', '', ''] }, { id: 's3', type: 'Chorus', chordPro: '| F . . . | F . . . | F . . . | F . . . |', lyrics: ['', '', '', ''] }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'song-9', title: 'The Gun Song', key: 'D', bpm: 132, timeSig: '4/4', sections: [{ id: 's1', type: 'Intro', chordPro: '| D . . . | D . . . | D . . . | D . . . |', lyrics: [] }, { id: 's2', type: 'Verse', chordPro: '| D . . . | D . . . | D . . . | D . . . |', lyrics: ['', '', '', ''] }, { id: 's3', type: 'Chorus', chordPro: '| D . . . | D . . . | D . . . | D . . . |', lyrics: ['', '', '', ''] }], createdAt: Date.now(), updatedAt: Date.now() },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function makeChordBar(key: string): string {
  return `| ${key} . . . | ${key} . . . | ${key} . . . | ${key} . . . |`
}

type AppMode = 'write' | 'arrange'

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewComposer() {
  // ── Auth state ───────────────────────────────────────────────────────────
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // ── App state ─────────────────────────────────────────────────────────────
  const [songs, setSongs] = useState<Song[]>([])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [mode, setMode] = useState<AppMode>('arrange')
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [copyConfirm, setCopyConfirm] = useState(false)
  const [writeText, setWriteText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showDrummerGrid, setShowDrummerGrid] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [songVersions, setSongVersions] = useState<any[]>([])
    const [loadingVersions, setLoadingVersions] = useState(false)
    const drummerBpm = useState(currentSong?.bpm ?? 120)[0]
    const setDrummerBpm = useState(currentSong?.bpm ?? 120)[1]
    const [showBassTab, setShowBassTab] = useState(false)
    const searchParams = useSearchParams()

  // ── Auth flow ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email })
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    }).catch(() => setAuthLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // ── Load songs ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      let loaded: Song[] = []

      if (!user) {
        // Load from localStorage for logged-out users
        const stored = localStorage.getItem('tlk-songs-v2')
        if (stored) {
          try {
            const parsed: Song[] = JSON.parse(stored)
            loaded = parsed
            setSongs(parsed)
          } catch {
            initDefaults()
            return
          }
        } else {
          initDefaults()
          return
        }
      } else {
        // Logged in — load from Supabase
        setSyncing(true)
        try {
          loaded = await loadSongs(user.id)
          if (loaded.length === 0) {
            const migrated = await migrateLocalStorageToSupabase(user.id)
            if (migrated > 0) {
              loaded = await loadSongs(user.id)
            }
          }
          if (loaded.length === 0) {
            for (const song of DEFAULT_SONGS) {
              await saveSong(song, user.id)
            }
            loaded = await loadSongs(user.id)
          }
          setSongs(loaded)
        } catch (e) {
          console.error('Error loading songs:', e)
          initDefaults()
          setSyncing(false)
          return
        }
        setSyncing(false)
      }

      // Select song from ?songId= param if present, otherwise first song
      const songIdParam = searchParams?.get('songId')
      if (songIdParam && loaded.length > 0) {
        const found = loaded.find(s => s.id === songIdParam)
        if (found) {
          setCurrentSong(found)
          setWriteText(found.rawLyrics || '')
          setActiveSectionIdx(0)
          setDeleteConfirm(null)
          setDrummerBpm(found.bpm)
          return
        }
      }
      if (loaded.length > 0) {
        setCurrentSong(loaded[0])
        setWriteText(loaded[0].rawLyrics || '')
      }
    }

    if (!authLoading) {
      init()
    } else {
      // Auth still loading — load from localStorage immediately so songId param works
      const stored = localStorage.getItem('tlk-songs-v2')
      if (stored) {
        try {
          const parsed: Song[] = JSON.parse(stored)
          setSongs(parsed)
          // Select the right song from ?songId= while we wait for auth
          const songIdParam = searchParams?.get('songId')
          if (songIdParam && parsed.length > 0) {
            const found = parsed.find(s => s.id === songIdParam)
            if (found) {
              setCurrentSong(found)
              setWriteText(found.rawLyrics || '')
              setDrummerBpm(found.bpm)
            }
          }
        } catch { /* ignore */ }
      }
    }
  }, [user, authLoading, searchParams])

  const initDefaults = () => {
    const initialized = DEFAULT_SONGS.map(s => ({ ...s }))
    setSongs(initialized)
    setCurrentSong(initialized[0])
    setWriteText(initialized[0].rawLyrics || '')
    localStorage.setItem('tlk-songs-v2', JSON.stringify(initialized))
  }

  // ── Save songs ─────────────────────────────────────────────────────────────
  const saveSongs = useCallback(async (updatedSongs: Song[]) => {
    setSaveStatus('saving')
    localStorage.setItem('tlk-songs-v2', JSON.stringify(updatedSongs))
    setSongs(updatedSongs)

    if (user) {
      const current = updatedSongs.find(s => s.id === currentSong?.id)
      if (current) {
        const ok = await saveSong(current, user.id)
        setSaveStatus(ok ? 'saved' : 'error')
      } else {
        setSaveStatus('saved')
      }
    } else {
      setSaveStatus('saved')
    }
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [user, currentSong?.id])

  const handleSongSelect = (song: Song) => {
    setCurrentSong(song)
    setWriteText(song.rawLyrics || '')
    setActiveSectionIdx(0)
    setDeleteConfirm(null)
    setDrummerBpm(song.bpm)
  }

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode)
    if (newMode === 'arrange' && currentSong) {
      setWriteText(currentSong.rawLyrics || '')
    }
  }

  const handleWriteTextChange = (text: string) => {
    setWriteText(text)
    if (!currentSong) return
    const updated = { ...currentSong, rawLyrics: text, updatedAt: Date.now() }
    setCurrentSong(updated)
    const updatedSongs = songs.map(s => s.id === updated.id ? updated : s)
    saveSongs(updatedSongs)
  }

  const handleCreateNewSong = () => {
    const newSong: Song = {
      id: generateId(), title: 'Untitled Song', key: 'A', bpm: 120, timeSig: '4/4',
      sections: [
        { id: generateId(), type: 'Intro', chordPro: '| A . . . | A . . . | A . . . | A . . . |', lyrics: [] },
        { id: generateId(), type: 'Verse', chordPro: '| A . . . | A . . . | A . . . | A . . . |', lyrics: ['', '', '', ''] },
        { id: generateId(), type: 'Chorus', chordPro: '| A . . . | A . . . | A . . . | A . . . |', lyrics: ['', '', '', ''] },
      ],
      rawLyrics: '', createdAt: Date.now(), updatedAt: Date.now(),
    }
    const updated = [newSong, ...songs]
    saveSongs(updated)
    setCurrentSong(newSong)
    setWriteText('')
    setMode('write')
    setActiveSectionIdx(0)
  }

  const handleUpdateSongMeta = (field: 'title' | 'key' | 'bpm' | 'timeSig', value: string | number) => {
    if (!currentSong) return
    const updated = { ...currentSong, [field]: value, updatedAt: Date.now() }
    setCurrentSong(updated)
    if (field === 'bpm') setDrummerBpm(value as number)
    const updatedSongs = songs.map(s => s.id === updated.id ? updated : s)
    saveSongs(updatedSongs)
  }

  const handleUpdateSection = (field: 'chordPro' | 'lyrics' | 'type', value: string | string[] | SectionType) => {
    if (!currentSong || activeSectionIdx >= currentSong.sections.length) return
    const newSections = [...currentSong.sections]
    const section = { ...newSections[activeSectionIdx] }
    if (field === 'lyrics') section.lyrics = value as string[]
    else if (field === 'type') section.type = value as SectionType
    else section.chordPro = value as string
    newSections[activeSectionIdx] = section
    const updated = { ...currentSong, sections: newSections, updatedAt: Date.now() }
    setCurrentSong(updated)
    const updatedSongs = songs.map(s => s.id === updated.id ? updated : s)
    saveSongs(updatedSongs)
  }

  const handleAddSection = (type: SectionType) => {
    if (!currentSong) return
    const newSection: SongSection = { id: generateId(), type, chordPro: makeChordBar(currentSong.key), lyrics: [] }
    const newSections = [...currentSong.sections, newSection]
    const updated = { ...currentSong, sections: newSections, updatedAt: Date.now() }
    setCurrentSong(updated)
    const updatedSongs = songs.map(s => s.id === updated.id ? updated : s)
    saveSongs(updatedSongs)
    setActiveSectionIdx(newSections.length - 1)
    setShowAddSection(false)
  }

  const handleDeleteSection = () => {
    if (activeSectionIdx === 0 || !currentSong) return
    if (deleteConfirm !== currentSong?.sections[activeSectionIdx]?.id) {
      setDeleteConfirm(currentSong?.sections[activeSectionIdx]?.id || null)
      return
    }
    const newSections = currentSong.sections.filter((_, i) => i !== activeSectionIdx)
    const updated = { ...currentSong, sections: newSections, updatedAt: Date.now() }
    setCurrentSong(updated)
    const updatedSongs = songs.map(s => s.id === updated.id ? updated : s)
    saveSongs(updatedSongs)
    setActiveSectionIdx(Math.max(0, activeSectionIdx - 1))
    setDeleteConfirm(null)
  }

  const handleMoveSection = (direction: -1 | 1) => {
    if (!currentSong) return
    const newIdx = activeSectionIdx + direction
    if (newIdx < 0 || newIdx >= currentSong.sections.length) return
    const newSections = [...currentSong.sections]
    ;[newSections[activeSectionIdx], newSections[newIdx]] = [newSections[newIdx], newSections[activeSectionIdx]]
    const updated = { ...currentSong, sections: newSections, updatedAt: Date.now() }
    setCurrentSong(updated)
    const updatedSongs = songs.map(s => s.id === updated.id ? updated : s)
    saveSongs(updatedSongs)
    setActiveSectionIdx(newIdx)
  }

  const handleDeleteSong = () => {
    if (!currentSong) return
    if (deleteConfirm !== currentSong.id) { setDeleteConfirm(currentSong.id); return }
    const updated = songs.filter(s => s.id !== currentSong.id)
    saveSongs(updated)
    if (updated.length > 0) { setCurrentSong(updated[0]); setWriteText(updated[0].rawLyrics || '') }
    else handleCreateNewSong()
    setDeleteConfirm(null)
  }

  const handleCopyChordPro = () => {
    if (!currentSong) return
    const lines: string[] = []
    lines.push(`{title: ${currentSong.title}}`)
    lines.push(`{key: ${currentSong.key}}`)
    lines.push(`{bpm: ${currentSong.bpm}}`)
    lines.push('')
    for (const section of currentSong.sections) {
      lines.push(`[${section.type}]`)
      lines.push(section.chordPro)
      for (const lyric of section.lyrics) { if (lyric) lines.push(lyric) }
      lines.push('')
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopyConfirm(true)
      setTimeout(() => setCopyConfirm(false), 2000)
    })
  }

  const parseRawLyricsToSections = (rawText: string, songKey: string): SongSection[] => {
    const lines = rawText.split('\n')
    const sections: SongSection[] = []
    let currentLines: string[] = []
    let currentType: SectionType = 'Verse'
    let currentChord = makeChordBar(songKey)

    for (const line of lines) {
      const trimmed = line.trim()
      const sectionHeaderMatch = trimmed.match(/^(Intro|Verse|Pre-Chorus|Chorus|Hook|Post-Chorus|Bridge|Breakdown|Musical Break|Instrumental|Tag|Solo|Outro)[\s_]*(?:[\d:–-]*(.*))?$/i)
      if (sectionHeaderMatch) {
        if (currentLines.length > 0 || sections.length === 0) {
          sections.push({ id: generateId(), type: currentType, chordPro: currentChord, lyrics: currentLines.filter(l => l.length > 0) })
        }
        currentType = sectionHeaderMatch[1].charAt(0).toUpperCase() + sectionHeaderMatch[1].slice(1).replace(/[\s_]/g, '') as SectionType
        if (!SECTION_TYPES.includes(currentType)) currentType = 'Verse'
        currentLines = []
        const chordHint = trimmed.match(/(Am|Amaj|A#|Bb|B|C|C#|Db|D|D#|Eb|E|F|F#|Gb|G|G#|Ab)/gi)
        if (chordHint) currentChord = `| ${chordHint[0]} . . . | ${chordHint[1] || chordHint[0]} . . . | ${chordHint[2] || chordHint[0]} . . . | ${chordHint[0]} . . . |`
        else currentChord = makeChordBar(songKey)
      } else if (trimmed.length > 0) {
        currentLines.push(trimmed)
      }
    }
    if (currentLines.length > 0 || sections.length === 0) {
      sections.push({ id: generateId(), type: currentType, chordPro: currentChord, lyrics: currentLines.filter(l => l.length > 0) })
    }
    return sections
  }

  const handleConvertToSections = () => {
    if (!currentSong || !writeText.trim()) return
    const newSections = parseRawLyricsToSections(writeText, currentSong.key)
    const updated = { ...currentSong, sections: newSections, rawLyrics: writeText, updatedAt: Date.now() }
    setCurrentSong(updated)
    const updatedSongs = songs.map(s => s.id === updated.id ? updated : s)
    saveSongs(updatedSongs)
    setMode('arrange')
    setActiveSectionIdx(0)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: BRAND.midnight, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: BRAND.hotPink, letterSpacing: 4 }}>Loading...</span>
      </div>
    )
  }

  if (!user) {
    return <AuthModal onAuth={(u) => setUser(u)} />
  }

  if (!currentSong) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: BRAND.midnight, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: BRAND.hotPink, letterSpacing: 4 }}>{syncing ? 'Syncing...' : 'Loading...'}</span>
      </div>
    )
  }

  const activeSection = currentSong.sections[activeSectionIdx]
  const writeLines = writeText.split('\n')

  // Styles
  const inputStyle: React.CSSProperties = { background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 14, outline: 'none', fontFamily: 'system-ui' }
  const buttonStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: 'transparent', color: '#fff', fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }

  return (
    <div style={{ display: 'flex', height: '100vh', background: BRAND.midnight, color: '#fff', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── FOCUS MODE: STATUS BAR ────────────────────────────────── */}
      {focusMode && mode === 'write' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 44,
          background: BRAND.card, borderBottom: `1px solid ${BRAND.border}`,
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 20, zIndex: 100,
        }}>
          <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 12, color: BRAND.muted, letterSpacing: 2, textTransform: 'uppercase' }}>{currentSong.title}</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.electricTeal }}>{currentSong.key}</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted }}>{currentSong.bpm} BPM</span>
        </div>
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <div style={{
        width: focusMode ? 0 : 260,
        flexShrink: 0,
        background: BRAND.surface,
        borderRight: `1px solid ${BRAND.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
      }}
        className="hidden md:flex"
      >
        <div style={{ padding: '16px', borderBottom: `1px solid ${BRAND.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: 2, color: BRAND.hotPink }}>SONGS</span>
          <button onClick={handleCreateNewSong} style={{ ...buttonStyle, padding: '6px 12px', fontSize: 12, color: BRAND.electricTeal, borderColor: BRAND.electricTeal }}>+ New</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {songs.map(song => (
            <div key={song.id} onClick={() => handleSongSelect(song)} style={{
              padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${BRAND.border}`,
              background: currentSong.id === song.id ? `${BRAND.hotPink}20` : 'transparent',
              borderLeft: currentSong.id === song.id ? `3px solid ${BRAND.hotPink}` : '3px solid transparent',
            }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 13, color: currentSong.id === song.id ? BRAND.hotPink : '#fff', letterSpacing: 0.5 }}>{song.title}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted, marginTop: 2 }}>{song.key} | {song.bpm} BPM</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar — wraps on mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 64, background: BRAND.surface, borderBottom: `1px solid ${BRAND.border}`, flexShrink: 0, marginTop: focusMode && mode === 'write' ? 44 : 0, flexWrap: 'wrap', md: { flexWrap: 'nowrap' } }}>
          <input value={currentSong.title} onChange={e => handleUpdateSongMeta('title', e.target.value)} style={{ ...inputStyle, fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 1, width: 160, md: { width: 220 }, background: 'transparent', border: 'none', color: '#fff', padding: '4px 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: BRAND.muted, fontSize: 11, fontFamily: 'Space Mono, monospace', letterSpacing: 1 }}>KEY</label>
            <select value={currentSong.key} onChange={e => handleUpdateSongMeta('key', e.target.value)} style={{ ...inputStyle, width: 70, fontFamily: 'Space Mono, monospace', fontSize: 13, cursor: 'pointer' }}>
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: BRAND.muted, fontSize: 11, fontFamily: 'Space Mono, monospace', letterSpacing: 1 }}>BPM</label>
            <input type="number" value={currentSong.bpm} onChange={e => handleUpdateSongMeta('bpm', parseInt(e.target.value) || 120)} style={{ ...inputStyle, width: 72, fontFamily: 'Space Mono, monospace', fontSize: 13, paddingRight: 8 }} />
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: BRAND.card, borderRadius: 8, padding: 4, gap: 4 }}>
            <button onClick={() => handleModeSwitch('write')} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: mode === 'write' ? BRAND.hotPink : 'transparent', color: mode === 'write' ? '#08060F' : BRAND.muted, fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>Write</button>
            <button onClick={() => handleModeSwitch('arrange')} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: mode === 'arrange' ? BRAND.hotPink : 'transparent', color: mode === 'arrange' ? '#08060F' : BRAND.muted, fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>Arrange</button>
          </div>

          {/* Focus mode button */}
          {mode === 'write' && (
            <button onClick={() => setFocusMode(!focusMode)} style={{
              padding: '6px 14px', borderRadius: 6, border: `1px solid ${focusMode ? BRAND.electricTeal : BRAND.border}`,
              background: focusMode ? `${BRAND.electricTeal}22` : 'transparent',
              color: focusMode ? BRAND.electricTeal : BRAND.muted,
              fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer',
            }}>
              {focusMode ? 'Exit Focus' : 'Focus Mode'}
            </button>
          )}

          <button
            onClick={() => setShowRecorder(true)}
            style={{
              padding: '6px 14px', borderRadius: 6,
              border: `1px solid ${BRAND.hotPink}66`,
              background: `${BRAND.hotPink}15`,
              color: BRAND.hotPink,
              fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5,
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            🎙 Record
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted }}>{user.email}</span>
                <button onClick={handleSignOut} style={{ ...buttonStyle, fontSize: 11, padding: '4px 10px' }}>Sign Out</button>
              </div>
            )}
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: saveStatus === 'saved' ? BRAND.electricTeal : saveStatus === 'error' ? '#ff6b6b' : 'transparent', transition: 'color 0.3s' }}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : ''}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* ── WRITE MODE ──────────────────────────────────────── */}
          {mode === 'write' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: focusMode ? '60px 40px 40px' : '24px', gap: focusMode ? 20 : 16, overflow: 'hidden', position: 'relative' }}>

              {/* Exit Focus button */}
              {focusMode && (
                <button onClick={() => setFocusMode(false)} style={{
                  position: 'absolute', top: 56, right: 24,
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${BRAND.border}`,
                  background: BRAND.card, color: BRAND.muted, fontFamily: 'Oswald, sans-serif',
                  fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer', zIndex: 10,
                }}>
                  Exit Focus
                </button>
              )}

              {!focusMode && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: BRAND.hotPink, margin: '0 0 4px', letterSpacing: 2 }}>WRITE LYRICS</h2>
                    <p style={{ color: BRAND.muted, fontSize: 12, margin: 0 }}>Write all your lyrics here. Line breaks are preserved. Use section headers like "Verse 1:", "Chorus:", "Bridge" to separate parts.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, alignSelf: 'center' }}>{writeLines.length} lines</span>
                  </div>
                </div>
              )}

              <textarea
                value={writeText}
                onChange={e => handleWriteTextChange(e.target.value)}
                placeholder={"Start writing your lyrics here...\n\nTip: Add section headers to mark parts:\nVerse 1\nPre-Chorus\nChorus\nBridge\nPost-Chorus\nBreakdown\nInstrumental\n\nWrite without stopping — you can organize later in Arrange mode."}
                style={{
                  flex: focusMode ? 1 : undefined,
                  height: focusMode ? '100%' : undefined,
                  minHeight: focusMode ? 'calc(100vh - 160px)' : 300,
                  background: BRAND.card,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 12,
                  color: '#fff',
                  fontFamily: 'system-ui',
                  fontSize: focusMode ? 18 : 16,
                  lineHeight: focusMode ? 2.2 : 1.8,
                  padding: focusMode ? '30px 40px' : '20px',
                  resize: 'none',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />

              {!focusMode && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button onClick={() => setShowAddSection(true)} style={{ ...buttonStyle, color: BRAND.electricTeal, borderColor: BRAND.electricTeal }}>+ Add Section</button>
                  <button onClick={() => setWriteText(currentSong.rawLyrics || '')} style={{ ...buttonStyle, color: BRAND.muted }}>Reset</button>
                  <button onClick={handleConvertToSections} style={{ ...buttonStyle, background: BRAND.hotPink, color: '#08060F', fontWeight: 700, borderColor: BRAND.hotPink }}>Convert to Sections →</button>
                </div>
              )}

              {showAddSection && (
                <>
                  <div onClick={() => setShowAddSection(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                  <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: 20, zIndex: 9999, minWidth: 240, boxShadow: `0 16px 64px rgba(0,0,0,0.9)` }}>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, color: BRAND.muted, letterSpacing: 2, marginBottom: 12 }}>ADD SECTION</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {SECTION_TYPES.map(type => (
                        <button key={type} onClick={() => { handleAddSection(type); setShowAddSection(false) }} style={{
                          padding: '10px 12px', cursor: 'pointer', borderRadius: 8,
                          border: `1px solid ${SECTION_COLORS[type]}44`,
                          background: `${SECTION_COLORS[type]}15`,
                          fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                          color: SECTION_COLORS[type], textAlign: 'center',
                        }}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ARRANGE MODE ─────────────────────────────────────── */}
          {mode === 'arrange' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* Section tabs */}
              <div style={{ display: 'flex', gap: 6, padding: '12px 24px', background: BRAND.card, borderBottom: `1px solid ${BRAND.border}`, overflowX: 'auto', flexShrink: 0, alignItems: 'center' }}>
                {currentSong.sections.map((section, idx) => {
                  const isEditing = editingSectionIdx === idx
                  return (
                    <div key={section.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={section.type}
                          onChange={e => {
                            const updated = { ...currentSong, sections: currentSong.sections.map((s, i) => i === idx ? { ...s, type: e.target.value as SectionType } : s), updatedAt: Date.now() }
                            setCurrentSong(updated)
                            const updatedSongs = songs.map(s => s.id === updated.id ? updated : s)
                            saveSongs(updatedSongs)
                          }}
                          onBlur={() => setEditingSectionIdx(null)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingSectionIdx(null) }}
                          style={{ background: BRAND.surface, border: `1px solid ${SECTION_COLORS[section.type]}`, borderRadius: 6, color: SECTION_COLORS[section.type], fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 8px', outline: 'none', width: 80 }}
                        />
                      ) : (
                        <button onClick={() => setActiveSectionIdx(idx)} onDoubleClick={() => setEditingSectionIdx(idx)} style={{
                          padding: '7px 14px', borderRadius: 8,
                          border: `1px solid ${activeSectionIdx === idx ? SECTION_COLORS[section.type] : BRAND.border}`,
                          background: activeSectionIdx === idx ? `${SECTION_COLORS[section.type]}30` : 'transparent',
                          color: activeSectionIdx === idx ? SECTION_COLORS[section.type] : BRAND.muted,
                          fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>{section.type}</button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Empty state — no sections yet */}
              {currentSong.sections.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: BRAND.muted, letterSpacing: 3, marginBottom: 12 }}>NO SECTIONS YET</div>
                  <div style={{ color: BRAND.muted, fontSize: 14, marginBottom: 32, textAlign: 'center' }}>Add your first section to start building the song structure</div>
                  <button
                    onClick={() => setShowAddSection(true)}
                    style={{
                      padding: '16px 32px',
                      borderRadius: 12,
                      border: `2px solid ${BRAND.hotPink}`,
                      background: `${BRAND.hotPink}15`,
                      color: BRAND.hotPink,
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: 18,
                      letterSpacing: 3,
                      cursor: 'pointer',
                    }}
                  >
                    + ADD YOUR FIRST SECTION
                  </button>
                  {showAddSection && (
                    <>
                      <div onClick={() => setShowAddSection(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: 20, zIndex: 9999, minWidth: 260, boxShadow: `0 16px 64px rgba(0,0,0,0.9)` }}>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, color: BRAND.muted, letterSpacing: 2, marginBottom: 12 }}>ADD YOUR FIRST SECTION</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {SECTION_TYPES.map(type => (
                            <button key={type} onClick={() => { handleAddSection(type); setShowAddSection(false) }} style={{
                              padding: '10px 12px', cursor: 'pointer', borderRadius: 8,
                              border: `1px solid ${SECTION_COLORS[type]}44`,
                              background: `${SECTION_COLORS[type]}15`,
                              fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                              color: SECTION_COLORS[type], textAlign: 'center',
                            }}>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
              <>
              {/* Section editor */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {activeSection && (
                  <div>
                    {/* Big obvious Add Section button */}
                    <button
                      onClick={() => setShowAddSection(!showAddSection)}
                      style={{
                        width: '100%',
                        padding: '14px 24px',
                        borderRadius: 12,
                        border: `2px dashed ${BRAND.border}`,
                        background: `${BRAND.hotPink}08`,
                        color: BRAND.hotPink,
                        fontFamily: 'Bebas Neue, sans-serif',
                        fontSize: 16,
                        letterSpacing: 3,
                        cursor: 'pointer',
                        marginBottom: 24,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = `${BRAND.hotPink}15`
                        ;(e.currentTarget as HTMLElement).style.borderColor = BRAND.hotPink
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = `${BRAND.hotPink}08`
                        ;(e.currentTarget as HTMLElement).style.borderColor = BRAND.border
                      }}
                    >
                      + ADD SECTION
                    </button>

                    {/* Backdrop for modal */}
                    {showAddSection && (
                      <div
                        onClick={() => setShowAddSection(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                      />
                    )}

                    {/* Add Section modal */}
                    {showAddSection && (
                      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: 20, zIndex: 9999, minWidth: 240, boxShadow: `0 16px 64px rgba(0,0,0,0.9)` }}>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, color: BRAND.muted, letterSpacing: 2, marginBottom: 12 }}>ADD NEW SECTION</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {SECTION_TYPES.map(type => (
                            <button key={type} onClick={() => { handleAddSection(type); setShowAddSection(false) }} style={{
                              padding: '10px 12px', cursor: 'pointer', borderRadius: 8,
                              border: `1px solid ${SECTION_COLORS[type]}44`,
                              background: `${SECTION_COLORS[type]}15`,
                              fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                              color: SECTION_COLORS[type], textAlign: 'center',
                            }}>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chord Pro preview with per-line chords */}
                    <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: BRAND.muted, letterSpacing: 2, marginBottom: 16 }}>CHORD SHEET PREVIEW</div>
                      <ChordSheetDisplay section={activeSection} />
                    </div>

                    {/* Section type selector */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ color: BRAND.muted, fontSize: 11, fontFamily: 'Space Mono, monospace', letterSpacing: 1, display: 'block', marginBottom: 6 }}>SECTION TYPE</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {SECTION_TYPES.map(type => (
                          <button key={type} onClick={() => handleUpdateSection('type', type)} style={{
                            padding: '6px 12px', borderRadius: 20,
                            border: `1px solid ${activeSection.type === type ? SECTION_COLORS[type] : BRAND.border}`,
                            background: activeSection.type === type ? `${SECTION_COLORS[type]}20` : 'transparent',
                            color: activeSection.type === type ? SECTION_COLORS[type] : BRAND.muted,
                            fontFamily: 'Oswald, sans-serif', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer',
                          }}>{type}</button>
                        ))}
                      </div>
                    </div>

                    {/* Chord progression */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ color: BRAND.muted, fontSize: 11, fontFamily: 'Space Mono, monospace', letterSpacing: 1, display: 'block', marginBottom: 6 }}>CHORD PROGRESSION</label>
                        <input value={activeSection.chordPro} onChange={e => handleUpdateSection('chordPro', e.target.value)} style={{ ...inputStyle, fontFamily: 'Space Mono, monospace', fontSize: 15, width: '100%', padding: '10px 14px' }} />
                      </div>
                    </div>

                    {/* Lyrics */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ color: BRAND.muted, fontSize: 11, fontFamily: 'Space Mono, monospace', letterSpacing: 1 }}>LYRICS</label>
                        <span style={{ color: BRAND.muted, fontSize: 11, fontFamily: 'Space Mono, monospace' }}>{activeSection.lyrics.length} lines</span>
                      </div>
                      <textarea value={activeSection.lyrics.join('\n')} onChange={e => handleUpdateSection('lyrics', e.target.value.split('\n'))} style={{
                        width: '100%', minHeight: 120, maxHeight: 280, overflowY: 'auto',
                        background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 8,
                        color: '#fff', fontFamily: 'system-ui', fontSize: 16, lineHeight: 1.8, padding: '12px 16px', resize: 'none', outline: 'none', boxSizing: 'border-box',
                      }} placeholder="Enter lyrics here, one line per row. Leave empty for instrumental sections." />
                    </div>

                    {/* Section controls */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={handleDeleteSection} style={{ ...buttonStyle, color: deleteConfirm === activeSection.id ? '#fff' : '#ff6b6b', borderColor: deleteConfirm === activeSection.id ? '#8B0000' : '#ff6b6b' }}>
                        {deleteConfirm === activeSection.id ? 'Click again to confirm' : 'Delete Section'}
                      </button>
                      <button onClick={() => handleMoveSection(-1)} disabled={activeSectionIdx === 0} style={{ ...buttonStyle, opacity: activeSectionIdx === 0 ? 0.3 : 1 }}>↑ Move Up</button>
                      <button onClick={() => handleMoveSection(1)} disabled={activeSectionIdx === currentSong.sections.length - 1} style={{ ...buttonStyle, opacity: activeSectionIdx === currentSong.sections.length - 1 ? 0.3 : 1 }}>Move Down ↓</button>
                      <button onClick={() => setShowDrummerGrid(g => !g)} style={{ ...buttonStyle, color: showDrummerGrid ? BRAND.hotPink : '#fff', borderColor: showDrummerGrid ? BRAND.hotPink : BRAND.border }}>
                        {showDrummerGrid ? '✕ Hide Drums' : '🥁 Drummer Grid'}
                      </button>
                      <button onClick={() => setShowBassTab(g => !g)} style={{ ...buttonStyle, color: showBassTab ? BRAND.electricTeal : '#fff', borderColor: showBassTab ? BRAND.electricTeal : BRAND.border }}>
                        {showBassTab ? '✕ Hide Bass' : '🎸 Bass Tab'}
                      </button>
                    </div>

                    {/* Drummer Grid panel */}
                    {showDrummerGrid && (
                      <div style={{ marginTop: 24, background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: BRAND.muted, letterSpacing: 2 }}>DRUMMER GRID</span>
                          <input
                            type="number"
                            value={drummerBpm}
                            onChange={e => setDrummerBpm(parseInt(e.target.value) || 120)}
                            style={{ ...inputStyle, width: 60, fontFamily: 'Space Mono, monospace', fontSize: 13, background: BRAND.surface }}
                          />
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted }}>BPM</span>
                        </div>
                        <DrummerGrid bpm={drummerBpm} />
                      </div>
                    )}

                    {/* Bass Tab panel */}
                    {showBassTab && (
                      <div style={{ marginTop: 24 }}>
                        <BassTab songKey={currentSong.key} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          )}
        </div>

        {/* Action bar */}
        {!focusMode && (
          <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: `1px solid ${BRAND.border}`, background: BRAND.surface, flexShrink: 0 }}>
            <button onClick={() => { handleUpdateSongMeta('title', currentSong.title) }} style={{ ...buttonStyle, color: saveStatus === 'saved' ? BRAND.electricTeal : '#fff', borderColor: saveStatus === 'saved' ? BRAND.electricTeal : BRAND.border }}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save Song'}
            </button>
            <button onClick={handleCopyChordPro} style={{ ...buttonStyle, color: copyConfirm ? BRAND.glamGold : '#fff' }}>
              {copyConfirm ? '✓ Copied!' : 'Copy Chord Pro'}
            </button>
            <button onClick={() => { setShowRecordingsTab(true); setShowRecorder(true) }} style={{ ...buttonStyle, color: BRAND.electricTeal, borderColor: BRAND.electricTeal }}>
              🎙 Recordings
            </button>
            <button onClick={() => window.print()} style={{ ...buttonStyle, color: '#fff' }}>
              📄 Print PDF
            </button>
            <button onClick={handleDeleteSong} style={{ ...buttonStyle, color: deleteConfirm === currentSong.id ? '#fff' : '#ff6b6b', borderColor: deleteConfirm === currentSong.id ? '#8B0000' : '#ff6b6b' }}>
              {deleteConfirm === currentSong.id ? 'Click again to confirm delete' : 'Delete Song'}
            </button>
          </div>
        )}
      </div>

      <RecorderModal open={showRecorder} onClose={() => { setShowRecorder(false); setShowRecordingsTab(false) }} initialTab={showRecordingsTab ? 'recordings' : 'record'} />
    </div>
  )
}