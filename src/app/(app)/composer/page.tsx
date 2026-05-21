'use client'

import { useState } from 'react'
import SongEditor, { SongData } from '@/components/SongEditor'
import DrummerGrid from '@/components/DrummerGrid'
import BassTab from '@/components/BassTab'
import RehearsalMode from '@/components/RehearsalMode'
import PatternLibrary from '@/components/PatternLibrary'

type ComposerTab = 'songwriter' | 'drums' | 'bass' | 'rehearsal'

const DEMO_REHEARSAL_DATA = {
  title: 'Stay Hard',
  artist: 'The Loin Kings',
  bpm: 124,
  timeSignature: '4/4' as const,
  sections: [
    { id: 's1', name: 'Intro', type: 'intro' as const, bars: 4, startBar: 0 },
    { id: 's2', name: 'Verse 1', type: 'verse' as const, bars: 8, startBar: 4 },
    { id: 's3', name: 'Chorus', type: 'chorus' as const, bars: 8, startBar: 12 },
    { id: 's4', name: 'Verse 2', type: 'verse' as const, bars: 8, startBar: 20 },
    { id: 's5', name: 'Bridge', type: 'bridge' as const, bars: 4, startBar: 28 },
    { id: 's6', name: 'Chorus', type: 'chorus' as const, bars: 8, startBar: 32 },
  ],
  chordProgression: [
    { bar: 1, chord: 'A' },   { bar: 2, chord: 'E' },
    { bar: 3, chord: 'F#m' }, { bar: 4, chord: 'D' },
    { bar: 5, chord: 'A' },   { bar: 6, chord: 'E' },
    { bar: 7, chord: 'F#m' }, { bar: 8, chord: 'D' },
    { bar: 9, chord: 'D' },   { bar: 10, chord: 'A' },
    { bar: 11, chord: 'E' },  { bar: 12, chord: 'F#m' },
    { bar: 13, chord: 'D' },  { bar: 14, chord: 'A' },
    { bar: 15, chord: 'E' },  { bar: 16, chord: 'F#m' },
    { bar: 17, chord: 'A' },  { bar: 18, chord: 'E' },
    { bar: 19, chord: 'F#m' },{ bar: 20, chord: 'D' },
    { bar: 21, chord: 'A' },  { bar: 22, chord: 'E' },
    { bar: 23, chord: 'F#m' },{ bar: 24, chord: 'D' },
    { bar: 25, chord: 'E' },  { bar: 26, chord: 'F#m' },
    { bar: 27, chord: 'D' },  { bar: 28, chord: 'A' },
    { bar: 29, chord: 'A' },  { bar: 30, chord: 'E' },
    { bar: 31, chord: 'D' },  { bar: 32, chord: 'F#m' },
    { bar: 33, chord: 'D' },  { bar: 34, chord: 'A' },
    { bar: 35, chord: 'E' },  { bar: 36, chord: 'F#m' },
    { bar: 37, chord: 'D' },  { bar: 38, chord: 'A' },
    { bar: 39, chord: 'E' },  { bar: 40, chord: 'F#m' },
  ],
}

export default function ComposerPage() {
  const [activeTab, setActiveTab] = useState<ComposerTab>('songwriter')
  const [songData, setSongData] = useState<SongData | null>(null)
  const [drumPatternData, setDrumPatternData] = useState<any>(null)
  const [showPatternLibrary, setShowPatternLibrary] = useState(false)

  const tabs: { id: ComposerTab; label: string }[] = [
    { id: 'songwriter', label: '✍️ Songwriter' },
    { id: 'drums',      label: '🥁 Drums' },
    { id: 'bass',       label: '🎸 Bass' },
    { id: 'rehearsal',  label: '🎤 Rehearsal' },
  ]

  return (
    <div className="composer-page">
      <style>{`
        .composer-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .composer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px 0;
          flex-shrink: 0;
        }
        .composer-title {
          font-family: var(--font-display);
          font-size: 28px;
          letter-spacing: 2px;
          color: var(--lk-white);
          margin: 0;
        }
        .tab-bar {
          display: flex;
          gap: 4px;
          margin-top: 12px;
          border-bottom: 1px solid var(--lk-subtle);
          padding: 0 32px;
          flex-shrink: 0;
        }
        .tab-btn {
          padding: 10px 20px;
          font-family: var(--font-heading);
          font-size: 11px;
          letter-spacing: 2px;
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
        .tab-btn:hover { color: var(--lk-white); }
        .tab-btn.active {
          color: var(--lk-pink);
          border-bottom-color: var(--lk-pink);
        }
        .tab-content {
          flex: 1;
          overflow: hidden;
        }
        /* Drums tab */
        .drums-layout {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .drums-topbar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          border-bottom: 1px solid var(--lk-subtle);
          background: var(--lk-deep);
          flex-shrink: 0;
        }
        .drums-topbar-label {
          font-family: var(--font-heading);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
        }
        .drums-grid-wrapper {
          flex: 1;
          overflow: auto;
          padding: 20px;
        }
        /* Bass tab */
        .bass-layout {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .bass-topbar {
          padding: 16px 24px;
          border-bottom: 1px solid var(--lk-subtle);
          background: var(--lk-deep);
        }
        .bass-topbar-label {
          font-family: var(--font-heading);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
        }
        .bass-grid-wrapper {
          flex: 1;
          overflow: auto;
          padding: 20px;
        }
        /* Rehearsal tab */
        .rehearsal-wrapper {
          height: 100%;
          overflow: hidden;
        }
      `}</style>

      <header className="composer-header">
        <h1 className="composer-title">Composer Tools</h1>
      </header>

      <nav className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === 'songwriter' && (
          <SongEditor
            onSave={(song) => {
              setSongData(song)
              console.log('Song saved:', song.title, song.bpm, 'BPM', song.sections.length, 'sections')
            }}
          />
        )}

        {activeTab === 'drums' && (
          <div className="drums-layout">
            <div className="drums-topbar">
              <span className="drums-topbar-label">Drum Pattern Editor</span>
              <div style={{ flex: 1 }} />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowPatternLibrary(true)}
              >
                📚 Pattern Library
              </button>
            </div>
            <div className="drums-grid-wrapper">
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

        {activeTab === 'bass' && (
          <div className="bass-layout">
            <div className="bass-topbar">
              <span className="bass-topbar-label">Bass Tab Editor</span>
            </div>
            <div className="bass-grid-wrapper">
              <BassTab />
            </div>
          </div>
        )}

        {activeTab === 'rehearsal' && (
          <div className="rehearsal-wrapper">
            <RehearsalMode
              title={DEMO_REHEARSAL_DATA.title}
              artist={DEMO_REHEARSAL_DATA.artist}
              bpm={DEMO_REHEARSAL_DATA.bpm}
              timeSignature={DEMO_REHEARSAL_DATA.timeSignature}
              sections={DEMO_REHEARSAL_DATA.sections}
              chordProgression={DEMO_REHEARSAL_DATA.chordProgression}
            />
          </div>
        )}
      </div>
    </div>
  )
}