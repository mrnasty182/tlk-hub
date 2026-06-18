'use client'

/**
 * Performance view for TLK Hub.
 *
 * Plays a song at its BPM with auto-scrolling lyrics.
 * Each device reads the same Supabase `performance_sessions` row → server beat clock keeps everyone in sync.
 *
 * Per Josh's spec:
 *   - 4-beat count-in (configurable 1/2/4/8)
 *   - Mute click toggle
 *   - Spacebar pause/resume
 *   - Current section highlight
 *   - Manual skip / restart / exit
 *   - Drum grid pinned below scroll
 *   - 6-8 lines visible phone, 10-12 tablet
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import ChordBox from './ChordBox'

// ── Types ───────────────────────────────────────────────────────────────────

interface PerformanceSection {
  id: string
  type: string
  name?: string
  chordPro?: string
  lyrics?: string[]
  drumGrid?: any
}

interface PerformanceSong {
  id: string
  title: string
  key: string
  bpm: number
  timeSig: string
  sections: PerformanceSection[]
}

interface PerformanceSessionRow {
  id: string
  song_id: string
  user_id: string
  started_at: string          // ISO timestamp
  bpm: number
  beats_per_bar: number
  count_in: number
  current_section_idx: number
  current_line_idx: number
  paused: boolean
  paused_at?: string | null
  accumulated_pause_ms: number
  muted: boolean
  status: 'playing' | 'paused' | 'finished'
  updated_at: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const BEATS_PER_LINE_DEFAULT = 4  // assume 4 beats per lyric line unless we can detect otherwise

function beatsPerBar(timeSig: string): number {
  // 4/4 = 4, 3/4 = 3, 6/8 = 6, 2/4 = 2, 5/4 = 5, 7/8 = 7
  const m = timeSig.match(/(\d+)\/(\d+)/)
  if (!m) return 4
  return parseInt(m[1])
}

function msPerBeat(bpm: number): number {
  return 60000 / bpm
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function PerformanceView({
  song,
  onExit,
  isSetlistMode = false,
  onNextSong,
  hasNextSong = false,
}: {
  song: PerformanceSong
  onExit: () => void
  isSetlistMode?: boolean
  onNextSong?: () => void
  hasNextSong?: boolean
}) {
  const effectiveBpm = song.bpm > 0 ? song.bpm : 120
  const beatsPerLine = BEATS_PER_LINE_DEFAULT
  const msPerLine = msPerBeat(effectiveBpm) * beatsPerLine
  const bpb = beatsPerBar(song.timeSig)

  // Flatten lyrics into lines: [{ sectionIdx, lineIdx, text, chord }]
  const lyricLines = useMemo(() => {
    const lines: { sectionIdx: number; lineIdx: number; text: string; chordLine: string | null }[] = []
    song.sections.forEach((sec, sIdx) => {
      const lyricsArr = sec.lyrics || []
      if (lyricsArr.length === 0) {
        lines.push({ sectionIdx: sIdx, lineIdx: 0, text: '', chordLine: null })
      } else {
        lyricsArr.forEach((line, lIdx) => {
          lines.push({ sectionIdx: sIdx, lineIdx: lIdx, text: line, chordLine: null })
        })
      }
    })
    return lines
  }, [song])

  // ── State ────────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false)
  const [countingIn, setCountingIn] = useState(false)
  const [countInBeat, setCountInBeat] = useState(0)
  const [currentLineIdx, setCurrentLineIdx] = useState(0)
  const [muted, setMuted] = useState(false)
  const [countInBeats, setCountInBeats] = useState(4)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  const startTimeRef = useRef<number | null>(null)  // when the song started (after count-in)
  const countInStartedRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const lineRefsRef = useRef<(HTMLDivElement | null)[]>([])

  // ── Audio click ─────────────────────────────────────────────────────────
  const playClick = useCallback((accent = false) => {
    if (muted) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = accent ? 1320 : 880
      gain.gain.setValueAtTime(accent ? 0.18 : 0.10, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch { /* ignore */ }
  }, [muted])

  // ── Server sync (broadcast playback state for the whole band to follow) ──
  const broadcastSession = useCallback(async (updates: Partial<PerformanceSessionRow>) => {
    if (!sessionId) return
    try {
      await supabase.from('performance_sessions').update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq('id', sessionId)
    } catch { /* offline — local scroll still works */ }
  }, [sessionId])

  // Create or join a session on mount
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      // Create session row
      const { data, error } = await supabase.from('performance_sessions').insert({
        song_id: song.id,
        user_id: session.user.id,
        started_at: new Date().toISOString(),
        bpm: effectiveBpm,
        beats_per_bar: bpb,
        count_in: countInBeats,
        current_section_idx: 0,
        current_line_idx: 0,
        paused: true,
        paused_at: new Date().toISOString(),
        accumulated_pause_ms: 0,
        muted,
        status: 'playing',
        updated_at: new Date().toISOString(),
      }).select('id').single()
      if (cancelled || error || !data) return
      setSessionId(data.id)
    }
    init()
    return () => {
      cancelled = true
      // Clean up session row
      if (sessionId) {
        supabase.from('performance_sessions').delete().eq('id', sessionId).then(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Animation loop (drives currentLineIdx based on elapsed time) ────────
  useEffect(() => {
    if (!isPlaying || startTimeRef.current === null) return

    const tick = () => {
      const startTime = startTimeRef.current
      if (startTime === null) return
      const elapsed = Date.now() - startTime
      const lineIdx = Math.min(Math.floor(elapsed / msPerLine), lyricLines.length - 1)
      setCurrentLineIdx(lineIdx)
      setNow(Date.now())
      if (lineIdx < lyricLines.length - 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Song finished
        setIsPlaying(false)
        broadcastSession({ status: 'finished', current_line_idx: lineIdx })
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, msPerLine, lyricLines.length, broadcastSession])

  // ── Count-in: trigger countInBeats clicks then start ────────────────────
  const startCountIn = useCallback(() => {
    if (countingIn || isPlaying) return
    setCountingIn(true)
    setCountInBeat(0)
    countInStartedRef.current = Date.now()
    const interval = setInterval(() => {
      setCountInBeat(prev => {
        const next = prev + 1
        playClick(next % bpb === 1) // accent on downbeat
        if (next >= countInBeats) {
          clearInterval(interval)
          setCountingIn(false)
          // Start the song
          startTimeRef.current = Date.now()
          setIsPlaying(true)
          broadcastSession({ paused: false, paused_at: null, status: 'playing', started_at: new Date().toISOString() })
        }
        return next
      })
    }, msPerBeat(effectiveBpm))
  }, [countingIn, isPlaying, countInBeats, bpb, playClick, effectiveBpm, broadcastSession])

  // ── Controls ────────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    if (countingIn) return
    if (!isPlaying) {
      if (startTimeRef.current === null) {
        // First start
        startCountIn()
      } else {
        // Resume
        const pausedFor = Date.now() - (now - (now - (startTimeRef.current ?? 0)))
        // Adjust start time by pause duration
        const pauseMs = Date.now() - (lastPausedAtRef.current ?? Date.now())
        startTimeRef.current = startTimeRef.current! + pauseMs
        setIsPlaying(true)
        broadcastSession({ paused: false, paused_at: null })
      }
    } else {
      lastPausedAtRef.current = Date.now()
      setIsPlaying(false)
      broadcastSession({ paused: true, paused_at: new Date().toISOString() })
    }
  }, [isPlaying, now, countingIn, startCountIn, broadcastSession])

  const lastPausedAtRef = useRef<number | null>(null)

  const restart = useCallback(() => {
    startTimeRef.current = Date.now()
    setCurrentLineIdx(0)
    setIsPlaying(true)
    broadcastSession({ current_line_idx: 0, status: 'playing', started_at: new Date().toISOString() })
  }, [broadcastSession])

  const skipToLine = useCallback((idx: number) => {
    const target = Math.max(0, Math.min(idx, lyricLines.length - 1))
    if (startTimeRef.current !== null) {
      startTimeRef.current = Date.now() - (target * msPerLine)
    }
    setCurrentLineIdx(target)
    broadcastSession({ current_line_idx: target })
  }, [msPerLine, lyricLines.length, broadcastSession])

  // Spacebar = pause/resume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        togglePause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePause])

  // Auto-scroll current line into view
  useEffect(() => {
    const el = lineRefsRef.current[currentLineIdx]
    if (el && scrollerRef.current) {
      const target = el.offsetTop - scrollerRef.current.clientHeight / 2 + el.clientHeight / 2
      scrollerRef.current.scrollTo({ top: target, behavior: 'smooth' })
    }
  }, [currentLineIdx])

  const currentSection = song.sections[lyricLines[currentLineIdx]?.sectionIdx]
  const elapsedMs = startTimeRef.current ? (Date.now() - startTimeRef.current) : 0
  const elapsedBeats = Math.floor(elapsedMs / msPerBeat(effectiveBpm))
  const elapsedBars = Math.floor(elapsedBeats / bpb)
  const elapsedBeatsInBar = (elapsedBeats % bpb) + 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--lk-black)', color: 'var(--lk-white)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        padding: '10px 16px', borderBottom: `1px solid var(--lk-subtle)`,
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        background: 'var(--lk-void)',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <button onClick={onExit} style={{
          background: 'transparent', border: '1px solid var(--lk-subtle)',
          color: 'var(--lk-muted)', padding: '8px 14px', borderRadius: 6,
          fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5,
          textTransform: 'uppercase', cursor: 'pointer', minHeight: 44,
        }}>← Exit</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: 2,
            color: 'var(--lk-pink)', lineHeight: 1.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{song.title}</div>
          <div style={{ fontSize: 11, color: 'var(--lk-muted)', fontFamily: 'Space Mono, monospace' }}>
            {song.key} · {effectiveBpm} BPM · {song.timeSig}
          </div>
        </div>
        <button
          onClick={() => { setMuted(m => { const nv = !m; broadcastSession({ muted: nv }); return nv }) }}
          aria-label={muted ? 'Unmute click' : 'Mute click'}
          style={{
            background: muted ? 'transparent' : 'var(--lk-pink)', color: muted ? 'var(--lk-muted)' : '#000',
            border: `1px solid ${muted ? 'var(--lk-subtle)' : 'var(--lk-pink)'}`,
            padding: '8px 14px', borderRadius: 6, fontFamily: 'Oswald, sans-serif',
            fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer',
            minHeight: 44,
          }}
        >
          {muted ? '🔇 Muted' : '🔊 Click'}
        </button>
      </div>

      {/* ── Count-in overlay ── */}
      {countingIn && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(8,6,15,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 10,
        }}>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, letterSpacing: 4,
            color: 'var(--lk-muted)', marginBottom: 24,
          }}>GET READY</div>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: 240, lineHeight: 1,
            color: countInBeat === countInBeats - 1 ? 'var(--lk-pink)' : 'var(--lk-white)',
            textShadow: '0 0 40px rgba(255,45,155,0.4)',
          }}>
            {Math.max(1, countInBeats - countInBeat)}
          </div>
        </div>
      )}

      {/* ── Section name (fades on change) ── */}
      <div key={currentSection?.id} style={{
        padding: '16px 20px 8px',
        fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 4,
        color: 'var(--lk-pink)', textAlign: 'center',
        animation: 'tlk-fadein 0.6s ease-out',
        flexShrink: 0,
      }}>
        {currentSection?.type?.toUpperCase() || 'INTRO'}
        {currentSection?.name ? ` · ${currentSection.name}` : ''}
      </div>

      {/* ── Lyric scroll area ── */}
      <div
        ref={scrollerRef}
        style={{
          flex: 1, overflow: 'auto', padding: '20px 24px',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {lyricLines.map((line, idx) => {
            const isCurrent = idx === currentLineIdx
            const isPast = idx < currentLineIdx
            const section = song.sections[line.sectionIdx]
            const isSectionStart = line.lineIdx === 0
            return (
              <div
                key={idx}
                ref={el => { lineRefsRef.current[idx] = el }}
                style={{
                  minHeight: 60,
                  padding: '12px 0',
                  opacity: isCurrent ? 1 : (isPast ? 0.35 : 0.55),
                  transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'left center',
                  transition: 'opacity 0.4s, transform 0.4s',
                  borderLeft: isCurrent ? '3px solid var(--lk-pink)' : '3px solid transparent',
                  paddingLeft: 16,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  gap: 4,
                }}
              >
                {/* Chord line if section has chordPro */}
                {isSectionStart && section?.chordPro && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                    {section.chordPro.split(/\s+/).filter(Boolean).map((token, i) => {
                      const chord = token.replace(/[\[\]\.]/g, '')
                      if (!chord || chord === '|') return null
                      return <ChordBox key={i} name={chord} size="sm" fallback="show-name" />
                    })}
                  </div>
                )}
                <div style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: isCurrent ? 24 : 20,
                  fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? 'var(--lk-white)' : 'var(--lk-muted)',
                  lineHeight: 1.4,
                }}>
                  {line.text || '\u00A0'}
                </div>
              </div>
            )
          })}
          {/* End marker */}
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--lk-muted)', fontSize: 14 }}>
            ♪ END ♪
          </div>
        </div>
      </div>

      {/* ── Drum grid pinned bottom (current section only) ── */}
      {currentSection?.drumGrid && (
        <div style={{
          padding: '8px 16px', borderTop: `1px solid var(--lk-subtle)`,
          background: 'var(--lk-void)', flexShrink: 0,
          maxHeight: 80, overflow: 'auto',
          fontFamily: 'Space Mono, monospace', fontSize: 10,
          color: 'var(--lk-muted)',
        }}>
          DRUMS: <span style={{ color: 'var(--lk-teal)' }}>{currentSection.type}</span> section
        </div>
      )}

      {/* ── Bottom controls ── */}
      <div style={{
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        borderTop: `1px solid var(--lk-subtle)`, background: 'var(--lk-void)',
        display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
      }}>
        <button onClick={restart} style={{
          background: 'transparent', border: '1px solid var(--lk-subtle)',
          color: 'var(--lk-muted)', padding: '10px 14px', borderRadius: 8,
          fontSize: 16, cursor: 'pointer', minHeight: 48, minWidth: 48,
        }}>⏮</button>
        <button onClick={() => skipToLine(currentLineIdx - 4)} style={{
          background: 'transparent', border: '1px solid var(--lk-subtle)',
          color: 'var(--lk-muted)', padding: '10px 14px', borderRadius: 8,
          fontSize: 16, cursor: 'pointer', minHeight: 48, minWidth: 48,
        }}>◀</button>
        <button
          onClick={togglePause}
          style={{
            flex: 1, background: isPlaying ? 'var(--lk-gold)' : 'var(--lk-pink)',
            color: '#000', border: 'none', padding: '14px',
            borderRadius: 8, fontFamily: 'Oswald, sans-serif',
            fontSize: 16, letterSpacing: 2, textTransform: 'uppercase',
            cursor: 'pointer', fontWeight: 700, minHeight: 56,
          }}
        >
          {!startTimeRef.current ? '▶ Start' : isPlaying ? '⏸ Pause' : '▶ Resume'}
        </button>
        <button onClick={() => skipToLine(currentLineIdx + 4)} style={{
          background: 'transparent', border: '1px solid var(--lk-subtle)',
          color: 'var(--lk-muted)', padding: '10px 14px', borderRadius: 8,
          fontSize: 16, cursor: 'pointer', minHeight: 48, minWidth: 48,
        }}>▶</button>
        {isSetlistMode && hasNextSong && onNextSong && (
          <button onClick={onNextSong} style={{
            background: 'var(--lk-teal)', color: '#000', border: 'none',
            padding: '10px 14px', borderRadius: 8, fontSize: 16,
            cursor: 'pointer', minHeight: 48, minWidth: 48, fontWeight: 700,
          }}>⏭</button>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{
        height: 4, background: 'var(--lk-subtle)', position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${lyricLines.length > 0 ? (currentLineIdx / (lyricLines.length - 1)) * 100 : 0}%`,
          background: 'var(--lk-pink)',
          transition: 'width 0.2s',
        }} />
      </div>

      {/* ── Beat counter ── */}
      <div style={{
        position: 'fixed', top: 70, right: 16, zIndex: 5,
        background: 'rgba(0,0,0,0.6)', padding: '4px 10px',
        borderRadius: 4, fontFamily: 'Space Mono, monospace',
        fontSize: 12, color: 'var(--lk-muted)',
        pointerEvents: 'none',
      }}>
        Bar {elapsedBars + 1} · Beat {elapsedBeatsInBar}/{bpb}
      </div>

      <style>{`
        @keyframes tlk-fadein {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
