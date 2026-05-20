'use client'

import React, { useState } from 'react'

interface Attendee {
  id: string
  name: string
  email?: string
}

interface AttendanceTrackerProps {
  attendees: Attendee[]
  onAttendanceChange?: (attendeeId: string, attended: boolean) => void
  jamId: string
}

export default function AttendanceTracker({ attendees, onAttendanceChange, jamId }: AttendanceTrackerProps) {
  const [localAttendees, setLocalAttendees] = useState(attendees.map(a => ({ ...a, attended: false })))

  const toggleAttendance = (attendeeId: string) => {
    const updated = localAttendees.map(a =>
      a.id === attendeeId ? { ...a, attended: !a.attended } : a
    )
    setLocalAttendees(updated)
    onAttendanceChange?.(attendeeId, !localAttendees.find(a => a.id === attendeeId)?.attended)
  }

  const attendedCount = localAttendees.filter(a => a.attended).length
  const streak = calculateStreak(localAttendees)

  function calculateStreak(attendees: typeof localAttendees): number {
    // Simple streak calculation: consecutive attended
    let currentStreak = 0
    for (const att of attendees) {
      if (att.attended) currentStreak++
      else break
    }
    return currentStreak
  }

  return (
    <div className="attendance-tracker">
      <div className="tracker-header">
        <h4>Attendance</h4>
        <div className="attendance-stats">
          <span className="stat">
            <span className="stat-value">{attendedCount}</span>
            <span className="stat-label">/ {localAttendees.length}</span>
          </span>
          {streak > 0 && (
            <span className="streak-badge">
              🔥 {streak} streak
            </span>
          )}
        </div>
      </div>

      <div className="attendee-checklist">
        {localAttendees.length === 0 ? (
          <p className="empty-attendees">No band members added yet</p>
        ) : (
          localAttendees.map(attendee => (
            <label key={attendee.id} className={`attendee-row ${attendee.attended ? 'attended' : ''}`}>
              <input
                type="checkbox"
                checked={attendee.attended}
                onChange={() => toggleAttendance(attendee.id)}
              />
              <span className="attendee-info">
                <span className="attendee-name">{attendee.name}</span>
                {attendee.email && <span className="attendee-email">{attendee.email}</span>}
              </span>
              <span className="check-mark">{attendee.attended ? '✓' : ''}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}