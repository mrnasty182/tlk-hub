'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import AudioRecorder from './AudioRecorder'

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

export type SavedRecording = {
  id: string
  name: string
  data: string // base64 data URL
  duration: number
  createdAt: number
  detectedNote?: string
  detectedBPM?: number
}

const STORAGE_KEY = 'tlk-recordings'

export function loadRecordings(): SavedRecording[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRecording(rec: SavedRecording): void {
  const existing = loadRecordings()
  const updated = [rec, ...existing.filter(r => r.id !== rec.id)]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function deleteRecording(id: string): void {
  const updated = loadRecordings().filter(r => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

// ─── RecorderModal ─────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onClose: () => void
  initialTab?: 'record' | 'recordings'
}

export default function RecorderModal({ open, onClose, initialTab = 'record' }: Props) {
  const [activeTab, setActiveTab] = useState<'record' | 'recordings'>(initialTab)
  const [recordings, setRecordings] = useState<SavedRecording[]>([])
  const [saveForm, setSaveForm] = useState<{ blob: Blob; url: string } | null>(null)
  const [recordingName, setRecordingName] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [detectedInfo, setDetectedInfo] = useState<{ note?: string; bpm?: number }>({})

  // Ref to the AudioRecorder DOM element we need to observe
  const recorderContainerRef = useRef<HTMLDivElement>(null)

  // Reload recordings list when modal opens or tab switches
  useEffect(() => {
    if (open) setRecordings(loadRecordings())
  }, [open, activeTab])

  // Sync activeTab when initialTab prop changes (e.g., switching from Record to Recordings button)
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // Watch AudioRecorder for completion (state === 'done' + audioUrl)
  useEffect(() => {
    if (!open || activeTab !== 'record') return
    const container = recorderContainerRef.current
    if (!container) return

    let prevState = ''
    let prevUrl = ''

    const check = () => {
      // Look for the state indicator in AudioRecorder's DOM
      const stateEl = container.querySelector('[data-recstate]')
      const audioEl = container.querySelector('audio')
      const state = stateEl?.getAttribute('data-recstate') || ''
      const url = audioEl?.src || ''

      if (state === 'done' && url && url !== prevUrl) {
        prevUrl = url
        // Extract detected info from the DOM
        const noteEl = container.querySelector('[data-note]')
        const bpmEl = container.querySelector('[data-bpm]')
        const note = noteEl?.textContent?.trim() || undefined
        const bpmStr = bpmEl?.textContent?.trim()
        const bpm = bpmStr ? parseInt(bpmStr) : undefined
        setDetectedInfo({ note, bpm })

        // Fetch the blob from the audio URL
        fetch(url)
          .then(r => r.blob())
          .then(blob => {
            setSaveForm({ blob, url })
            setRecordingName(`Riff ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`)
          })
          .catch(console.error)
      }

      prevState = state
    }

    // Poll every 500ms
    const interval = setInterval(check, 500)
    return () => clearInterval(interval)
  }, [open, activeTab])

  const handleSave = useCallback(() => {
    if (!saveForm) return
    const reader = new FileReader()
    reader.onload = () => {
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
      const rec: SavedRecording = {
        id,
        name: recordingName || `Riff ${new Date().toLocaleTimeString()}`,
        data: reader.result as string,
        duration: 0,
        createdAt: Date.now(),
        ...detectedInfo,
      }
      saveRecording(rec)
      setSavedMsg('✓ Saved to My Recordings')
      setTimeout(() => setSavedMsg(''), 2000)
      setSaveForm(null)
      setRecordings(loadRecordings())
      setDetectedInfo({})
    }
    reader.readAsDataURL(saveForm.blob)
  }, [saveForm, recordingName, detectedInfo])

  const handleDelete = useCallback((id: string) => {
    deleteRecording(id)
    setRecordings(loadRecordings())
  }, [])

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(8,6,15,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: BRAND.surface,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 20,
        width: '100%',
        maxWidth: 680,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${BRAND.border}`,
        }}>
          <div style={{ display: 'flex', gap: 0 }}>
            <button
              onClick={() => setActiveTab('record')}
              style={{
                padding: '8px 20px', borderRadius: '8px 0 0 8px',
                border: `1px solid ${activeTab === 'record' ? BRAND.hotPink : BRAND.border}`,
                borderRight: 'none',
                background: activeTab === 'record' ? `${BRAND.hotPink}22` : 'transparent',
                color: activeTab === 'record' ? BRAND.hotPink : BRAND.muted,
                fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5,
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Record
            </button>
            <button
              onClick={() => setActiveTab('recordings')}
              style={{
                padding: '8px 20px', borderRadius: '0 8px 8px 0',
                border: `1px solid ${activeTab === 'recordings' ? BRAND.hotPink : BRAND.border}`,
                background: activeTab === 'recordings' ? `${BRAND.hotPink}22` : 'transparent',
                color: activeTab === 'recordings' ? BRAND.hotPink : BRAND.muted,
                fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5,
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              My Recordings ({recordings.length})
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: `1px solid ${BRAND.border}`,
              background: 'transparent', color: BRAND.muted,
              fontSize: 18, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {activeTab === 'record' && (
            <div>
              <div ref={recorderContainerRef}>
                {/* Override the download link behavior by injecting a capture script */}
                <div id="recorder-inner">
                  <AudioRecorder />
                </div>
              </div>

              {/* Save form */}
              {saveForm && (
                <div style={{
                  marginTop: 16,
                  background: BRAND.card,
                  border: `1px solid ${BRAND.electricTeal}44`,
                  borderRadius: 12,
                  padding: 20,
                }}>
                  <div style={{
                    fontFamily: 'Bebas Neue, sans-serif', fontSize: 16,
                    color: BRAND.electricTeal, letterSpacing: 2, marginBottom: 16,
                  }}>
                    SAVE RECORDING
                  </div>
                  {detectedInfo.note && (
                    <div style={{
                      fontFamily: 'Space Mono, monospace', fontSize: 11,
                      color: BRAND.glamGold, marginBottom: 8,
                    }}>
                      Detected: ♪ {detectedInfo.note}
                      {detectedInfo.bpm && ` · ⚡ ${detectedInfo.bpm} BPM`}
                    </div>
                  )}
                  <input
                    value={recordingName}
                    onChange={e => setRecordingName(e.target.value)}
                    placeholder="Name this riff..."
                    style={{
                      width: '100%', background: BRAND.surface,
                      border: `1px solid ${BRAND.border}`, borderRadius: 8,
                      color: '#fff', fontFamily: 'system-ui', fontSize: 14,
                      padding: '10px 14px', outline: 'none', boxSizing: 'border-box',
                      marginBottom: 12,
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleSave}
                      style={{
                        flex: 1, padding: '12px 20px', borderRadius: 10,
                        border: `1px solid ${BRAND.electricTeal}`,
                        background: BRAND.electricTeal, color: BRAND.midnight,
                        fontFamily: 'Oswald, sans-serif', fontSize: 12,
                        letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                      }}
                    >
                      ✓ Save to My Recordings
                    </button>
                    <button
                      onClick={() => { setSaveForm(null); setDetectedInfo({}) }}
                      style={{
                        padding: '12px 20px', borderRadius: 10,
                        border: `1px solid ${BRAND.border}`,
                        background: 'transparent', color: BRAND.muted,
                        fontFamily: 'Oswald, sans-serif', fontSize: 12,
                        letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                      }}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {savedMsg && (
                <div style={{
                  marginTop: 12, padding: '10px 16px', borderRadius: 8,
                  background: `${BRAND.electricTeal}22`,
                  border: `1px solid ${BRAND.electricTeal}44`,
                  color: BRAND.electricTeal, fontFamily: 'Space Mono, monospace', fontSize: 12,
                }}>
                  {savedMsg}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recordings' && (
            <div>
              {recordings.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 24px',
                  color: BRAND.muted, fontFamily: 'Space Mono, monospace', fontSize: 13,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎙</div>
                  No recordings yet. Go to the Record tab to capture your first riff.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recordings.map(rec => (
                    <div key={rec.id} style={{
                      background: BRAND.card,
                      border: `1px solid ${BRAND.border}`,
                      borderRadius: 12,
                      padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}>
                      <audio controls src={rec.data} style={{ height: 36, flex: 1, minWidth: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'Oswald, sans-serif', fontSize: 13,
                          color: '#fff', letterSpacing: 0.5, marginBottom: 4,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {rec.name}
                        </div>
                        <div style={{
                          fontFamily: 'Space Mono, monospace', fontSize: 10,
                          color: BRAND.muted, display: 'flex', gap: 12, flexWrap: 'wrap',
                        }}>
                          <span>{formatDate(rec.createdAt)}</span>
                          {rec.detectedNote && (
                            <span style={{ color: BRAND.electricTeal }}>♪ {rec.detectedNote}</span>
                          )}
                          {rec.detectedBPM && (
                            <span style={{ color: BRAND.glamGold }}>⚡ {rec.detectedBPM} BPM</span>
                          )}
                        </div>
                      </div>
                      <a href={rec.data} download={`${rec.name}.webm`} style={{
                        padding: '8px 14px', borderRadius: 8,
                        border: `1px solid ${BRAND.border}`,
                        background: 'transparent', color: BRAND.muted,
                        fontFamily: 'Oswald, sans-serif', fontSize: 10,
                        letterSpacing: 1.5, textTransform: 'uppercase',
                        textDecoration: 'none', cursor: 'pointer',
                        flexShrink: 0,
                      }}>
                        ↓ Save
                      </a>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: `1px solid ${BRAND.hotPink}44`,
                          background: 'transparent', color: BRAND.hotPink,
                          fontSize: 14, cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}