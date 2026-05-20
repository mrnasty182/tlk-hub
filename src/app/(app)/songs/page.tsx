'use client'

import { useState } from 'react'
import SongEditor from '@/components/SongEditor'
import SongArranger from '@/components/SongArranger'
import DrummerGrid from '@/components/DrummerGrid'
import BassTab from '@/components/BassTab'
import RehearsalMode from '@/components/RehearsalMode'
import PatternLibrary from '@/components/PatternLibrary'

// ── Types ───────────────────────────────────────────────────────────

type SongFilter = 'mine' | 'all'
type SongViewTab = 'edit' | 'arranger' | 'rehearsal' | 'drums' | 'bass'

interface DemoSong {
  id: string
  title: string
  artist: string
  key: string
  bpm: number
  timeSignature: string
  content: string
}

// ── Demo Data ──────────────────────────────────────────────────────

const DEMO_SONGS: DemoSong[] = [
  {
    id: '1',
    title: 'Stay Hard',
    artist: 'The Loin Kings',
    key: 'A',
    bpm: 124,
    timeSignature: '4/4',
    content: `{title: Stay Hard}
{artist: The Loin Kings}
{key: A}
{bpm: 124}

[intro]
A  E  F#m  D

[verse]
A         E
We don't stop the party here
F#m       D
We ride until the morning comes

[chorus]
D  A  E  F#m
Stay hard, stay loud
D  A  E  F#m
We are the lion kings`,
  },
  {
    id: '2',
    title: 'Rawr',
    artist: 'The Loin Kings',
    key: 'E',
    bpm: 140,
    timeSignature: '4/4',
    content: `{title: Rawr}
{artist: The Loin Kings}
{key: E}
{bpm: 140}

[verse]
E  B  C#m  A
Roar like a lion in the night
E  B  C#m  A
We are the kings of the fight

[chorus]
A  E  C#m  B
Rawr, hear us call
A  E  C#m  B
We will never fall`,
  },
  {
    id: '3',
    title: 'Pride of the Wild',
    artist: 'The Loin Kings',
    key: 'D',
    bpm: 118,
    timeSignature: '4/4',
    content: `{title: Pride of the Wild}
{artist: The Loin Kings}
{key: D}
{bpm: 118}

[intro]
D  A  Bm  G

[verse]
D            A
Running through the savanna
Bm           G
Feel the thunder in our feet
D            A
No one can stop us now
Bm           G
We are the pride complete

[chorus]
G  D  A  Bm
Stand tall, stand proud
G  D  A  Bm
We're the kings of the crowd`,
  },
]

// ── Demo Rehearsal Data Builder ─────────────────────────────────────

function buildRehearsalData(song: DemoSong) {
  const sectionCount = 3
  const barsPerSection = 4
  const totalBars = sectionCount * barsPerSection
  const chordSymbols = ['C', 'G', 'Am', 'F', 'D', 'A', 'E', 'F#m', 'Bm', 'A']

  return {
    title: song.title,
    artist: song.artist,
    bpm: song.bpm,
    timeSignature: song.timeSignature as '4/4' | '3/4' | '6/8',
    sections: [
      { id: 's1', name: 'Intro', type: 'intro' as const, bars: 4, startBar: 0 },
      { id: 's2', name: 'Verse 1', type: 'verse' as const, bars: 4, startBar: 4 },
      { id: 's3', name: 'Chorus', type: 'chorus' as const, bars: 4, startBar: 8 },
    ],
    chordProgression: Array.from({ length: totalBars }, (_, i) => ({
      bar: i + 1,
      chord: chordSymbols[i % chordSymbols.length],
    })),
  }
}

// ── Component ───────────────────────────────────────────────────────

