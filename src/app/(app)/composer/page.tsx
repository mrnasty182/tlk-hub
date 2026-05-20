'use client'

import { useState } from 'react'
import SongEditor from '@/components/SongEditor'
import SongArranger from '@/components/SongArranger'
import DrummerGrid from '@/components/DrummerGrid'
import BassTab from '@/components/BassTab'
import RehearsalMode from '@/components/RehearsalMode'
import PatternLibrary from '@/components/PatternLibrary'
import ScaleExplorer from '@/components/ScaleExplorer'
import ChordPanel from '@/components/ChordPanel'

type ComposerTab = 'songwriter' | 'drums' | 'bass' | 'rehearsal'

const DEMO_SONG_CONTENT = `{title: Stay Hard}
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
We are the lion kings`

const DEMO_REHEARSAL_DATA = {
  title: 'Demo Song',
  artist: 'The Loin Kings',
  bpm: 120,
  timeSignature: '4/4' as const,
  sections: [
    { id: 's1', name: 'Intro', type: 'intro' as const, bars: 4, startBar: 0 },
    { id: 's2', name: 'Verse 1', type: 'verse' as const, bars: 8, startBar: 4 },
    { id: 's3', name: 'Chorus', type: 'chorus' as const, bars: 8, startBar: 12 },
  ],
  chordProgression: [
    { bar: 1, chord: 'A' },
    { bar: 2, chord: 'E' },
    { bar: 3, chord: 'F#m' },
    { bar: 4, chord: 'D' },
    { bar: 5, chord: 'A' },
    { bar: 6, chord: 'E' },
    { bar: 7, chord: 'F#m' },
    { bar: 8, chord: 'D' },
    { bar: 9, chord: 'D' },
    { bar: 10, chord: 'A' },
    { bar: 11, chord: 'E' },
    { bar: 12, chord: 'F#m' },
    { bar: 13, chord: 'D' },
    { bar: 14, chord: 'A' },
    { bar: 15, chord: 'E' },
    { bar: 16, chord: 'F#m' },
  ],
}

export default function ComposerPage() {
  const [activeTab, setActiveTab] = useState<ComposerTab>('songwriter')
  const [songContent, setSongContent] = useState(DEMO_SONG_CONTENT)
  const [selectedChord, setSelectedChord] = useState<string>('A')
  const [drumPatternData, setDrumPatternData] = useState<any>(null)
  const [showPatternLibrary, setShowPatternLibrary] = useState(false)

  const tabs: { id: ComposerTab; label: string }[] = [
    { id: 'songwriter', label: '✍️ Songwriter' },
    { id: 'drums', label: '🥁 Drums' },
    { id: 'bass', label: '🎸 Bass' },
    { id: 'rehearsal', label: '🎤 Rehearsal' },
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
          padding: 20px 32px 0;
          flex-shrink: 0;
        }
        .composer-title {
          font-family: var(--font-display);
          font-size: 32px;
          letter-spacing: 2px;
          color: var(--lk-white);
          margin: 0;
        }
        .tab-bar {
          display: flex;
          gap: 4px;
          margin-top: 16px;
          border-bottom: 1px solid var(--lk-subtle);
          padding: 0 32px;
          flex-shrink: 0;
        }
        .tab-btn {
          padding: 12px 24px;
          font-family: var(--font-heading);
          font-size: 12px;
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
        .tab-btn:hover {
          color: var(--lk-white);
        }
        .tab-btn.active {
          color: var(--lk-pink);
          border-bottom-color: var(--lk-pink);
        }
        .tab-content {
          flex: 1;
          overflow: hidden;
        }
        .songwriter-layout {
          display: grid;
          grid-template-columns: 1fr 1fr 300px;
          height: 100%;
          gap: 0;
          overflow: hidden;
        }
        .songwriter-left {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-right: 1px solid var(--lk-subtle);
        }
        .songwriter-center {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-right: 1px solid var(--lk-subtle);
        }
        .songwriter-right {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--lk-void);
        }
        .panel-section {
          padding: 20px;
          border-bottom: 1px solid var(--lk-subtle);
          flex-shrink: 0;
        }
        .panel-section-title {
          font-family: var(--font-heading);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--lk-muted);
          margin: 0 0 12px;
        }
        .panel-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 0 20px 20px;
        }
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
        .drums-grid-wrapper {
          flex: 1;
          overflow: auto;
          padding: 20px;
        }
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
          flex-shrink: 0;
        }
        .bass-grid-wrapper {
          flex: 1;
          overflow: auto;
          padding: 20px;
        }
        .rehearsal-wrapper {
          height: 100%;
          overflow: hidden;
        }
        .chord-tap-hint {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--lk-muted);
          padding: 8px 12px;
          background: var(--lk-deep);
          border-radius: 6px;
          margin-bottom: 12px;
          text-align: center;
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
          <div className="songwriter-layout">
            <div className="songwriter-left">
              <div className="panel-section">
                <p className="panel-section-title">Song Editor</p>
                <div className="chord-tap-hint">Click any chord in the editor to highlight it</div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
                <SongEditor
                  initialContent={songContent}
                  onSave={(content) => setSongContent(content)}
                  onChordTap={(chord) => setSelectedChord(chord)}
                />
              </div>
            </div>
            <div className="songwriter-center">
              <div className="panel-section">
                <p className="panel-section-title">Song Arranger</p>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <SongArranger
                  content={songContent}
                  onChordClick={(chord) => setSelectedChord(chord)}
                />
              </div>
            </div>
            <div className="songwriter-right">
              <div className="panel-section">
                <p className="panel-section-title">Scale Explorer</p>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
                <ScaleExplorer
                  autoRoot={selectedChord.replace(/[0-9]/g, '').replace('m', '').replace('M', '') || 'A'}
                  onChordTap={(chord) => setSelectedChord(chord)}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--lk-subtle)' }}>
                <div className="panel-section">
                  <p className="panel-section-title">Chord Reference</p>
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  <ChordPanel
                    chord={selectedChord}
                    autoRoot={selectedChord.replace(/[0-9]/g, '').replace('m', '').replace('M', '') || 'A'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drums' && (
          <div className="drums-layout">
            <div className="drums-topbar">
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--lk-muted)',
              }}>Drum Pattern Editor</span>
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
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--lk-muted)',
              }}>Bass Tab Editor</span>
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