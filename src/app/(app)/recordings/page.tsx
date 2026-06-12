'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { loadRecordings, deleteRecording, type SavedRecording } from '@/components/RecorderModal'

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

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<SavedRecording[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  const reload = useCallback(() => setRecordings(loadRecordings()), [])

  useEffect(() => {
    reload()
  }, [reload])

  const handleDelete = useCallback((id: string) => {
    setDeleting(id)
    setTimeout(() => {
      deleteRecording(id)
      setDeleting(null)
      reload()
    }, 300)
  }, [reload])

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BRAND.midnight,
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Sub-header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 24px', height: 64,
        background: BRAND.surface, borderBottom: `1px solid ${BRAND.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: 4, color: '#F0EBF8' }}>
          MY RECORDINGS
        </span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted }}>
          {recordings.length} saved
        </span>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
        {recordings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            color: BRAND.muted,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎙</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, letterSpacing: 3, marginBottom: 8, color: BRAND.muted }}>
              NO RECORDINGS YET
            </div>
            <p style={{ fontFamily: 'system-ui', fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
              Open the composer and click the <strong style={{ color: BRAND.hotPink }}>🎙 Record</strong> button to capture a riff. It will be saved here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recordings.map(rec => (
              <div
                key={rec.id}
                style={{
                  background: BRAND.card,
                  border: `1px solid ${deleting === rec.id ? BRAND.hotPink : BRAND.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  opacity: deleting === rec.id ? 0.5 : 1,
                  transition: 'all 0.3s',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Oswald, sans-serif', fontSize: 16,
                      color: '#fff', letterSpacing: 0.5, marginBottom: 6,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {rec.name}
                    </div>
                    <div style={{
                      fontFamily: 'Space Mono, monospace', fontSize: 11,
                      color: BRAND.muted, display: 'flex', gap: 16, flexWrap: 'wrap',
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

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <a
                      href={rec.data}
                      download={`${rec.name.replace(/[^a-z0-9]/gi, '_')}.webm`}
                      style={{
                        padding: '8px 16px', borderRadius: 10,
                        border: `1px solid ${BRAND.electricTeal}66`,
                        background: `${BRAND.electricTeal}15`,
                        color: BRAND.electricTeal,
                        fontFamily: 'Oswald, sans-serif', fontSize: 11,
                        letterSpacing: 1.5, textTransform: 'uppercase',
                        textDecoration: 'none', cursor: 'pointer',
                      }}
                    >
                      ↓ Save .webm
                    </a>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      style={{
                        padding: '8px 14px', borderRadius: 10,
                        border: `1px solid ${BRAND.hotPink}44`,
                        background: 'transparent', color: BRAND.hotPink,
                        fontFamily: 'Oswald, sans-serif', fontSize: 11,
                        letterSpacing: 1.5, textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Audio player */}
                <audio
                  controls
                  src={rec.data}
                  style={{ width: '100%', height: 40 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}