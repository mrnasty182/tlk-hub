'use client';

import { useState } from 'react';

export default function Composer() {
  const [chordProgression, setChordProgression] = useState<string[]>(['I', 'IV', 'V', 'I']);
  const [selectedKey, setSelectedKey] = useState('C');

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const progressions = [
    { name: 'I - IV - V - I', chords: ['I', 'IV', 'V', 'I'] },
    { name: 'I - V - vi - IV', chords: ['I', 'V', 'vi', 'IV'] },
    { name: 'ii - V - I', chords: ['ii', 'V', 'I'] },
    { name: 'I - vi - IV - V', chords: ['I', 'vi', 'IV', 'V'] },
  ];

  const applyProgression = (prog: typeof progressions[0]) => {
    setChordProgression([...prog.chords]);
  };

  return (
    <div className="composer-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Composer Tools</h1>
          <p className="page-subtitle">Write and develop your songs</p>
        </div>
      </header>

      <div className="composer-grid">
        <section className="composer-card">
          <h2 className="card-title">🎼 Key Selector</h2>
          <div className="key-grid">
            {keys.map(key => (
              <button
                key={key}
                className={`key-btn ${selectedKey === key ? 'active' : ''}`}
                onClick={() => setSelectedKey(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="selected-key-display">
            <span className="key-label">Current Key:</span>
            <span className="key-value">{selectedKey} Major</span>
          </div>
        </section>

        <section className="composer-card">
          <h2 className="card-title">📊 Chord Progressions</h2>
          <div className="progression-list">
            {progressions.map((prog, i) => (
              <button 
                key={i} 
                className="progression-btn"
                onClick={() => applyProgression(prog)}
              >
                <span className="prog-name">{prog.name}</span>
                <span className="prog-chords">{prog.chords.join(' → ')}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="composer-card progression-display">
          <h2 className="card-title">Current Progression</h2>
          <div className="chord-display">
            {chordProgression.map((chord, i) => (
              <div key={i} className="chord-box">
                <span className="chord-numeral">{chord}</span>
                <span className="chord-name">{selectedKey}{chord.replace(/[IVXi]/g, (m: string) => {
                  const map: Record<string, string> = { 'I': '', 'ii': 'm', 'IV': '', 'V': '', 'vi': 'm', 'III': '', 'VII': '' };
                  return map[m] || '';
                })}</span>
              </div>
            ))}
          </div>
          <div className="chord-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setChordProgression([...chordProgression, 'I'])}>
              + Add Chord
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setChordProgression(chordProgression.slice(0, -1))}>
              - Remove
            </button>
          </div>
        </section>

        <section className="composer-card">
          <h2 className="card-title">✍️ Lyric Ideas</h2>
          <textarea 
            className="lyric-input"
            placeholder="Start writing your lyrics here..."
            rows={8}
          ></textarea>
          <div className="lyric-actions">
            <button className="btn btn-primary btn-sm">Save Draft</button>
            <button className="btn btn-ghost btn-sm">Clear</button>
          </div>
        </section>
      </div>

      <style>{`
        .composer-page {
          padding: 32px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
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
        .composer-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .composer-card {
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 16px;
          padding: 24px;
        }
        .card-title {
          font-family: var(--font-heading);
          font-size: 16px;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }
        .key-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin-bottom: 20px;
        }
        .key-btn {
          padding: 12px;
          background: var(--lk-deep);
          border: 1px solid var(--lk-subtle);
          border-radius: 8px;
          color: var(--lk-muted);
          font-family: var(--font-mono);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .key-btn:hover {
          border-color: var(--lk-pink);
          color: var(--lk-white);
        }
        .key-btn.active {
          background: var(--lk-pink);
          border-color: var(--lk-pink);
          color: var(--lk-black);
        }
        .selected-key-display {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          background: var(--lk-deep);
          border-radius: 8px;
        }
        .key-label {
          color: var(--lk-muted);
          font-size: 13px;
        }
        .key-value {
          font-family: var(--font-mono);
          color: var(--lk-gold);
        }
        .progression-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .progression-btn {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          background: var(--lk-deep);
          border: 1px solid var(--lk-subtle);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }
        .progression-btn:hover {
          border-color: var(--lk-teal);
        }
        .prog-name {
          font-family: var(--font-heading);
          font-size: 14px;
          color: var(--lk-white);
        }
        .prog-chords {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--lk-teal);
        }
        .progression-display {
          grid-column: span 2;
        }
        .chord-display {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .chord-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, rgba(123,47,190,0.2), rgba(255,45,155,0.1));
          border: 1px solid var(--lk-violet);
          border-radius: 12px;
        }
        .chord-numeral {
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--lk-pink);
          margin-bottom: 4px;
        }
        .chord-name {
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--lk-teal);
        }
        .chord-actions {
          display: flex;
          gap: 12px;
        }
        .lyric-input {
          width: 100%;
          background: var(--lk-deep);
          border: 1px solid var(--lk-subtle);
          border-radius: 8px;
          padding: 16px;
          color: var(--lk-white);
          font-family: var(--font-body);
          font-size: 14px;
          resize: vertical;
          margin-bottom: 16px;
        }
        .lyric-input:focus {
          outline: none;
          border-color: var(--lk-pink);
        }
        .lyric-actions {
          display: flex;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}