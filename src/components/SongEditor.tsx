'use client'

import React, { useState, useCallback } from 'react'

interface SongEditorProps {
  initialContent?: string
  onSave?: (content: string) => void
  onChordTap?: (chord: string) => void
}

const SECTION_TYPES = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'solo'] as const

interface ParsedLine {
  type: 'chords' | 'lyrics' | 'section' | 'comment'
  content: string
  sectionType?: string
}

export default function SongEditor({ initialContent = '', onSave, onChordTap }: SongEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [key, setKey] = useState('')
  const [bpm, setBpm] = useState<number | undefined>()
  const [notes, setNotes] = useState('')
  const [showMetadata, setShowMetadata] = useState(false)

  const parseContent = useCallback((text: string): ParsedLine[] => {
    const lines: ParsedLine[] = []
    const parts = text.split('\n')
    
    parts.forEach(line => {
      // Section header like [verse] or [chorus]
      const sectionMatch = line.match(/^\[(\w+)\]\s*(.*)$/)
      if (sectionMatch) {
        lines.push({
          type: 'section',
          content: sectionMatch[2] || sectionMatch[1],
          sectionType: sectionMatch[1]
        })
        return
      }
      
      // Comment line starting with //
      if (line.startsWith('//')) {
        lines.push({ type: 'comment', content: line.slice(2).trim() })
        return
      }
      
      // Chord line (contains chord patterns like Cmaj G7)
      const chordPattern = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|M)*\s+/
      if (chordPattern.test(line) || line.split(' ').every(part => /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|M)*$/.test(part))) {
        lines.push({ type: 'chords', content: line })
        return
      }
      
      // Lyrics line
      if (line.trim()) {
        lines.push({ type: 'lyrics', content: line })
        return
      }
      
      // Empty line
      lines.push({ type: 'lyrics', content: '' })
    })
    
    return lines
  }, [])

  const parsedLines = parseContent(content)

  // Extract chords from content for the chord panel
  const extractedChords = React.useMemo(() => {
    const chordRegex = /[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|M)*/g
    const matches = content.match(chordRegex) || []
    return [...new Set(matches)]
  }, [content])

  const handleSave = () => {
    if (onSave) {
      onSave(content)
    }
  }

  const insertSection = (type: string) => {
    setContent(prev => prev + `\n[${type}]\n`)
  }

  return (
    <div className="song-editor">
      {/* Metadata Bar */}
      <div className="editor-meta-bar">
        <div className="meta-fields">
          <input
            type="text"
            placeholder="Song Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input meta-input"
          />
          <input
            type="text"
            placeholder="Artist"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            className="input meta-input"
          />
          <select
            value={key}
            onChange={e => setKey(e.target.value)}
            className="input meta-select"
          >
            <option value="">Key</option>
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="BPM"
            value={bpm || ''}
            onChange={e => setBpm(parseInt(e.target.value) || undefined)}
            className="input meta-input bpm-input"
          />
        </div>
        <div className="meta-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowMetadata(!showMetadata)}>
            {showMetadata ? 'Hide' : 'Show'} Metadata
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Song
          </button>
        </div>
      </div>

      {/* Section Buttons */}
      <div className="section-buttons">
        {SECTION_TYPES.map(type => (
          <button
            key={type}
            className="btn btn-ghost btn-sm"
            onClick={() => insertSection(type)}
          >
            + {type}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="editor-split">
        {/* Raw Text Editor */}
        <div className="editor-pane">
          <div className="pane-header">
            <span>Chord Pro Format</span>
            <span className="hint">Use [verse], [chorus] for sections</span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="editor-textarea"
            placeholder={`[verse]
Cmaj G7 Cmaj G7
Am Em Fmaj G7

[chorus]
Cmaj Em Fmaj G7
Cmaj Em Fmaj G7`}
          />
        </div>

        {/* Preview Pane */}
        <div className="preview-pane">
          <div className="pane-header">
            <span>Preview</span>
          </div>
          <div className="preview-content">
            {parsedLines.map((line, idx) => {
              if (line.type === 'section') {
                return (
                  <div key={idx} className={`section-header ${line.sectionType}`}>
                    {line.content.toUpperCase()}
                  </div>
                )
              }
              if (line.type === 'chords') {
                const chords = line.content.split(' ').filter(Boolean)
                return (
                  <div key={idx} className="chord-line">
                    {chords.map((chord, cidx) => (
                      <button
                        key={cidx}
                        className="chord-btn"
                        onClick={() => onChordTap?.(chord)}
                      >
                        {chord}
                      </button>
                    ))}
                  </div>
                )
              }
              if (line.type === 'lyrics' && line.content) {
                return (
                  <div key={idx} className="lyrics-line">
                    {line.content}
                  </div>
                )
              }
              if (line.type === 'comment') {
                return (
                  <div key={idx} className="comment-line">
                    {/* {line.content} */}
                  </div>
                )
              }
              return <div key={idx} className="empty-line" />
            })}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="notes-section">
        <label>Notes / Comments</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="input"
          placeholder="Add practice notes, section reminders, etc."
          rows={3}
        />
      </div>

      {/* Extracted Chords */}
      {extractedChords.length > 0 && (
        <div className="extracted-chords">
          <span className="label">Chords Detected:</span>
          {extractedChords.map((chord, idx) => (
            <button
              key={idx}
              className="chord-chip"
              onClick={() => onChordTap?.(chord)}
            >
              {chord}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}