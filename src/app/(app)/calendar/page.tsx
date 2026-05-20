export default function Calendar() {
  const events = [
    { id: 1, title: 'Saturday Night Jam', type: 'jam', date: 'May 23', time: '7:00 PM', location: 'The Dungeon' },
    { id: 2, title: 'Band Practice', type: 'practice', date: 'May 28', time: '6:00 PM', location: 'The Garage' },
    { id: 3, title: 'Open Mic Night', type: 'gig', date: 'June 5', time: '8:00 PM', location: 'The Rusty Nail' },
  ];

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'jam': return 'var(--lk-pink)';
      case 'practice': return 'var(--lk-teal)';
      case 'gig': return 'var(--lk-gold)';
      default: return 'var(--lk-muted)';
    }
  };

  return (
    <div className="calendar-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">{events.length} upcoming events</p>
        </div>
        <button className="btn btn-primary">
          <span>+</span> Add Event
        </button>
      </header>

      <div className="calendar-container">
        <div className="calendar-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="calendar-header">{day}</div>
          ))}
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} className={`calendar-cell ${i < 5 || i > 18 ? 'empty' : ''} ${[12, 18, 23].includes(i) ? 'has-event' : ''}`}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <section className="upcoming-events">
        <h2 className="section-title">Upcoming Events</h2>
        <div className="events-list">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-indicator" style={{ background: getTypeColor(event.type) }}></div>
              <div className="event-info">
                <h3 className="event-title">{event.title}</h3>
                <div className="event-meta">
                  <span>📅 {event.date}</span>
                  <span>⏰ {event.time}</span>
                  <span>📍 {event.location}</span>
                </div>
              </div>
              <div className="event-type-badge" style={{ color: getTypeColor(event.type) }}>
                {event.type.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .calendar-page {
          padding: 32px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 36px;
          margin-bottom: 4px;
        }
        .page-subtitle {
          color: var(--lk-muted);
          font-size: 14px;
        }
        .calendar-container {
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 40px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        .calendar-header {
          font-family: var(--font-heading);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--lk-muted);
          text-align: center;
          padding: 12px;
        }
        .calendar-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 14px;
          color: var(--lk-white);
          background: var(--lk-deep);
          border: 1px solid var(--lk-subtle);
        }
        .calendar-cell.empty {
          background: transparent;
          border-color: transparent;
          color: var(--lk-subtle);
        }
        .calendar-cell.has-event {
          background: linear-gradient(135deg, rgba(255,45,155,0.2), rgba(123,47,190,0.2));
          border-color: var(--lk-pink);
        }
        .upcoming-events {
          margin-top: 40px;
        }
        .section-title {
          font-family: var(--font-heading);
          font-size: 20px;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .event-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 12px;
          padding: 20px;
        }
        .event-indicator {
          width: 4px;
          height: 48px;
          border-radius: 2px;
        }
        .event-info {
          flex: 1;
        }
        .event-title {
          font-family: var(--font-heading);
          font-size: 16px;
          margin-bottom: 8px;
        }
        .event-meta {
          display: flex;
          gap: 20px;
          color: var(--lk-muted);
          font-size: 13px;
        }
        .event-type-badge {
          font-family: var(--font-heading);
          font-size: 10px;
          letter-spacing: 2px;
        }
      `}</style>
    </div>
  );
}