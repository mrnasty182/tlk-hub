'use client'

import React, { useState } from 'react'

interface Jam {
  id: string
  title: string
  date: string
  notes?: string
  jamLink?: string
  practice: boolean
  attendees: { id: string; name: string; attended: boolean }[]
}

interface JamCalendarProps {
  jams?: Jam[]
  onJamChange?: (jams: Jam[]) => void
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function JamCalendar({ jams = [], onJamChange }: JamCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedJam, setSelectedJam] = useState<Jam | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingJam, setEditingJam] = useState<Jam | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getJamsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return jams.filter(j => j.date === dateStr)
  }

  const formatJamDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const handleSaveJam = (jam: Jam) => {
    const existingIdx = jams.findIndex(j => j.id === jam.id)
    if (existingIdx >= 0) {
      const updated = [...jams]
      updated[existingIdx] = jam
      onJamChange?.(updated)
    } else {
      onJamChange?.([...jams, jam])
    }
    setEditingJam(null)
    setShowAddModal(false)
  }

  const handleDeleteJam = (jamId: string) => {
    onJamChange?.(jams.filter(j => j.id !== jamId))
    setSelectedJam(null)
  }

  return (
    <div className="jam-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <button className="btn btn-ghost" onClick={prevMonth}>←</button>
        <h2 className="calendar-title">{MONTH_NAMES[month]} {year}</h2>
        <button className="btn btn-ghost" onClick={nextMonth}>→</button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          + Add Jam
        </button>
      </div>

      {/* Day Names */}
      <div className="calendar-grid-header">
        {DAY_NAMES.map(day => (
          <div key={day} className="day-name">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Empty cells for days before the 1st */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dayJams = getJamsForDay(day)
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

          return (
            <div key={day} className={`calendar-day ${isToday ? 'today' : ''} ${dayJams.length > 0 ? 'has-jam' : ''}`}>
              <span className="day-number">{day}</span>
              <div className="day-content">
                {dayJams.map(jam => (
                  <button
                    key={jam.id}
                    className={`jam-indicator ${jam.practice ? 'practice' : 'jam'}`}
                    onClick={() => setSelectedJam(jam)}
                  >
                    <span className="jam-title">{jam.title}</span>
                    {jam.practice && <span className="practice-dot">●</span>}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Jam Panel */}
      {selectedJam && (
        <div className="jam-detail-panel">
          <div className="jam-detail-header">
            <h3>{selectedJam.title}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedJam(null)}>×</button>
          </div>
          <div className="jam-detail-content">
            <p className="jam-date">{formatJamDate(selectedJam.date)}</p>
            {selectedJam.notes && <p className="jam-notes">{selectedJam.notes}</p>}
            {selectedJam.jamLink && (
              <a href={selectedJam.jamLink} target="_blank" rel="noopener noreferrer" className="jam-link">
                🔗 Join Jam
              </a>
            )}
            
            {/* Attendees */}
            <div className="jam-attendees">
              <h4>Attendees</h4>
              {selectedJam.attendees.length === 0 ? (
                <p className="no-attendees">No attendees marked</p>
              ) : (
                <div className="attendee-list">
                  {selectedJam.attendees.map(att => (
                    <div key={att.id} className={`attendee-item ${att.attended ? 'attended' : 'absent'}`}>
                      <span className="attendee-name">{att.name}</span>
                      <span className="attendance-mark">{att.attended ? '✓' : '✗'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="jam-detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingJam(selectedJam)}>
                Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteJam(selectedJam.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingJam) && (
        <JamModal
          jam={editingJam}
          defaultDate={`${year}-${String(month + 1).padStart(2, '0')}`}
          onSave={handleSaveJam}
          onClose={() => {
            setShowAddModal(false)
            setEditingJam(null)
          }}
        />
      )}
    </div>
  )
}

interface JamModalProps {
  jam?: Jam | null
  defaultDate: string
  onSave: (jam: Jam) => void
  onClose: () => void
}

function JamModal({ jam, defaultDate, onSave, onClose }: JamModalProps) {
  const [title, setTitle] = useState(jam?.title || '')
  const [date, setDate] = useState(jam?.date || defaultDate)
  const [notes, setNotes] = useState(jam?.notes || '')
  const [jamLink, setJamLink] = useState(jam?.jamLink || '')
  const [practice, setPractice] = useState(jam?.practice || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSave({
      id: jam?.id || `jam-${Date.now()}`,
      title,
      date,
      notes,
      jamLink,
      practice,
      attendees: jam?.attendees || []
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{jam ? 'Edit Jam' : 'Add Jam'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input"
              placeholder="Tuesday Night Jam"
              required
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="form-group">
            <label>Jam Link (Zoom/Meet/etc)</label>
            <input
              type="url"
              value={jamLink}
              onChange={e => setJamLink(e.target.value)}
              className="input"
              placeholder="https://zoom.us/j/..."
            />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input"
              placeholder="Key of E, working on transitions..."
              rows={3}
            />
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={practice}
                onChange={e => setPractice(e.target.checked)}
              />
              Practice Session (practice dot on calendar)
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}