'use client';

import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';

const BRAND = {
  hotPink: '#FF2D9B',
  electricTeal: '#00E5CC',
  deepViolet: '#7B2FBE',
  glamGold: '#F0C040',
  midnight: '#08060F',
  muted: '#6B6180',
  surface: '#130E20',
  card: '#0E0B18',
};

type EventType = 'rehearsal' | 'gig';

interface CalendarEvent {
  id: string;
  date: Date;
  type: EventType;
  time: string;
  notes: string;
  venue?: string;
  link?: string;
}

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    date: new Date(2026, 4, 22),
    type: 'rehearsal',
    time: '7:00 PM',
    notes: 'Practice setlist for upcoming shows',
  },
  {
    id: '2',
    date: new Date(2026, 4, 29),
    type: 'rehearsal',
    time: '7:00 PM',
    notes: 'New material run-through',
  },
  {
    id: '3',
    date: new Date(2026, 5, 5),
    type: 'gig',
    time: '9:00 PM',
    notes: 'Main stage performance',
    venue: 'The Rusty Nail',
  },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TODAY = new Date(2026, 4, 20);

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface JamCalendarHandle {
  openModal: (date: Date) => void;
}

const JamCalendar = forwardRef<JamCalendarHandle>((_, ref) => {
  const [currentMonth, setCurrentMonth] = useState(TODAY.getMonth());
  const [currentYear, setCurrentYear] = useState(TODAY.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventType, setEventType] = useState<EventType>('rehearsal');
  const [eventTime, setEventTime] = useState('7:00 PM');
  const [eventNotes, setEventNotes] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventLink, setEventLink] = useState('');

  // ── Persist events to localStorage so dashboard can read them ──
  useEffect(() => {
    const stored = localStorage.getItem('tlk-events-v2')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CalendarEvent[]
        // Convert date strings back to Date objects
        const withDates = parsed.map(e => ({ ...e, date: new Date(e.date) }))
        setEvents(withDates)
      } catch { /* use defaults */ }
    }
  }, [])

  useEffect(() => {
    const toStore = events.map(e => ({
      ...e,
      date: e.date instanceof Date ? e.date.toISOString().split('T')[0] : e.date,
    }))
    localStorage.setItem('tlk-events-v2', JSON.stringify(toStore))
  }, [events])

  useImperativeHandle(ref, () => ({
    openModal: (date: Date) => {
      setSelectedDate(date);
      setEventType('rehearsal');
      setEventTime('7:00 PM');
      setEventNotes('');
      setEventVenue('');
      setEventLink('');
      setModalOpen(true);
    },
  }), []);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEventType('rehearsal');
    setEventTime('7:00 PM');
    setEventNotes('');
    setEventVenue('');
    setEventLink('');
    setModalOpen(true);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(TODAY.getMonth());
    setCurrentYear(TODAY.getFullYear());
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDate(null);
  };

  const saveEvent = () => {
    if (!selectedDate) return;
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      date: new Date(selectedDate),
      type: eventType,
      time: eventTime,
      notes: eventNotes,
      venue: eventVenue || undefined,
      link: eventLink || undefined,
    };
    setEvents([...events, newEvent]);
    closeModal();
  };

  const getEventsForDay = (day: number): CalendarEvent[] => {
    return events.filter((e) => {
      const eventDate = e.date;
      return eventDate.getFullYear() === currentYear &&
             eventDate.getMonth() === currentMonth &&
             eventDate.getDate() === day;
    });
  };

  const renderCalendarCells = () => {
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDayOffset; i++) {
      cells.push(
        <div key={`empty-${i}`} style={{ minHeight: '100px', background: BRAND.card, borderRadius: '8px' }} />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = currentYear === TODAY.getFullYear() &&
                      currentMonth === TODAY.getMonth() &&
                      day === TODAY.getDate();

      cells.push(
        <div
          key={day}
          onClick={() => handleDayClick(new Date(currentYear, currentMonth, day))}
          style={{
            minHeight: '100px',
            background: BRAND.card,
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            border: `1px solid ${BRAND.muted}33`,
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = BRAND.hotPink)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${BRAND.muted}33`)}
        >
          <div style={{ position: 'relative', width: '28px', height: '28px', marginBottom: '4px' }}>
            {isToday && (
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: BRAND.hotPink,
                opacity: 0.2,
              }} />
            )}
            <span style={{
              position: 'relative',
              zIndex: 1,
              fontFamily: 'Arial, sans-serif',
              fontSize: '13px',
              fontWeight: isToday ? '700' : '400',
              color: isToday ? BRAND.hotPink : BRAND.muted,
            }}>
              {day}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {dayEvents.map((evt) => (
              <div
                key={evt.id}
                style={{
                  background: evt.type === 'gig' ? BRAND.hotPink : BRAND.deepViolet,
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: '600',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {evt.link ? (
                  <a
                    href={evt.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', flex: 1, overflow: 'hidden' }}
                    title={evt.link}
                  >
                    🔗 {evt.type === 'gig' ? `GIG${evt.venue ? ` • ${evt.venue}` : ''}` : 'Rehearsal'}
                  </a>
                ) : (
                  <span>{evt.type === 'gig' ? `GIG${evt.venue ? ` • ${evt.venue}` : ''}` : 'Rehearsal'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  const formatSelectedDate = (): string => {
    if (!selectedDate) return '';
    return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  };

  return (
    <div style={{
      background: BRAND.surface,
      minHeight: '100vh',
      padding: '24px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={prevMonth}
              style={{
                background: 'transparent',
                border: `1px solid ${BRAND.muted}`,
                borderRadius: '6px',
                color: BRAND.electricTeal,
                fontSize: '16px',
                cursor: 'pointer',
                padding: '6px 12px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.card)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              ‹
            </button>
            <h2 style={{
              fontFamily: 'Bebas Neue, Impact, sans-serif',
              fontSize: '24px',
              color: BRAND.hotPink,
              margin: 0,
              letterSpacing: '1px',
              minWidth: '160px',
              textAlign: 'center',
            }}>
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              style={{
                background: 'transparent',
                border: `1px solid ${BRAND.muted}`,
                borderRadius: '6px',
                color: BRAND.electricTeal,
                fontSize: '16px',
                cursor: 'pointer',
                padding: '6px 12px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.card)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              ›
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={goToToday}
              style={{
                background: BRAND.deepViolet,
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 16px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Today
            </button>
            <button
              onClick={() => handleDayClick(new Date(currentYear, currentMonth, TODAY.getDate()))}
              style={{
                background: BRAND.hotPink,
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 16px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              + Add Event
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '8px',
        }}>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '700',
                color: BRAND.glamGold,
                letterSpacing: '1px',
                padding: '8px 0',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
        }}>
          {renderCalendarCells()}
        </div>

        {/* Event Pills Legend */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '20px',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: BRAND.deepViolet }} />
            <span style={{ fontSize: '12px', color: BRAND.muted }}>Rehearsal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: BRAND.hotPink }} />
            <span style={{ fontSize: '12px', color: BRAND.muted }}>Gig</span>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 6, 15, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: BRAND.surface,
              borderRadius: '12px',
              padding: '28px',
              width: '100%',
              maxWidth: '400px',
              border: `1px solid ${BRAND.muted}44`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontFamily: 'Bebas Neue, Impact, sans-serif',
              fontSize: '22px',
              color: BRAND.hotPink,
              margin: '0 0 20px 0',
              letterSpacing: '1px',
            }}>
              Add Event
            </h3>

            <p style={{ fontSize: '14px', color: BRAND.electricTeal, marginBottom: '16px' }}>
              {formatSelectedDate()}
            </p>

            {/* Event Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: BRAND.muted, marginBottom: '6px', fontWeight: '600' }}>
                EVENT TYPE
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setEventType('rehearsal')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: `2px solid ${eventType === 'rehearsal' ? BRAND.deepViolet : BRAND.muted}`,
                    background: eventType === 'rehearsal' ? `${BRAND.deepViolet}33` : 'transparent',
                    color: eventType === 'rehearsal' ? BRAND.deepViolet : BRAND.muted,
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Rehearsal
                </button>
                <button
                  onClick={() => setEventType('gig')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: `2px solid ${eventType === 'gig' ? BRAND.hotPink : BRAND.muted}`,
                    background: eventType === 'gig' ? `${BRAND.hotPink}33` : 'transparent',
                    color: eventType === 'gig' ? BRAND.hotPink : BRAND.muted,
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Gig
                </button>
              </div>
            </div>

            {/* Time */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: BRAND.muted, marginBottom: '6px', fontWeight: '600' }}>
                TIME
              </label>
              <input
                type="text"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="e.g. 7:00 PM"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${BRAND.muted}`,
                  background: BRAND.card,
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Venue (Gig only) */}
            {eventType === 'gig' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: BRAND.muted, marginBottom: '6px', fontWeight: '600' }}>
                  VENUE
                </label>
                <input
                  type="text"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g. The Rusty Nail"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${BRAND.muted}`,
                    background: BRAND.card,
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Link (for jam sessions) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: BRAND.muted, marginBottom: '6px', fontWeight: '600' }}>
                JAM LINK
              </label>
              <input
                type="url"
                value={eventLink}
                onChange={(e) => setEventLink(e.target.value)}
                placeholder="https://zoom.us/j/... or FaceTime link"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${BRAND.muted}`,
                  background: BRAND.card,
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: BRAND.muted, marginBottom: '6px', fontWeight: '600' }}>
                NOTES
              </label>
              <textarea
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="Add details..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${BRAND.muted}`,
                  background: BRAND.card,
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'Arial, sans-serif',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${BRAND.muted}`,
                  background: 'transparent',
                  color: BRAND.muted,
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = BRAND.electricTeal;
                  e.currentTarget.style.color = BRAND.electricTeal;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BRAND.muted;
                  e.currentTarget.style.color = BRAND.muted;
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEvent}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: BRAND.hotPink,
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default JamCalendar;
