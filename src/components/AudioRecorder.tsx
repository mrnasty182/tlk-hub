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

function analyzeBPM(audioBuffer: AudioBuffer): number {
  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  // Simple onset detection via energy
  const hopSize = Math.floor(sampleRate * 0.01)
  const frameSize = Math.floor(sampleRate * 0.02)
  const energies: number[] = []

  for (let i = 0; i < data.length - frameSize; i += hopSize) {
    let energy = 0
    for (let j = 0; j < frameSize; j++) {
      energy += data[i + j] * data[i + j]
    }
    energies.push(Math.sqrt(energy / frameSize))
  }

  // Find onset peaks (significant energy increases)
  const threshold = energies.reduce((a, b) => a + b, 0) / energies.length * 1.5
  const onsets: number[] = []
  for (let i = 1; i < energies.length - 1; i++) {
    if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
      onsets.push(i * hopSize / sampleRate)
    }
  }

  if (onsets.length < 2) return 0

  // Calculate average inter-onset interval
  const intervals: number[] = []
  for (let i = 1; i < onsets.length; i++) {
    intervals.push(onsets[i] - onsets[i - 1])
  }
  intervals.sort()
  // Use median interval
  const medianInterval = intervals[Math.floor(intervals.length / 2)]
  if (medianInterval <= 0) return 0
  const bpm = Math.round(60 / medianInterval)
  return Math.max(30, Math.min(300, bpm))
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'done'

