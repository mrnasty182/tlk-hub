'use client'

/**
 * Export modal for TLK Hub.
 *
 * Two modes:
 *   - "song"  → pick which sections to include in a per-song print view
 *   - "setlist" → quick reference (cover + titles/keys/BPM/runtime) or full gig pack (each song full)
 *
 * Outputs:
 *   - PDF: opens a print-styled view, calls window.print() (browser "Save as PDF")
 *   - Word: lyrics-only .docx-compatible text file, paste-ready
 */

import React, { useState, useMemo } from 'react'
import type { Song } from '@/types/music'
import { SECTION_TYPE_LABELS } from '@/types/music'
import { getChord } from '@/lib/chords'

type SectionOption = 'lyrics' | 'chord_names' | 'chord_diagrams' | 'guitar_tab' | 'bass_tab' | 'drum_grid' | 'notes'

const SECTION_OPTIONS: { key: SectionOption; label: string; default: boolean }[] = [
  { key: 'lyrics',         label: 'Lyrics',              default: true  },
  { key: 'chord_names',    label: 'Chord names',         default: true  },
  { key: 'chord_diagrams', label: 'Chord diagrams (SVG)', default: false },
  { key: 'guitar_tab',     label: 'Guitar tab',          default: false },
  { key: 'bass_tab',       label: 'Bass tab',            default: false },
  { key: 'drum_grid',      label: 'Drum grid',           default: false },
  { key: 'notes',          label: 'Production notes',    default: false },
]

type SetlistMode = 'quick' | 'full'

interface Props {
  open: boolean
  onClose: () => void
  song?: Song | null                   // present = single-song mode
  setlist?: { name: string; notes?: string | null; songs: Song[] } | null  // present = setlist mode
}

