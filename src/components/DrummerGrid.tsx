'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DrumGridData } from '@/lib/types';

interface DrummerGridProps {
  bpm?: number;
  initial?: DrumGridData | null;
  onChange?: (data: DrumGridData) => void;
}

const ROWS = ['Kick', 'Snare', 'HiHat', 'Tom'] as const;
const STEPS = 16;
const DEFAULT_BPM = 120;

const COLORS = {
  pink: '#FF2D9B',
  teal: '#00E5CC',
  violet: '#7B2FBE',
  gold: '#F0C040',
  black: '#08060F',
  padInactive: '#1E1830',
  labelGray: '#6B6180',
};

function hitsFromInitial(initial?: DrumGridData | null): Record<string, Set<number>> {
  const base: Record<string, Set<number>> = {
    Kick: new Set(), Snare: new Set(), HiHat: new Set(), Tom: new Set(),
  };
  if (!initial?.hits) return base;
  for (const row of ROWS) {
    base[row] = new Set(initial.hits[row] ?? []);
  }
  return base;
}

export default function DrummerGrid({ bpm = DEFAULT_BPM, initial = null, onChange }: DrummerGridProps) {
  const [activePads, setActivePads] = useState<Record<string, Set<number>>>(() => hitsFromInitial(initial));
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Re-seed when initial changes (e.g. user switches active section)
  useEffect(() => {
    setActivePads(hitsFromInitial(initial));
    setIsPlaying(false);
    setCurrentStep(-1);
  }, [initial?.hits?.Kick?.length, initial?.hits?.Snare?.length, initial?.hits?.HiHat?.length, initial?.hits?.Tom?.length, initial?.bpm]);

  // Emit pattern changes back to parent
  useEffect(() => {
    if (!onChangeRef.current) return;
    const hits: Record<string, number[]> = {};
    for (const row of ROWS) {
      hits[row] = Array.from(activePads[row]).sort((a, b) => a - b);
    }
    onChangeRef.current({ bpm, timeSig: '4/4', hits });
    // We intentionally do NOT include `bpm` in deps — BPM lives at the song level,
    // and we don't want to re-emit on every bpm render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePads]);

  const stepInterval = 60000 / bpm / 4;

  const togglePad = useCallback((row: string, step: number) => {
    setActivePads((prev) => {
      const newSet = new Set(prev[row]);
      if (newSet.has(step)) {
        newSet.delete(step);
      } else {
        newSet.add(step);
      }
      return { ...prev, [row]: newSet };
    });
  }, []);

  const handlePlayStop = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS);
    }, stepInterval);

    return () => clearInterval(intervalId);
  }, [isPlaying, stepInterval]);

  const renderBeatMarkers = () => {
    return (
      <div style={styles.beatRow}>
        <div style={styles.rowLabelPlaceholder} />
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            style={{
              ...styles.beatMarker,
              ...(i % 4 === 0 ? styles.barLine : {}),
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    );
  };

  const renderGrid = () => {
    return ROWS.map((row) => (
      <div key={row} style={styles.gridRow}>
        <div style={styles.rowLabel}>{row}</div>
        {Array.from({ length: STEPS }, (_, step) => {
          const isActive = activePads[row].has(step);
          const isCurrent = currentStep === step;
          return (
            <div
              key={step}
              onClick={() => togglePad(row, step)}
              style={{
                ...styles.pad,
                ...(isActive ? styles.padActive : styles.padInactive),
                ...(isCurrent ? styles.padCurrent : {}),
                ...(step % 4 === 0 ? styles.barLineRight : {}),
              }}
            />
          );
        })}
      </div>
    ));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>DRUMMER GRID</div>
        <div style={styles.controls}>
          <span style={styles.bpmDisplay}>{bpm} BPM</span>
          <button onClick={handlePlayStop} style={styles.playButton}>
            {isPlaying ? '■ STOP' : '▶ PLAY'}
          </button>
          <button onClick={handleReset} style={styles.resetButton}>
            ↺ RESET
          </button>
        </div>
      </div>

      <div style={styles.gridWrapper}>
        {currentStep >= 0 && isPlaying && (
          <div
            style={{
              ...styles.stepHighlight,
              left: 48 + currentStep * 28 + (Math.floor(currentStep / 4) * 2),
            }}
          />
        )}
        {renderBeatMarkers()}
        {renderGrid()}
      </div>

      <div style={styles.footer}>
        <span style={styles.hint}>Click pads to toggle • 16-step sequencer</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Space Mono', 'Courier New', monospace",
    backgroundColor: COLORS.black,
    border: `1px solid ${COLORS.violet}`,
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    maxWidth: '520px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  title: {
    color: COLORS.teal,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '2px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bpmDisplay: {
    color: COLORS.gold,
    fontSize: '10px',
  },
  playButton: {
    backgroundColor: COLORS.pink,
    color: COLORS.black,
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
  },
  resetButton: {
    backgroundColor: 'transparent',
    color: COLORS.labelGray,
    border: `1px solid ${COLORS.labelGray}`,
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '10px',
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
  },
  gridWrapper: {
    position: 'relative',
  },
  stepHighlight: {
    position: 'absolute',
    top: '20px',
    width: '28px',
    height: 'calc(4 * 28px + 3 * 2px)',
    backgroundColor: 'rgba(0, 229, 204, 0.15)',
    borderRadius: '3px',
    pointerEvents: 'none',
    zIndex: 0,
    transition: 'left 0.05s linear',
  },
  beatRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2px',
  },
  rowLabelPlaceholder: {
    width: '48px',
    flexShrink: 0,
  },
  beatMarker: {
    width: '28px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    color: COLORS.labelGray,
    flexShrink: 0,
  },
  gridRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2px',
  },
  rowLabel: {
    width: '48px',
    fontSize: '10px',
    color: COLORS.labelGray,
    flexShrink: 0,
    textAlign: 'right',
    paddingRight: '8px',
  },
  pad: {
    width: '28px',
    height: '28px',
    borderRadius: '3px',
    cursor: 'pointer',
    flexShrink: 0,
    marginRight: '2px',
    transition: 'background-color 0.1s, box-shadow 0.1s',
  },
  padInactive: {
    backgroundColor: COLORS.padInactive,
    border: '1px solid #2A2040',
  },
  padActive: {
    backgroundColor: COLORS.pink,
    border: '1px solid COLORS.pink',
    boxShadow: `0 0 8px ${COLORS.pink}, 0 0 16px rgba(255, 45, 155, 0.4)`,
  },
  padCurrent: {
    border: `2px solid ${COLORS.teal}`,
    boxShadow: `0 0 6px ${COLORS.teal}`,
  },
  barLine: {
    borderLeft: `1px solid ${COLORS.violet}`,
    marginLeft: '1px',
  },
  barLineRight: {
    borderRight: `1px solid ${COLORS.violet}`,
    marginRight: '1px',
  },
  footer: {
    marginTop: '8px',
    textAlign: 'center',
  },
  hint: {
    fontSize: '9px',
    color: COLORS.labelGray,
  },
};
