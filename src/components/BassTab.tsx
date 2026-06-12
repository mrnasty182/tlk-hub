'use client';

import { useState, useCallback } from 'react';

const STRINGS = ['E', 'A', 'D', 'G'];
const NUM_FRETS = 12;
const FRET_MARKERS = [3, 5, 7, 9];

const KEYS = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

const NOTE_LABELS: Record<string, string> = {
  E: 'E2',
  A: 'A2',
  D: 'D3',
  G: 'G3',
};

type NoteMap = Record<number, Set<number>>; // string index -> set of fret indices

interface BassTabProps {
  songKey?: string;
  initialData?: NoteMap;
}

export default function BassTab({ songKey: initialKey = 'A', initialData }: BassTabProps) {
  const [selectedNotes, setSelectedNotes] = useState<NoteMap>(() => {
    if (initialData) return initialData;
    return {};
  });
  const [currentKey, setCurrentKey] = useState(initialKey);
  const [bpm] = useState(120);

  const toggleNote = useCallback((stringIdx: number, fretIdx: number) => {
    setSelectedNotes((prev) => {
      const updated = { ...prev };
      if (!updated[stringIdx]) updated[stringIdx] = new Set();
      const newSet = new Set(updated[stringIdx]);
      if (newSet.has(fretIdx)) {
        newSet.delete(fretIdx);
      } else {
        newSet.add(fretIdx);
      }
      if (newSet.size === 0) {
        delete updated[stringIdx];
      } else {
        updated[stringIdx] = newSet;
      }
      return updated;
    });
  }, []);

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#130E20',
    borderRadius: 12,
    padding: '20px 16px 16px',
    fontFamily: "'Space Mono', monospace",
    userSelect: 'none',
    border: '1px solid #2A2040',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  };

  const titleStyle: React.CSSProperties = {
    color: '#FF2D9B',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1,
  };

  const bpmStyle: React.CSSProperties = {
    color: '#F0C040',
    fontSize: 12,
    fontFamily: "'Space Mono', monospace",
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
    flexWrap: 'wrap',
  };

  const keyBtnStyle = (isActive: boolean): React.CSSProperties => ({
    backgroundColor: isActive ? '#FF2D9B' : 'transparent',
    color: isActive ? '#08060F' : '#6B6180',
    border: `1px solid ${isActive ? '#FF2D9B' : '#2A2040'}`,
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 10,
    fontFamily: "'Space Mono', monospace",
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const fretboardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    position: 'relative',
  };

  const stringRowStyle = (idx: number): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    height: 44,
    position: 'relative',
  });

  const openStringLabelStyle: React.CSSProperties = {
    width: 28,
    color: '#00E5CC',
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    flexShrink: 0,
  };

  const fretAreaStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    position: 'relative',
  };

  const fretCellStyle = (isMarker: boolean, fretIdx: number): React.CSSProperties => ({
    width: 48,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: isMarker ? '#0A0815' : '#130E20',
    borderLeft: fretIdx > 0 ? '1px solid #1E1830' : '1px solid #2A2040',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
  });

  const noteDotStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#FF2D9B',
    boxShadow: '0 0 12px #FF2D9B88, 0 0 24px #FF2D9B44',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    color: '#08060F',
    fontWeight: 700,
  };

  const markerDotStyle: React.CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#2A2040',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  };

  const fretNumberRowStyle: React.CSSProperties = {
    display: 'flex',
    marginLeft: 28,
  };

  const fretNumberStyle: React.CSSProperties = {
    width: 48,
    textAlign: 'center',
    color: '#6B6180',
    fontSize: 9,
    paddingTop: 6,
    borderLeft: '1px solid transparent',
  };

  const nutStyle: React.CSSProperties = {
    position: 'absolute',
    left: 27,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#F0C040',
    borderRadius: 2,
    zIndex: 2,
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
      `}</style>

      <div style={headerStyle}>
        <span style={titleStyle}>BASS TAB</span>
        <span style={bpmStyle}>{bpm} BPM</span>
      </div>

      <div style={toolbarStyle}>
        {KEYS.map((key) => (
          <button
            key={key}
            style={keyBtnStyle(currentKey === key)}
            onClick={() => setCurrentKey(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div style={fretboardStyle}>
        <div style={nutStyle} />

        {STRINGS.map((string, stringIdx) => (
          <div key={string} style={stringRowStyle(stringIdx)}>
            <div style={openStringLabelStyle}>
              {NOTE_LABELS[string]}
            </div>

            <div style={fretAreaStyle}>
              {Array.from({ length: NUM_FRETS }, (_, fretIdx) => {
                const isMarker = FRET_MARKERS.includes(fretIdx + 1);
                const hasNote = selectedNotes[stringIdx]?.has(fretIdx);

                return (
                  <div
                    key={fretIdx}
                    style={fretCellStyle(isMarker, fretIdx)}
                    onClick={() => toggleNote(stringIdx, fretIdx)}
                  >
                    {isMarker && !hasNote && <div style={markerDotStyle} />}
                    {hasNote && (
                      <div style={noteDotStyle}>
                        {fretIdx === 0 ? 'O' : fretIdx}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={fretNumberRowStyle}>
          {Array.from({ length: NUM_FRETS }, (_, i) => (
            <div key={i} style={fretNumberStyle}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}