export default function AudioRecorder() {
  const [state, setState] = useState<RecordingState>('idle')
  const [detectedNote, setDetectedNote] = useState<{ note: string; cents: number; octave: number } | null>(null)
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startLiveTuner = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (!analyzerRef.current || !ctx) return
      const bufLen = analyzerRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufLen)
      analyzerRef.current.getByteTimeDomainData(dataArray)

      ctx.fillStyle = BRAND.midnight
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw waveform
      ctx.lineWidth = 2
      ctx.strokeStyle = BRAND.electricTeal
      ctx.beginPath()
      const sliceWidth = canvas.width / bufLen
      let x = 0
      for (let i = 0; i < bufLen; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.stroke()

      // Detect pitch from time-domain autocorrelation
      const timeData = dataArray

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyzer = audioCtx.createAnalyser()
      analyzer.fftSize = 4096
      source.connect(analyzer)
      analyzerRef.current = analyzer

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setState('processing')

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))

        try {
          const arrayBuffer = await blob.arrayBuffer()
          const decoded = await audioCtx.decodeAudioData(arrayBuffer)

          // Detect BPM
          const bpm = analyzeBPM(decoded)
          setDetectedBPM(bpm)

          // Detect pitch from the audio buffer
          const data = decoded.getChannelData(0)
          const sampleRate = decoded.sampleRate

          // Autocorrelation pitch detection
          const minPeriod = Math.floor(sampleRate / 1000) // max freq 1000Hz
          const maxPeriod = Math.floor(sampleRate / 60)   // min freq 60Hz
          let bestCorr = 0
          let bestPeriod = 0

          // Use a chunk for pitch detection
          const chunkSize = maxPeriod * 2
          const start = Math.floor(data.length / 2) - chunkSize / 2
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
            const freq = sampleRate / bestPeriod
            setDetectedNote(freqToNote(freq))
          } else {
            setDetectedNote(null)
          }

          setState('done')
        } catch {
          setError('Could not analyze audio. Try a clearer recording.')
          setState('done')
        }

        if (animationRef.current) cancelAnimationFrame(animationRef.current)
      }

      mediaRecorder.start()
      setState('recording')
      setRecordingTime(0)
      setDetectedNote(null)
      setDetectedBPM(null)

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)

      // Start live waveform
      startLiveTuner()
    } catch {
      setError('Microphone access denied. Please allow mic access in your browser.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
  }

  const reset = () => {
    setState('idle')
    setDetectedNote(null)
    setDetectedBPM(null)
    setRecordingTime(0)
    setError(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const centsColor = detectedNote
    ? Math.abs(detectedNote.cents) < 10
      ? BRAND.electricTeal
      : Math.abs(detectedNote.cents) < 25
      ? BRAND.glamGold
      : BRAND.hotPink
    : BRAND.muted

  return (
    <div data-recstate={state} style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: 24 }}>
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
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted }}>Record a riff → detect key + BPM</div>
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
          height={80}
          style={{ display: 'block', width: '100%', background: BRAND.midnight }}
        />
      </div>

      {/* Results */}
      {(state === 'done' || state === 'recording') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Note display */}
          <div style={{ background: BRAND.surface, borderRadius: 12, padding: 16, textAlign: 'center', border: `1px solid ${BRAND.border}` }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted, marginBottom: 8 }}>DETECTED NOTE</div>
            {detectedNote ? (
              <>
                <div data-note style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 48, color: centsColor, letterSpacing: 2, lineHeight: 1 }}>
                  {detectedNote.note}{detectedNote.octave}
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: centsColor, marginTop: 4 }}>
                  {detectedNote.cents > 0 ? '+' : ''}{detectedNote.cents}¢
                </div>
                {/* Tuning meter */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 6, background: BRAND.border, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', top: 0, left: '50%', width: 2, height: '100%',
                      background: centsColor,
                    }} />
                    <div style={{
                      position: 'absolute', top: 0,
                      left: `calc(50% + ${Math.max(-50, Math.min(50, detectedNote.cents / 2))}%)`,
                      width: 6, height: '100%', borderRadius: 3,
                      background: centsColor, transform: 'translateX(-50%)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: BRAND.muted }}>FLAT</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: centsColor }}>●</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: BRAND.muted }}>SHARP</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: BRAND.muted }}>
                {state === 'recording' ? 'Listening...' : 'No note detected'}
              </div>
            )}
          </div>

          {/* BPM display */}
          <div style={{ background: BRAND.surface, borderRadius: 12, padding: 16, textAlign: 'center', border: `1px solid ${BRAND.border}` }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted, marginBottom: 8 }}>DETECTED BPM</div>
            {detectedBPM ? (
              <>
                <div data-bpm style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 48, color: BRAND.electricTeal, letterSpacing: 2, lineHeight: 1 }}>
                  {detectedBPM}
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.muted, marginTop: 4 }}>BPM</div>
                <div style={{ marginTop: 12, display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {([60, 80, 100, 120]).map(t => (
                    <span key={t} style={{
                      fontFamily: 'Space Mono, monospace', fontSize: 9,
                      color: Math.abs(detectedBPM - t) < 5 ? BRAND.glamGold : BRAND.muted,
                      background: Math.abs(detectedBPM - t) < 5 ? `${BRAND.glamGold}22` : 'transparent',
                      border: `1px solid ${Math.abs(detectedBPM - t) < 5 ? BRAND.glamGold : BRAND.border}`,
                      borderRadius: 10, padding: '2px 8px',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: BRAND.muted }}>
                {state === 'recording' ? 'Analyzing...' : 'No rhythm detected'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: `${BRAND.hotPink}22`, border: `1px solid ${BRAND.hotPink}44`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: 'system-ui', fontSize: 13, color: BRAND.hotPink }}>
          {error}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {state === 'idle' && (
          <button onClick={startRecording} style={{
            flex: 1, padding: '14px 24px', borderRadius: 12,
            border: `1px solid ${BRAND.hotPink}66`, background: `${BRAND.hotPink}22`,
            color: BRAND.hotPink, fontFamily: 'Oswald, sans-serif', fontSize: 14,
            letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            ● Record Riff
          </button>
        )}

        {state === 'recording' && (
          <>
            <div style={{
              width: 12, height: 12, borderRadius: '50%', background: BRAND.hotPink,
              animation: 'pulse 1s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: BRAND.hotPink }}>
              {formatTime(recordingTime)}
            </span>
            <button onClick={stopRecording} style={{
              flex: 1, padding: '14px 24px', borderRadius: 12,
              border: `1px solid ${BRAND.hotPink}`, background: BRAND.hotPink,
              color: '#fff', fontFamily: 'Oswald, sans-serif', fontSize: 14,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
            }}>
              ■ Stop
            </button>
          </>
        )}

        {state === 'processing' && (
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 13, color: BRAND.muted }}>
            Analyzing... ⏳
          </div>
        )}

        {(state === 'done') && (
          <>
            <button onClick={reset} style={{
              padding: '10px 20px', borderRadius: 10,
              border: `1px solid ${BRAND.border}`, background: 'transparent',
              color: BRAND.muted, fontFamily: 'Oswald, sans-serif', fontSize: 12,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
            }}>
              Reset
            </button>
            {audioUrl && (
              <audio controls src={audioUrl} style={{ height: 36, width: '100%', marginBottom: 8 }} />
            )}
            {audioUrl && (
              <a href={audioUrl} download="riff.webm" style={{
                padding: '10px 20px', borderRadius: 10,
                border: `1px solid ${BRAND.electricTeal}66`, background: `${BRAND.electricTeal}22`,
                color: BRAND.electricTeal, fontFamily: 'Oswald, sans-serif', fontSize: 12,
                letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
              }}>
                ↓ Save Audio
              </a>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
