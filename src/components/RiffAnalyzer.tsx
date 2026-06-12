'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

const BRAND = {
  hotPink: '#FF2D9B',
  electricTeal: '#00E5CC',
  deepViolet: '#7B2FBE',
  glamGold: '#F0C040',
  midnight: '#08060F',
  muted: '#6B6180',
  surface: '#130E20',
  card: '#0E0B18',
  border: '#1E1830',
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const A4 = 440.0

function freqToNote(freq: number): { note: string; cents: number; octave: number } {
  if (freq <= 0) return { note: '-', cents: 0, octave: 0 }
  const semitones = 12 * Math.log2(freq / A4)
  const nearestSemitone = Math.round(semitones)
  const cents = Math.round((semitones - nearestSemitone) * 100)
  const midiNote = nearestSemitone + 69
  const octave = Math.floor(midiNote / 12) - 1
  const noteIdx = ((nearestSemitone % 12) + 12) % 12
  const useFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(NOTES[noteIdx])
  const note = useFlats ? FLAT_NOTES[noteIdx] : NOTES[noteIdx]
  return { note, cents, octave }
}

// Autocorrelation-based pitch detection
function detectPitch(data: Float32Array, sampleRate: number): number {
  const minPeriod = Math.floor(sampleRate / 1000) // max freq 1000Hz
  const maxPeriod = Math.floor(sampleRate / 60)   // min freq 60Hz

  let bestCorr = 0
  let bestPeriod = 0

  const chunkSize = maxPeriod * 3
  const start = Math.floor(data.length / 2) - Math.floor(chunkSize / 2)
  const chunk = data.slice(start, start + chunkSize)

  for (let lag = minPeriod; lag < maxPeriod; lag++) {
    let corr = 0
    let norm = 0
    for (let i = 0; i < chunk.length - lag; i++) {
      corr += chunk[i] * chunk[i + lag]
      norm += chunk[i] * chunk[i] + chunk[i + lag] * chunk[i + lag]
    }
    const r = norm > 0 ? (2 * corr) / norm : 0
    if (r > bestCorr) {
      bestCorr = r
      bestPeriod = lag
    }
  }

  if (bestPeriod > 0 && bestCorr > 0.3) {
    return sampleRate / bestPeriod
  }
  return 0
}

type AnalyzerState = 'idle' | 'listening' | 'done'

export default function RiffAnalyzer() {
  const [state, setState] = useState<AnalyzerState>('idle')
  const [detectedNote, setDetectedNote] = useState<{ note: string; cents: number; octave: number } | null>(null)
  const [liveFreq, setLiveFreq] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pitchDataRef = useRef<Float32Array | null>(null)

  const startListening = useCallback(async () => {
    try {
      setError(null)
      setDetectedNote(null)
      setLiveFreq(0)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source

      const analyzer = audioCtx.createAnalyser()
      analyzer.fftSize = 4096
      analyzerRef.current = analyzer
      source.connect(analyzer)

      const bufLen = analyzer.frequencyBinCount
      pitchDataRef.current = new Float32Array(bufLen)

      setState('listening')

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')

      const draw = () => {
        if (!analyzerRef.current || !ctx || !canvas) {
          animationRef.current = requestAnimationFrame(draw)
          return
        }

        const analyser = analyzerRef.current
        const timeData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteTimeDomainData(timeData)

        // Store float data for pitch detection
        const floatData = new Float32Array(timeData.length)
        for (let i = 0; i < timeData.length; i++) {
          floatData[i] = (timeData[i] / 128.0) - 1.0
        }

        // Detect pitch live
        const freq = detectPitch(floatData, audioCtx.sampleRate)
        setLiveFreq(freq)
        if (freq > 0) {
          setDetectedNote(freqToNote(freq))
        }

        // Draw waveform
        ctx.fillStyle = BRAND.midnight
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Center line
        ctx.strokeStyle = `${BRAND.electricTeal}33`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, canvas.height / 2)
        ctx.lineTo(canvas.width, canvas.height / 2)
        ctx.stroke()

        // Waveform
        ctx.lineWidth = 2
        ctx.strokeStyle = BRAND.electricTeal
        ctx.beginPath()
        const sliceWidth = canvas.width / timeData.length
        let x = 0
        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0
          const y = (v * canvas.height) / 2
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
          x += sliceWidth
        }
        ctx.stroke()

        animationRef.current = requestAnimationFrame(draw)
      }

      draw()
    } catch {
      setError('Microphone access denied. Please allow mic access in your browser.')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    setState('done')
  }, [])

  const reset = () => {
    setState('idle')
    setDetectedNote(null)
    setLiveFreq(0)
    setError(null)
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  const centsColor = detectedNote
    ? Math.abs(detectedNote.cents) < 10
      ? BRAND.electricTeal
      : Math.abs(detectedNote.cents) < 25
      ? BRAND.glamGold
      : BRAND.hotPink
    : BRAND.muted

  return (
    <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${BRAND.hotPink}22`, border: `1px solid ${BRAND.hotPink}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND.hotPink} strokeWidth="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: '#fff', letterSpacing: 1 }}>Riff Analyzer</div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted }}>Real-time pitch detection from mic</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: `${BRAND.glamGold}11`, border: `1px solid ${BRAND.glamGold}33`,
        borderRadius: 8, padding: '10px 14px', marginBottom: 20,
      }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.glamGold, marginBottom: 4 }}>⚠ REFERENCE USE ONLY</div>
        <div style={{ fontFamily: 'system-ui', fontSize: 12, color: BRAND.muted, lineHeight: 1.5 }}>
          Pitch detection works best with clean single-note runs. Chords and heavily distorted recordings may give inaccurate results. This is a practice aid — not a professional tuner or metronome. Always trust your ear first.
        </div>
      </div>

      {/* Waveform canvas */}
      <div style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: `1px solid ${BRAND.border}` }}>
        <canvas
          ref={canvasRef}
          width={560}
          height={100}
          style={{ display: 'block', width: '100%', background: BRAND.midnight, touchAction: 'none' }}
        />
      </div>

      {/* Live frequency display */}
      {state === 'listening' && (
        <div style={{
          textAlign: 'center',
          marginBottom: 16,
          fontFamily: 'Space Mono, monospace',
          fontSize: 12,
          color: BRAND.muted,
        }}>
          {liveFreq > 0 ? (
            <span style={{ color: BRAND.electricTeal }}>{liveFreq.toFixed(1)} Hz</span>
          ) : (
            <span>Listening for pitch...</span>
          )}
        </div>
      )}

      {/* Note display */}
      <div style={{
        background: BRAND.surface,
        borderRadius: 12,
        padding: 24,
        textAlign: 'center',
        border: `1px solid ${BRAND.border}`,
        marginBottom: 20,
      }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted, marginBottom: 12 }}>DETECTED NOTE</div>
        {detectedNote ? (
          <>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 64, color: centsColor, letterSpacing: 2, lineHeight: 1 }}>
              {detectedNote.note}<span style={{ fontSize: 32 }}>{detectedNote.octave}</span>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, color: centsColor, marginTop: 8 }}>
              {detectedNote.cents > 0 ? '+' : ''}{detectedNote.cents}¢
            </div>
            {/* Tuning meter */}
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 8, background: BRAND.border, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 0, left: '50%', width: 2, height: '100%',
                  background: centsColor,
                }} />
                <div style={{
                  position: 'absolute', top: 0,
                  left: `calc(50% + ${Math.max(-50, Math.min(50, detectedNote.cents / 2))}%)`,
                  width: 8, height: '100%', borderRadius: 4,
                  background: centsColor, transform: 'translateX(-50%)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted }}>FLAT</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: centsColor }}>●</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BRAND.muted }}>SHARP</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: BRAND.muted, padding: '20px 0' }}>
            {state === 'listening' ? 'Play a note on your instrument...' : 'Press Start to begin'}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: `${BRAND.hotPink}22`, border: `1px solid ${BRAND.hotPink}44`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: 'system-ui', fontSize: 13, color: BRAND.hotPink }}>
          {error}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {state === 'idle' && (
          <button
            onClick={startListening}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: 12,
              border: `1px solid ${BRAND.hotPink}66`,
              background: `${BRAND.hotPink}22`,
              color: BRAND.hotPink,
              fontFamily: 'Oswald, sans-serif',
              fontSize: 15,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            🎤 Start Listening
          </button>
        )}

        {state === 'listening' && (
          <>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: BRAND.hotPink,
              animation: 'pulse 1s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: BRAND.hotPink, flexShrink: 0 }}>
              LIVE
            </span>
            <button
              onClick={stopListening}
              style={{
                flex: 1,
                padding: '16px 24px',
                borderRadius: 12,
                border: `1px solid ${BRAND.hotPink}`,
                background: BRAND.hotPink,
                color: '#fff',
                fontFamily: 'Oswald, sans-serif',
                fontSize: 15,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ■ Stop
            </button>
          </>
        )}

        {state === 'done' && (
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: '14px 24px',
              borderRadius: 12,
              border: `1px solid ${BRAND.electricTeal}66`,
              background: `${BRAND.electricTeal}22`,
              color: BRAND.electricTeal,
              fontFamily: 'Oswald, sans-serif',
              fontSize: 14,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ↺ Try Again
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @media (max-width: 600px) {
          canvas { height: 80px !important; }
        }
      `}</style>
    </div>
  )
}