export default function ExportModal({ open, onClose, song, setlist }: Props) {
  const [opts, setOpts] = useState<Record<SectionOption, boolean>>(
    () => Object.fromEntries(SECTION_OPTIONS.map(o => [o.key, o.default])) as any
  )
  const [setlistMode, setSetlistMode] = useState<SetlistMode>('quick')

  if (!open) return null

  const isSetlist = !!setlist
  const songs = setlist?.songs ?? (song ? [song] : [])

  const toggleOpt = (k: SectionOption) =>
    setOpts(prev => ({ ...prev, [k]: !prev[k] }))

  // ── Estimate runtime (seconds per beat × total beats at 4/4 default) ──
  const totalRuntime = useMemo(() => {
    let sec = 0
    songs.forEach(s => {
      const beatsPerBar = parseInt((s.time_sig || '4/4').split('/')[0]) || 4
      const sectionLines = s.sections.reduce((acc, sec) => acc + (sec.lyrics?.split('\n').filter(Boolean).length || 1), 0)
      const beats = sectionLines * 4 // assume 4 beats per line at default
      sec += (60 / (s.bpm || 120)) * beats * beatsPerBar / beatsPerBar
    })
    const m = Math.floor(sec / 60)
    const r = Math.floor(sec % 60)
    return `${m}:${r.toString().padStart(2, '0')}`
  }, [songs])

  // ── PDF print handler ─────────────────────────────────────
  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=900,height=1100')
    if (!w) return
    w.document.write(generatePrintHtml(songs, opts, { setlistName: setlist?.name, setlistNotes: setlist?.notes, setlistMode: isSetlist ? setlistMode : null }))
    w.document.close()
    // Wait for content to render then print
    setTimeout(() => {
      w.focus()
      w.print()
    }, 250)
  }

  // ── Word doc handler (.docx-compatible .txt file) ─────────
  const handleWordDoc = () => {
    const text = generateWordDocText(songs)
    const blob = new Blob([text], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const fname = isSetlist ? `${setlist!.name.replace(/[^a-z0-9]/gi, '_')}.doc` : `${songs[0].title.replace(/[^a-z0-9]/gi, '_')}.doc`
    a.download = fname
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div className="export-header">
          <span className="export-title">📄 EXPORT</span>
          <button className="export-close" onClick={onClose}>✕</button>
        </div>

        <div className="export-body">
          {isSetlist && (
            <div className="export-section">
              <h3>Setlist mode</h3>
              <div className="setlist-mode-toggle">
                <button
                  className={`mode-btn ${setlistMode === 'quick' ? 'active' : ''}`}
                  onClick={() => setSetlistMode('quick')}
                >
                  <strong>Quick Reference</strong>
                  <span>Cover sheet + song list (titles, keys, BPM, runtime)</span>
                </button>
                <button
                  className={`mode-btn ${setlistMode === 'full' ? 'active' : ''}`}
                  onClick={() => setSetlistMode('full')}
                >
                  <strong>Full Gig Pack</strong>
                  <span>Cover sheet + each song fully expanded per your checkboxes</span>
                </button>
              </div>
            </div>
          )}

          {(!isSetlist || setlistMode === 'full') && (
            <div className="export-section">
              <h3>What to include {isSetlist ? 'in each song' : ''}</h3>
              <div className="opt-grid">
                {SECTION_OPTIONS.map(o => (
                  <label key={o.key} className={`opt-row ${opts[o.key] ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={opts[o.key]}
                      onChange={() => toggleOpt(o.key)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="export-section">
            <h3>Summary</h3>
            <ul className="export-summary">
              <li>{songs.length} song{songs.length !== 1 ? 's' : ''}</li>
              <li>Estimated runtime: <strong>{totalRuntime}</strong></li>
              {isSetlist && <li>Setlist: <strong>{setlist!.name}</strong></li>}
            </ul>
          </div>
        </div>

        <div className="export-footer">
          <button className="export-btn export-btn-pdf" onClick={handlePrint}>
            📄 Print / Save as PDF
          </button>
          <button className="export-btn export-btn-word" onClick={handleWordDoc}>
            📝 Download .doc (lyrics only)
          </button>
          <button className="export-btn export-btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HTML GENERATION (PDF)
// ═══════════════════════════════════════════════════════════════

function generatePrintHtml(
  songs: Song[],
  opts: Record<SectionOption, boolean>,
  meta: { setlistName?: string; setlistNotes?: string | null; setlistMode: SetlistMode | null }
): string {
  const setlistCover = meta.setlistMode !== null ? `
    <div class="cover">
      <h1>${escapeHtml(meta.setlistName || 'SETLIST')}</h1>
      <div class="cover-meta">
        ${songs.length} songs · ~${songs.reduce((acc, s) => acc + (s.bpm || 120), 0) / songs.length | 0} avg BPM
      </div>
      ${meta.setlistNotes ? `<div class="cover-notes">${escapeHtml(meta.setlistNotes)}</div>` : ''}
      <table class="cover-table">
        <thead><tr><th>#</th><th>Title</th><th>Key</th><th>BPM</th><th>Time</th></tr></thead>
        <tbody>
          ${songs.map((s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(s.title)}${s.version_name ? ` <em>(${escapeHtml(s.version_name)})</em>` : ''}</td>
              <td>${s.key || '—'}</td>
              <td>${s.bpm || '—'}</td>
              <td>${s.time_sig || '4/4'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="page-break-after: always;"></div>
    </div>
  ` : ''

  const songBlocks = songs.map(s => renderSongBlock(s, opts)).join('<div style="page-break-after: always;"></div>')

  return `<!doctype html>
<html><head>
  <meta charset="utf-8">
  <title>${escapeHtml(meta.setlistName || songs[0]?.title || 'TLK Export')}</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #000; max-width: 7.5in; margin: 0 auto; padding: 16px; }
    .cover { text-align: center; padding: 24px 0; }
    .cover h1 { font-size: 48px; margin: 0 0 16px; letter-spacing: -1px; }
    .cover-meta { font-size: 14px; color: #666; margin-bottom: 24px; }
    .cover-notes { font-size: 12px; font-style: italic; margin-bottom: 24px; }
    .cover-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    .cover-table th, .cover-table td { padding: 8px; border-bottom: 1px solid #ccc; text-align: left; font-size: 12px; }
    .cover-table th { background: #f0f0f0; font-weight: 700; }
    .song-block { padding: 12px 0; }
    .song-title { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .song-meta { font-size: 11px; color: #666; margin-bottom: 16px; font-family: monospace; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 18px; margin-bottom: 8px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .lyrics { font-size: 12px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 12px; }
    .chords { font-size: 11px; line-height: 1.4; white-space: pre-wrap; color: #0066cc; margin-bottom: 8px; font-family: monospace; }
    .guitar-tab, .bass-tab { font-size: 10px; font-family: monospace; white-space: pre; margin: 8px 0; padding: 8px; background: #f5f5f5; border-left: 3px solid #888; overflow-x: auto; }
    .drum-grid { font-size: 9px; font-family: monospace; white-space: pre; padding: 8px; background: #f9f9f9; margin: 8px 0; }
    .chord-diagram-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 8px 0; }
    .chord-diagram-row svg { width: 60px; height: 80px; }
    .chord-diagram-label { font-size: 11px; text-align: center; font-family: monospace; font-weight: 700; }
    .notes { font-size: 11px; padding: 8px; background: #fff8e1; border-left: 3px solid #f0c040; margin: 8px 0; white-space: pre-wrap; }
    @media print { .no-print { display: none; } }
  </style>
</head><body>
  ${setlistCover}
  ${songBlocks}
  <script>
    // Auto-print after a tiny delay so styles settle
    setTimeout(() => { window.print(); }, 100);
  </script>
</body></html>`
}

function renderSongBlock(song: Song, opts: Record<SectionOption, boolean>): string {
  // Collect chord names for diagrams
  const chordNames = new Set<string>()
  song.sections.forEach(sec => {
    if (!opts.chord_diagrams) return
    const matches = sec.chords.match(/[A-G][#b]?[a-z0-9susmajdim+\-#]*/g)
    if (matches) matches.forEach(m => chordNames.add(m))
  })

  return `
    <div class="song-block">
      <div class="song-title">${escapeHtml(song.title)}${song.version_name ? ` <span style="font-size:14px;color:#888;">(${escapeHtml(song.version_name)})</span>` : ''}</div>
      <div class="song-meta">${song.key || '—'} · ${song.bpm || '—'} BPM · ${song.time_sig || '4/4'}${song.transpose_delta ? ` · transposed ${song.transpose_delta > 0 ? '+' : ''}${song.transpose_delta}` : ''}</div>

      ${song.sections.map(sec => `
        <div class="section">
          <div class="section-title">${escapeHtml(sec.name || SECTION_TYPE_LABELS[sec.type] || sec.type)}</div>

          ${opts.chord_names && sec.chords ? `<div class="chords">${escapeHtml(sec.chords)}</div>` : ''}
          ${opts.lyrics && sec.lyrics ? `<div class="lyrics">${escapeHtml(sec.lyrics)}</div>` : ''}

          ${opts.chord_diagrams && Array.from(chordNames).length > 0 ? `
            <div class="chord-diagram-row">
              ${Array.from(chordNames).map(c => renderChordSvg(c)).join('')}
            </div>
          ` : ''}

          ${opts.guitar_tab && sec.guitar_tab ? `<div class="guitar-tab">${escapeHtml(sec.guitar_tab)}</div>` : ''}
          ${opts.bass_tab && sec.bass_tab ? `<div class="bass-tab">${escapeHtml(sec.bass_tab)}</div>` : ''}
          ${opts.drum_grid && sec.drum_grid ? `<div class="drum-grid">${escapeHtml(renderDrumGridAsText(sec.drum_grid))}</div>` : ''}

          ${opts.notes && sec.notes ? `<div class="notes">📝 ${escapeHtml(sec.notes)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `
}

function renderChordSvg(name: string): string {
  const shape = getChord(name)
  if (!shape || !shape.fingerings) return `<div><div class="chord-diagram-label">${escapeHtml(name)}</div><div style="font-size:9px;color:#999;">no shape</div></div>`
  const strings = 6
  const frets = 4
  const baseFret = shape.baseFret || 1
  const w = 50, h = 70
  const stringSpacing = w / (strings - 1)
  const fretSpacing = (h - 20) / (frets + 1)
  const startY = 15

  const stringLines = Array.from({ length: strings }).map((_, i) => {
    const x = i * stringSpacing
    return `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + frets * fretSpacing}" stroke="#000" stroke-width="1"/>`
  }).join('')

  const fretLines = Array.from({ length: frets + 1 }).map((_, i) => {
    const y = startY + i * fretSpacing
    return `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#000" stroke-width="${i === 0 ? 2 : 1}"/>`
  }).join('')

  const dots = shape.fingerings.map((fret, i) => {
    if (fret === null || fret === undefined) return ''
    const x = i * stringSpacing
    if (fret === -1) {
      // muted
      return `<text x="${x}" y="${startY - 4}" text-anchor="middle" font-size="10" font-weight="bold">×</text>`
    }
    if (fret === 0) {
      // open
      return `<text x="${x}" y="${startY - 4}" text-anchor="middle" font-size="10" font-weight="bold">○</text>`
    }
    const y = startY + (fret - baseFret + 0.5) * fretSpacing
    if (y < startY || y > startY + frets * fretSpacing) return ''
    return `<circle cx="${x}" cy="${y}" r="5" fill="#000"/>`
  }).join('')

  const baseFretLabel = baseFret > 1 ? `<text x="${w + 4}" y="${startY + 0.5 * fretSpacing}" font-size="8" fill="#666">${baseFret}</text>` : ''

  return `<div>
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${fretLines}${stringLines}${dots}</svg>
    <div class="chord-diagram-label">${escapeHtml(name)}</div>
    ${baseFretLabel}
  </div>`
}

function renderDrumGridAsText(grid: any): string {
  if (!grid || !grid.rows) return ''
  const lines: string[] = []
  const rows = ['kick', 'snare', 'hihat', 'hitom1', 'hitom2', 'floortom', 'crash', 'splash', 'ride']
  const subs = grid.subdivisions || 8
  const bars = grid.bars || 1
  const labelWidth = 8
  for (const r of rows) {
    const cells = grid.rows[r] || []
    const row = r.padEnd(labelWidth) + ': ' + cells.map((v: number, i: number) => {
      if (i > 0 && i % subs === 0) return '| ' + (v ? '■' : '·')
      return v ? '■' : '·'
    }).join(' ')
    lines.push(row)
  }
  return lines.join('\n')
}

// ═══════════════════════════════════════════════════════════════
// WORD DOC TEXT (lyrics only)
// ═══════════════════════════════════════════════════════════════

function generateWordDocText(songs: Song[]): string {
  const lines: string[] = []
  songs.forEach((s, i) => {
    if (i > 0) lines.push('\n\n----------------------------------------\n\n')
    lines.push(s.title.toUpperCase())
    if (s.version_name) lines.push(`(${s.version_name})`)
    lines.push('')
    lines.push(`${s.key || ''}   ${s.bpm || ''} BPM   ${s.time_sig || '4/4'}`)
    lines.push('')
    s.sections.forEach(sec => {
      lines.push('[' + (sec.name || SECTION_TYPE_LABELS[sec.type] || sec.type) + ']')
      if (sec.chords) lines.push(sec.chords)
      if (sec.lyrics) lines.push(sec.lyrics)
      lines.push('')
    })
  })
  return lines.join('\n')
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
