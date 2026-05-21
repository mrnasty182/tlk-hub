'use client'

import React, { useState } from 'react'
import SongEditor from '@/components/SongEditor'
import ChordPanel from '@/components/ChordPanel'
import ScaleExplorer from '@/components/ScaleExplorer'
import SetlistBuilder from '@/components/SetlistBuilder'
import JamCalendar from '@/components/JamCalendar'

type Tab = 'songs' | 'setlists' | 'calendar'

interface Song {
  id: string
  title: string
  artist?: string
  key?: string
  bpm?: number
  chordPro: string
}

interface Setlist {
  id: string
  title: string
  notes?: string
  locked: boolean
  songs: { id: string; songId: string; title: string; key?: string; bpm?: number; position: number }[]
}

interface Jam {
  id: string
  title: string
  date: string
  notes?: string
  jamLink?: string
  practice: boolean
  attendees: { id: string; name: string; attended: boolean }[]
}

export default function TLKHub() {
  const [activeTab, setActiveTab] = useState<Tab>('songs')
  const [selectedChord, setSelectedChord] = useState<string>('G')
  const [showScaleExplorer, setShowScaleExplorer] = useState(false)
  const [autoScale, setAutoScale] = useState<string | undefined>()
  const [autoRoot, setAutoRoot] = useState<string | undefined>()
  
  // Demo data
  const [songs, setSongs] = useState<Song[]>([
    { id: '1', title: 'Thunder Road', artist: 'Bruce Springsteen', key: 'E', bpm: 120, chordPro: '[verse]\nE A E\nThe screen door slams\n' },
    { id: '2', title: 'Mustang Sally', artist: 'CCR', key: 'E', bpm: 110, chordPro: '[chorus]\nE7\nPut the saddle on the mare...' },
  ])
  
  const [setlists, setSetlists] = useState<Setlist[]>([
    { id: '1', title: 'Friday Night Set', notes: 'Opener for the night', locked: false, songs: [
      { id: 's1', songId: '1', title: 'Thunder Road', key: 'E', bpm: 120, position: 1 },
      { id: 's2', songId: '2', title: 'Mustang Sally', key: 'E', bpm: 110, position: 2 },
    ]}
  ])
  
  const [jams, setJams] = useState<Jam[]>([
    { id: '1', title: 'Tuesday Night Jam', date: '2026-05-19', notes: 'Working on transitions', jamLink: 'https://zoom.us/j/123456', practice: false, attendees: [
      { id: 'a1', name: 'Josh', attended: true },
      { id: 'a2', name: 'Mike', attended: true },
      { id: 'a3', name: 'Steve', attended: false },
    ]},
    { id: '2', title: 'Practice Session', date: '2026-05-21', notes: 'Rhythm section practice', practice: true, attendees: [] },
  ])

  const handleChordTap = (chord: string) => {
    setSelectedChord(chord)
    // Parse chord to get root and suggest scale
    const match = chord.match(/^([A-G][#b]?)(.*)$/)
    if (match) {
      const root = match[1]
      const quality = match[2]
      if (quality === 'm' || quality === 'm7') {
        setAutoScale('Minor Pentatonic')
        setAutoRoot(root)
      } else {
        setAutoScale('Major Pentatonic')
        setAutoRoot(root)
      }
    }
    setShowScaleExplorer(true)
  }

  return (
    <div className="tlk-hub">
      {/* Navigation */}
      <nav className="hub-nav">
        <div className="nav-brand">
          <span className="brand-icon">🥩</span>
          <span className="brand-text">TLK HUB</span>
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => setActiveTab('songs')}
          >
            🎸 Songs
          </button>
          <button
            className={`nav-tab ${activeTab === 'setlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('setlists')}
          >
            📋 Setlists
          </button>
          <button
            className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 Calendar
          </button>
        </div>
        <button
          className={`nav-tab tools-toggle ${showScaleExplorer ? 'active' : ''}`}
          onClick={() => setShowScaleExplorer(!showScaleExplorer)}
        >
          🎹 Scale Explorer
        </button>
      </nav>

      {/* Main Content */}
      <main className="hub-content">
        {activeTab === 'songs' && (
          <div className="songs-view">
            <div className="editor-container">
              <h2>Song Editor</h2>
              <SongEditor
                onSave={(content) => console.log('Saving song:', content)}
              />
            </div>
          </div>
        )}

        {activeTab === 'setlists' && (
          <div className="setlists-view">
            <h2>Setlists</h2>
            {setlists.map(setlist => (
              <div key={setlist.id} className="setlist-card card">
                <SetlistBuilder
                  title={setlist.title}
                  notes={setlist.notes}
                  locked={setlist.locked}
                  songs={setlist.songs}
                  onTitleChange={(title) => {
                    const updated = setlists.map(s => s.id === setlist.id ? { ...s, title } : s)
                    setSetlists(updated)
                  }}
                  onNotesChange={(notes) => {
                    const updated = setlists.map(s => s.id === setlist.id ? { ...s, notes } : s)
                    setSetlists(updated)
                  }}
                  onLockChange={(locked) => {
                    const updated = setlists.map(s => s.id === setlist.id ? { ...s, locked } : s)
                    setSetlists(updated)
                  }}
                  onSongsChange={(songs) => {
                    const updated = setlists.map(s => s.id === setlist.id ? { ...s, songs } : s)
                    setSetlists(updated)
                  }}
                />
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => {
              const newSetlist: Setlist = {
                id: `setlist-${Date.now()}`,
                title: 'New Setlist',
                notes: '',
                locked: false,
                songs: []
              }
              setSetlists([...setlists, newSetlist])
            }}>
              + Create Setlist
            </button>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-view">
            <h2>Jam Calendar</h2>
            <JamCalendar jams={jams} onJamChange={setJams} />
          </div>
        )}
      </main>

      {/* Side Panel - Chord Reference */}
      <aside className="hub-sidebar">
        <ChordPanel
          chord={selectedChord}
          autoScale={autoScale}
          autoRoot={autoRoot}
        />
        {showScaleExplorer && (
          <ScaleExplorer
            autoScale={autoScale}
            autoRoot={autoRoot}
            onChordTap={handleChordTap}
          />
        )}
      </aside>
    </div>
  )
}