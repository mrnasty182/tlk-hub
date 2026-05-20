'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Section {
  name: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'solo' | 'break';
  bars: number;
  startBar: number;
}

interface ChordProgressionEntry {
  bar: number;
  chord: string;
}

interface RehearsalModeProps {
  title: string;
  artist: string;
  bpm: number;
  timeSignature: string; // e.g. "4/4", "3/4", "6/8"
  sections: Section[];
  chordProgression: ChordProgressionEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBeatsPerBar(timeSignature: string): number {
  switch (timeSignature) {
    case '3/4': return 3;
    case '6/8': return 6;
    case '4/4':
    default:    return 4;
  }
}

function getBarDurationSeconds(bpm: number, timeSignature: string): number {
  const beatsPerBar = getBeatsPerBar(timeSignature);
  return (60 / bpm) * beatsPerBar;
}

function getTotalBars(sections: Section[]): number {
  if (!sections.length) return 0;
  const last = sections[sections.length - 1];
  return last.startBar + last.bars - 1;
}

function getCurrentSectionIndex(bar: number, sections: Section[]): number {
  for (let i = sections.length - 1; i >= 0; i--) {
    if (bar >= sections[i].startBar) return i;
  }
  return 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RehearsalMode({
  title,
  artist,
  bpm: initialBpm,
  timeSignature,
  sections,
  chordProgression,
}: RehearsalModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBar, setCurrentBar] = useState(1);
  const [bpm, setBpm] = useState(initialBpm);
  const [barProgress, setBarProgress] = useState(0); // 0-1 within current bar

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pausedAtBarRef = useRef<number | null>(null);
  const pausedAtProgressRef = useRef<number | null>(null);
  const pausedBpmRef = useRef<number>(bpm);

  const totalBars = getTotalBars(sections);
  const beatsPerBar = getBeatsPerBar(timeSignature);
  const barDuration = getBarDurationSeconds(bpm, timeSignature);
  const currentSectionIdx = getCurrentSectionIndex(currentBar, sections);
  const currentSection = sections[currentSectionIdx] ?? sections[0];
  const nextSectionIdx = Math.min(currentSectionIdx + 1, sections.length - 1);
  const nextSection = sections[nextSectionIdx];

  // Determine bars remaining in current section
  const barsInCurrentSection = currentSection
    ? currentSection.startBar + currentSection.bars - currentBar
    : 0;

  const currentChord = chordProgression.find(c => c.bar === currentBar)?.chord ?? '–';

  // ── Tick ─────────────────────────────────────────────────────────────────

  const tick = useCallback((timestamp: number) => {
    if (!startTimeRef.current) return;

    const elapsed = (timestamp - startTimeRef.current) / 1000;
    const barElapsed = elapsed % barDuration;
    const progress = barElapsed / barDuration;

    // Current bar number (1-indexed)
    const barsElapsed = Math.floor(elapsed / barDuration);
    let bar = barsElapsed + 1;

    // Clamp to total
    if (bar > totalBars) {
      bar = totalBars;
      setCurrentBar(bar);
      setBarProgress(1);
      setIsPlaying(false);
      return;
    }

    setCurrentBar(bar);
    setBarProgress(progress);

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [barDuration, totalBars]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now() - (barProgress * barDuration * 1000);
      pausedAtBarRef.current = null;
      pausedAtProgressRef.current = null;
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      pausedAtBarRef.current = currentBar;
      pausedAtProgressRef.current = barProgress;
      pausedBpmRef.current = bpm;
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, tick, barProgress, barDuration, currentBar, bpm]);

  // Re-sync when BPM changes during playback
  useEffect(() => {
    if (isPlaying && pausedAtBarRef.current !== null) {
      // Resume from paused position with new BPM
      startTimeRef.current = performance.now() - (pausedAtProgressRef.current! * (60 / bpm) * beatsPerBar * 1000);
    }
  }, [bpm, isPlaying, beatsPerBar]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const handlePlayPause = () => setIsPlaying(p => !p);

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentBar(1);
    setBarProgress(0);
    startTimeRef.current = null;
    pausedAtBarRef.current = null;
    pausedAtProgressRef.current = null;
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentBar(1);
    setBarProgress(0);
    startTimeRef.current = null;
    pausedAtBarRef.current = null;
    pausedAtProgressRef.current = null;
    setTimeout(() => setIsPlaying(true), 50);
  };

  const adjustBpm = (delta: number) => setBpm(p => Math.max(20, Math.min(300, p + delta)));

  // ── Section type label ────────────────────────────────────────────────────

  const sectionTypeColors: Record<string, string> = {
    intro:   'var(--lk-teal)',
    verse:   'var(--lk-pink)',
    chorus:  'var(--lk-gold)',
    bridge:  'var(--lk-violet-mid)',
    outro:   'var(--lk-teal)',
    solo:    'var(--lk-pink-glow)',
    break:   'var(--lk-gold)',
  };

  const sectionColor = sectionTypeColors[currentSection?.type] ?? 'var(--lk-pink)';

  // ── Countdown label ────────────────────────────────────────────────────────

  const secondsRemaining = Math.ceil((1 - barProgress) * barDuration);

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--lk-black)',
      color: 'var(--lk-white)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-display)',
      userSelect: 'none',
    }}>
      {/* ── TOP BAR: BPM + Controls ──────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        borderBottom: '1px solid var(--lk-subtle)',
      }}>
        {/* BPM Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--lk-muted)',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>BPM</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
          }}>
            <button
              onClick={() => adjustBpm(-1)}
              style={{
                background: 'transparent',
                border: '1px solid var(--lk-subtle)',
                color: 'var(--lk-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                width: 36,
                height: 36,
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
              }}
            >−</button>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              color: 'var(--lk-teal)',
              minWidth: 72,
              textAlign: 'center',
              letterSpacing: 2,
              background: 'var(--lk-void)',
              borderTop: '1px solid var(--lk-subtle)',
              borderBottom: '1px solid var(--lk-subtle)',
              lineHeight: '36px',
            }}>{bpm}</span>
            <button
              onClick={() => adjustBpm(1)}
              style={{
                background: 'transparent',
                border: '1px solid var(--lk-subtle)',
                borderLeft: 'none',
                color: 'var(--lk-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                width: 36,
                height: 36,
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer',
              }}
            >+</button>
          </div>
          <button
            onClick={() => adjustBpm(-5)}
            style={{
              background: 'transparent',
              border: '1px solid var(--lk-subtle)',
              color: 'var(--lk-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              width: 36,
              height: 36,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >−5</button>
          <button
            onClick={() => adjustBpm(5)}
            style={{
              background: 'transparent',
              border: '1px solid var(--lk-subtle)',
              color: 'var(--lk-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              width: 36,
              height: 36,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >+5</button>
        </div>

        {/* Transport Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleRestart}
            style={{
              background: 'transparent',
              border: '1px solid var(--lk-subtle)',
              color: 'var(--lk-muted)',
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              letterSpacing: 2,
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >Restart</button>
          <button
            onClick={handleStop}
            style={{
              background: 'var(--lk-void)',
              border: '1px solid var(--lk-pink-dim)',
              color: 'var(--lk-pink)',
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              letterSpacing: 2,
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >Stop</button>
          <button
            onClick={handlePlayPause}
            style={{
              background: isPlaying ? 'var(--lk-pink-dim)' : 'var(--lk-pink)',
              border: 'none',
              color: 'var(--lk-black)',
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              letterSpacing: 2,
              padding: '10px 28px',
              borderRadius: 8,
              cursor: 'pointer',
              textTransform: 'uppercase',
              minWidth: 100,
            }}
          >{isPlaying ? 'Pause' : 'Play'}</button>
        </div>

        {/* Time signature */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          color: 'var(--lk-muted)',
          letterSpacing: 1,
        }}>
          {timeSignature}
        </div>
      </div>

      {/* ── MAIN STAGE ───────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        gap: 32,
      }}>
        {/* Song info */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            letterSpacing: 4,
            color: 'var(--lk-muted)',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>{artist}</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            letterSpacing: 3,
            color: 'var(--lk-white)',
          }}>{title}</div>
        </div>

        {/* Section + Bar */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 80,
            letterSpacing: 6,
            lineHeight: 1,
            color: sectionColor,
            textShadow: `0 0 40px ${sectionColor}66`,
          }}>{currentSection?.name ?? '–'}</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 20,
            letterSpacing: 4,
            color: 'var(--lk-muted)',
            marginTop: 8,
          }}>
            Bar {currentBar} <span style={{ color: 'var(--lk-subtle)' }}>/</span> {totalBars}
          </div>
        </div>

        {/* Chord */}
        <div style={{
          textAlign: 'center',
          marginTop: 8,
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 110,
            letterSpacing: 8,
            lineHeight: 1,
            color: 'var(--lk-gold)',
            textShadow: '0 0 60px rgba(240, 192, 64, 0.35)',
          }}>{currentChord}</div>
        </div>

        {/* Countdown to next section */}
        {barsInCurrentSection > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: 8,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: 3,
              color: 'var(--lk-muted)',
              textTransform: 'uppercase',
            }}>Next: {nextSection?.name}</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 52,
              letterSpacing: 4,
              color: 'var(--lk-violet-mid)',
            }}>
              {barsInCurrentSection} bar{barsInCurrentSection !== 1 ? 's' : ''}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--lk-muted)',
              letterSpacing: 2,
            }}>
              {secondsRemaining}s remaining
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM: Progress bar ────────────────────────────────────────────── */}
      <div style={{
        padding: '0 0 40px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
      }}>
        {/* Bar countdown progress */}
        <div style={{
          width: '100%',
          maxWidth: 800,
          height: 8,
          background: 'var(--lk-void)',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid var(--lk-subtle)',
        }}>
          <div style={{
            height: '100%',
            width: `${(1 - barProgress) * 100}%`,
            background: `linear-gradient(90deg, ${sectionColor}, ${sectionColor}aa)`,
            borderRadius: 4,
            transition: 'width 0.05s linear',
            boxShadow: `0 0 12px ${sectionColor}66`,
          }} />
        </div>

        {/* Bar number progress dots */}
        <div style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          maxWidth: 800,
          width: '100%',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {Array.from({ length: Math.min(totalBars, 64) }, (_, i) => {
            const barNum = i + 1;
            const secIdx = getCurrentSectionIndex(barNum, sections);
            const sec = sections[secIdx];
            const secColor = sectionTypeColors[sec?.type] ?? 'var(--lk-muted)';
            const isCurrent = barNum === currentBar;
            const isPast = barNum < currentBar;
            return (
              <div
                key={barNum}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isPast ? secColor : isCurrent ? secColor : 'var(--lk-subtle)',
                  boxShadow: isCurrent ? `0 0 8px ${secColor}` : 'none',
                  transform: isCurrent ? 'scale(1.4)' : 'scale(1)',
                  transition: 'all 0.2s',
                  border: isCurrent ? `1px solid ${secColor}` : 'none',
                }}
              />
            );
          })}
          {totalBars > 64 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--lk-muted)' }}>
              +{totalBars - 64}
            </span>
          )}
        </div>

        {/* Section type label */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 3,
          color: 'var(--lk-muted)',
          textTransform: 'uppercase',
        }}>
          {currentSection?.type ?? 'section'}
        </div>
      </div>
    </div>
  );
}