export default function SongsPage() {
  const [filter, setFilter] = useState<SongFilter>('mine')
  const [selectedSong, setSelectedSong] = useState<DemoSong | null>(DEMO_SONGS[0])
  const [viewTab, setViewTab] = useState<SongViewTab>('edit')
  const [songContent, setSongContent] = useState(selectedSong?.content ?? '')
  const [drumPatternData, setDrumPatternData] = useState<any>(null)
  const [showPatternLibrary, setShowPatternLibrary] = useState(false)

  const filteredSongs = filter === 'mine'
    ? DEMO_SONGS
    : DEMO_SONGS

  const handleSongSelect = (song: DemoSong) => {
    setSelectedSong(song)
    setSongContent(song.content)
    setViewTab('edit')
    setDrumPatternData(null)
  }

  const handleContentChange = (content: string) => {
    setSongContent(content)
    if (selectedSong) {
      setSelectedSong({ ...selectedSong, content })
    }
  }

  const viewTabs: { id: SongViewTab; label: string }[] = [
    { id: 'edit', label: '✍️ Edit' },
    { id: 'arranger', label: '🎼 Arranger' },
    { id: 'rehearsal', label: '🎤 Rehearsal' },
    { id: 'drums', label: '🥁 Drums' },
    { id: 'bass', label: '🎸 Bass' },
  ]

  const rehearsalData = selectedSong ? buildRehearsalData(selectedSong) : null

  return (
    <div className="songs-page">
      <style>{`
        .songs-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 32px;
          flex-shrink: 0;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 36px;
          margin-bottom: 4px;
        }
        .page-subtitle {
          color: var(--lk-muted);
          font-size: 14px;
        }
        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 32px;
          padding: 12px 20px;
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 12px;
          flex-shrink: 0;
        }
        .filter-toggle {
          display: flex;
          background: var(--lk-deep);
          border-radius: 8px;
          padding: 4px;
        }
        .toggle-btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--lk-muted);
          font-family: var(--font-heading);
          font-size: 12px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .toggle-btn:hover {
          color: var(--lk-white);
        }
        .toggle-btn.active {
          background: var(--lk-pink);
          color: var(--lk-black);
        }
        .filter-info {
          color: var(--lk-muted);
          font-size: 13px;
        }
        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .song-list-panel {
          width: 320px;
          flex-shrink: 0;
          border-right: 1px solid var(--lk-subtle);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--lk-void);
        }
        .song-list-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--lk-subtle);
          font-family: var(--font-heading);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
          flex-shrink: 0;
        }
        .song-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        .song-card {
          background: var(--lk-deep);
          border: 1px solid var(--lk-subtle);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .song-card:hover {
          border-color: var(--lk-violet);
        }
        .song-card.selected {
          border-color: var(--lk-pink);
          background: rgba(255, 45, 155, 0.08);
        }
        .song-card-title {
          font-family: var(--font-heading);
          font-size: 15px;
          color: var(--lk-white);
          margin-bottom: 2px;
        }
        .song-card-artist {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--lk-muted);
          margin-bottom: 10px;
        }
        .song-card-meta {
          display: flex;
          gap: 12px;
        }
        .song-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .song-meta-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--lk-muted);
        }
        .song-meta-value {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--lk-teal);
        }
        .song-meta-value.key {
          color: var(--lk-gold);
        }
        .detail-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          border-bottom: 1px solid var(--lk-subtle);
          flex-shrink: 0;
          background: var(--lk-void);
        }
        .detail-song-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .detail-song-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--lk-white);
        }
        .detail-song-meta {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--lk-muted);
          display: flex;
          gap: 12px;
        }
        .view-tabs {
          display: flex;
          gap: 4px;
          padding: 0 24px;
          border-bottom: 1px solid var(--lk-subtle);
          background: var(--lk-deep);
          flex-shrink: 0;
        }
        .view-tab-btn {
          padding: 12px 20px;
          font-family: var(--font-heading);
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--lk-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .view-tab-btn:hover {
          color: var(--lk-white);
        }
        .view-tab-btn.active {
          color: var(--lk-pink);
          border-bottom-color: var(--lk-pink);
        }
        .detail-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .edit-arranger-split {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .edit-pane {
          flex: 1;
          overflow: auto;
          border-right: 1px solid var(--lk-subtle);
        }
        .arranger-pane {
          flex: 1;
          overflow: auto;
        }
        .full-pane {
          flex: 1;
          overflow: auto;
        }
        .empty-detail {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--lk-muted);
        }
        .empty-icon {
          font-size: 48px;
          opacity: 0.3;
        }
        .empty-text {
          font-family: var(--font-heading);
          font-size: 14px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
      `}</style>

      <header className="page-header">
        <div>
          <h1 className="page-title">Songs</h1>
          <p className="page-subtitle">{filteredSongs.length} songs in library</p>
        </div>
      </header>

      <div className="filter-bar">
        <div className="filter-toggle">
          <button
            className={`toggle-btn ${filter === 'mine' ? 'active' : ''}`}
            onClick={() => setFilter('mine')}
          >
            My Songs
          </button>
          <button
            className={`toggle-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Band Songs
          </button>
        </div>
        <div className="filter-info">
          {filter === 'mine' ? 'Showing songs you created' : 'Showing all band songs'}
        </div>
      </div>

      <div className="main-content">
        {/* Left: Song List */}
        <aside className="song-list-panel">
          <div className="song-list-header">Song Library</div>
          <div className="song-list">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className={`song-card ${selectedSong?.id === song.id ? 'selected' : ''}`}
                onClick={() => handleSongSelect(song)}
              >
                <div className="song-card-title">{song.title}</div>
                <div className="song-card-artist">{song.artist}</div>
                <div className="song-card-meta">
                  <span className="song-meta-item">
                    <span className="song-meta-label">Key</span>
                    <span className="song-meta-value key">{song.key}</span>
                  </span>
                  <span className="song-meta-item">
                    <span className="song-meta-label">BPM</span>
                    <span className="song-meta-value">{song.bpm}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right: Detail Panel */}
        <main className="detail-panel">
          {selectedSong ? (
            <>
              <div className="detail-header">
                <div className="detail-song-info">
                  <span className="detail-song-title">{selectedSong.title}</span>
                  <span className="detail-song-meta">
                    <span>Key: {selectedSong.key}</span>
                    <span>BPM: {selectedSong.bpm}</span>
                    <span>{selectedSong.timeSignature}</span>
                  </span>
                </div>
              </div>

              <nav className="view-tabs">
                {viewTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`view-tab-btn ${viewTab === tab.id ? 'active' : ''}`}
                    onClick={() => setViewTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="detail-content">
                {viewTab === 'edit' && (
                  <div className="edit-arranger-split">
                    <div className="edit-pane">
                      <SongEditor
                        initialContent={songContent}
                        onSave={handleContentChange}
                        onChordTap={() => {}}
                      />
                    </div>
                    <div className="arranger-pane">
                      <SongArranger
                        content={songContent}
                        onChordClick={() => {}}
                      />
                    </div>
                  </div>
                )}

                {viewTab === 'arranger' && (
                  <div className="full-pane">
                    <SongArranger
                      content={songContent}
                      onChordClick={() => {}}
                    />
                  </div>
                )}

                {viewTab === 'rehearsal' && rehearsalData && (
                  <div className="full-pane">
                    <RehearsalMode
                      title={rehearsalData.title}
                      artist={rehearsalData.artist}
                      bpm={rehearsalData.bpm}
                      timeSignature={rehearsalData.timeSignature}
                      sections={rehearsalData.sections}
                      chordProgression={rehearsalData.chordProgression}
                    />
                  </div>
                )}

                {viewTab === 'drums' && (
                  <div className="full-pane" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '12px 20px',
                      borderBottom: '1px solid var(--lk-subtle)',
                      background: 'var(--lk-deep)',
                      flexShrink: 0,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        color: 'var(--lk-muted)',
                      }}>Drum Pattern for {selectedSong.title}</span>
                      <div style={{ flex: 1 }} />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowPatternLibrary(true)}
                      >
                        📚 Pattern Library
                      </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                      <DrummerGrid
                        initialData={drumPatternData}
                        onChange={(data) => setDrumPatternData(data)}
                      />
                    </div>
                    <PatternLibrary
                      isOpen={showPatternLibrary}
                      onClose={() => setShowPatternLibrary(false)}
                      currentPattern={drumPatternData || undefined}
                      onLoadPattern={(data) => setDrumPatternData(data)}
                    />
                  </div>
                )}

                {viewTab === 'bass' && (
                  <div className="full-pane" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid var(--lk-subtle)',
                      background: 'var(--lk-deep)',
                      flexShrink: 0,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        color: 'var(--lk-muted)',
                      }}>Bass Tab for {selectedSong.title}</span>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                      <BassTab />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <span className="empty-icon">🎵</span>
              <span className="empty-text">Select a song to view details</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}