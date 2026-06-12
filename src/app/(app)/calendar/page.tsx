import JamCalendar from '@/components/JamCalendar'

export default function CalendarPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#08060F' }}>
      {/* Header */}
      <div style={{ padding: '40px 48px 24px', borderBottom: '1px solid #1E1830' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 48, letterSpacing: 4, color: '#FF2D9B', margin: 0 }}>CALENDAR</h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#6B6180', marginTop: 6 }}>Rehearsals & Gigs — May 2026</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, padding: '20px 48px', background: '#0E0B18', borderBottom: '1px solid #1E1830' }}>
        {[
          { label: 'Rehearsals', value: '2', color: '#7B2FBE' },
          { label: 'Gigs', value: '1', color: '#FF2D9B' },
          { label: 'Next Event', value: 'May 22', color: '#00E5CC' },
          { label: 'Days Until Next Gig', value: '16', color: '#F0C040' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#130E20', border: '1px solid #1E1830', borderRadius: 10, borderLeft: `3px solid ${color}` }}>
            <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 28, color, lineHeight: 1 }}>{value}</span>
            <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6B6180' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ padding: '24px 48px' }}>
        <JamCalendar />
      </div>
    </div>
  )
}