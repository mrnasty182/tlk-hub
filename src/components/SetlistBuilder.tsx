'use client'

import React, { useState, useEffect } from 'react'

interface SetlistSong {
  id: string
  songId: string
  title: string
  key?: string
  bpm?: number
  position: number
  notes?: string
}

interface SetlistBuilderProps {
  songs: SetlistSong[]
  onSongsChange?: (songs: SetlistSong[]) => void
  locked?: boolean
  onLockChange?: (locked: boolean) => void
  notes?: string
  onNotesChange?: (notes: string) => void
  title?: string
  onTitleChange?: (title: string) => void
}

export default function SetlistBuilder({
  songs,
  onSongsChange,
  locked = false,
  onLockChange,
  notes = '',
  onNotesChange,
  title = '',
  onTitleChange
}: SetlistBuilderProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [localSongs, setLocalSongs] = useState(songs)

  useEffect(() => {
    setLocalSongs(songs)
  }, [songs])

  const handleDragStart = (e: React.DragEvent, songId: string) => {
    if (locked) return
    setDragId(songId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (locked) return
    e.preventDefault()
    if (!dragId || dragId === targetId) return

    const dragIdx = localSongs.findIndex(s => s.id === dragId)
    const targetIdx = localSongs.findIndex(s => s.id === targetId)

    if (dragIdx === -1 || targetIdx === -1) return

    const newSongs = [...localSongs]
    const [removed] = newSongs.splice(dragIdx, 1)
    newSongs.splice(targetIdx, 0, removed)

    // Update positions
    const updatedSongs = newSongs.map((song, idx) => ({
      ...song,
      position: idx + 1
    }))

    setLocalSongs(updatedSongs)
  }

  const handleDragEnd = () => {
    setDragId(null)
    if (onSongsChange) {
      onSongsChange(localSongs)
    }
  }

  const removeSong = (songId: string) => {
    if (locked) return
    const newSongs = localSongs.filter(s => s.id !== songId).map((song, idx) => ({
      ...song,
      position: idx + 1
    }))
    setLocalSongs(newSongs)
    if (onSongsChange) {
      onSongsChange(newSongs)
    }
  }

  const totalDuration = localSongs.reduce((acc, song) => acc + (song.bpm ? 180000 / song.bpm * 4 : 240), 0)
  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="setlist-builder">
      {/* Header */}
      <div className="setlist-header">
        <input
          type="text"
          value={title}
          onChange={e => onTitleChange?.(e.target.value)}
          placeholder="Setlist Title"
          className="input setlist-title-input"
          disabled={locked}
        />
        <div className="setlist-actions">
          <button
            className={`btn ${locked ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => onLockChange?.(!locked)}
          >
            {locked ? '🔒 Locked' : '🔓 Unlocked'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="setlist-stats">
        <span>{localSongs.length} songs</span>
        <span>~{formatDuration(totalDuration * 1000)}</span>
      </div>

      {/* Song List */}
      <div className={`setlist-songs ${locked ? 'locked' : ''}`}>
        {localSongs.length === 0 ? (
          <div className="empty-state">
            No songs in setlist. Add songs from the song library.
          </div>
        ) : (
          localSongs.map((song, idx) => (
            <div
              key={song.id}
              className={`setlist-song-item ${dragId === song.id ? 'dragging' : ''}`}
              draggable={!locked}
              onDragStart={e => handleDragStart(e, song.id)}
              onDragOver={e => handleDragOver(e, song.id)}
              onDragEnd={handleDragEnd}
            >
              <span className="song-position">{song.position}</span>
              <div className="song-info">
                <span className="song-title">{song.title}</span>
                <div className="song-meta">
                  {song.key && <span className="meta-tag">{song.key}</span>}
                  {song.bpm && <span className="meta-tag">{song.bpm} BPM</span>}
                </div>
              </div>
              {!locked && (
                <button
                  className="remove-btn"
                  onClick={() => removeSong(song.id)}
                >
                  ×
                </button>
              )}
              {!locked && (
                <div className="drag-handle">⋮⋮</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notes */}
      <div className="setlist-notes">
        <label>Setlist Notes</label>
        <textarea
          value={notes}
          onChange={e => onNotesChange?.(e.target.value)}
          placeholder="Add notes about this set..."
          className="input"
          disabled={locked}
          rows={3}
        />
      </div>
    </div>
  )
}