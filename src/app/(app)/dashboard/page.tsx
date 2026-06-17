'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getStoredSongs, getStoredEvents, DEFAULT_EVENTS, type StoredSong, type StoredEvent } from '@/lib/dashboardData'

const BRAND = {
  hotPink: '#FF2D9B',
  electricTeal: '#00E5CC',
  deepViolet: '#7B2FBE',
  glamGold: '#F0C040',
  midnight: '#08060F',
  muted: '#6B6180',
  surface: '#130E20',
  card: '#0E0B18',
}

interface StatCardProps {
  value: string | number
  label: string
  accent: string
}

function StatCard({ value, label, accent }: StatCardProps) {
  return (
    <div style={{
      background: BRAND.card,
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden',
      minWidth: '180px',
      flex: 1,
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        background: accent,
      }} />
      <span style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: '48px',
        color: accent,
        lineHeight: 1,
      }}>{value}</span>
      <span style={{
        fontFamily: '"Oswald", sans-serif',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: BRAND.muted,
      }}>{label}</span>
    </div>
  )
}

interface EventCardProps {
  title: string
  date: string
  time: string
  venue?: string
  link?: string
  countdown: string
  accent: string
}

function EventCard({ title, date, time, venue, link, countdown, accent }: EventCardProps) {
  return (
    <div style={{
      background: BRAND.card,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontFamily: '"Oswald", sans-serif',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: accent,
        }}>{title}</span>
      </div>
      <span style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: '24px',
        color: '#fff',
      }}>{date}</span>
      <span style={{
        fontFamily: '"Oswald", sans-serif',
        fontSize: '14px',
        color: BRAND.muted,
      }}>{time}</span>
      {venue && (
        <span style={{
          fontFamily: '"Oswald", sans-serif',
          fontSize: '12px',
          color: BRAND.muted,
        }}>{venue}</span>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            color: BRAND.electricTeal,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          🔗 Join Jam
        </a>
      )}
      <div style={{
        marginTop: '8px',
        padding: '6px 12px',
        background: `${accent}20`,
        borderRadius: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
      }}>
        <span style={{
          fontFamily: '"Oswald", sans-serif',
          fontSize: '11px',
          color: accent,
        }}>{countdown}</span>
      </div>
    </div>
  )
}

interface SongItemProps {
  title: string
  keySig: string
  bpm: number
  genre?: string
  onClick?: () => void
}

function SongItem({ title, keySig, bpm, genre, onClick }: SongItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        background: BRAND.card,
        borderRadius: '10px',
        border: '1px solid #1E1830',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = BRAND.hotPink }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = '#1E1830' }}
    >
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: '"Oswald", sans-serif', fontSize: '14px', color: '#fff', letterSpacing: '0.5px' }}>{title}</span>
        {genre && <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '10px', color: BRAND.muted, marginLeft: '8px' }}>{genre}</span>}
      </div>
      <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: BRAND.electricTeal, marginRight: '16px' }}>{keySig}</span>
      <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: BRAND.glamGold }}>{bpm}</span>
    </div>
  )
}

interface QuickActionProps {
  icon: string
  label: string
  onClick: () => void
  primary?: boolean
}

function QuickAction({ icon, label, onClick, primary }: QuickActionProps) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        background: primary ? BRAND.hotPink : hover ? `${BRAND.hotPink}40` : 'transparent',
        border: `1px solid ${hover ? BRAND.hotPink : BRAND.muted}`,
        borderRadius: '50px',
        color: primary ? '#fff' : hover ? BRAND.hotPink : '#fff',
        fontFamily: '"Oswald", sans-serif',
        fontSize: '13px',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function getCountdown(dateStr: string): string {
  const now = new Date()
  const eventDate = new Date(dateStr)
  const diff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Past'
  if (diff === 0) return 'Today!'
  if (diff === 1) return 'Tomorrow'
  return `${diff} days away`
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardPage() {
  const router = useRouter()
  const [songs, setSongs] = useState<StoredSong[]>([])
  const [events, setEvents] = useState<StoredEvent[]>([])

  useEffect(() => {
    const storedSongs = getStoredSongs()
    const storedEvents = getStoredEvents()
    setSongs(storedSongs)
    setEvents(storedEvents.length > 0 ? storedEvents : DEFAULT_EVENTS)
  }, [])

  const upcomingRehearsals = events.filter(e => e.type === 'rehearsal')
  const upcomingGigs = events.filter(e => e.type === 'gig')
  const nextRehearsal = upcomingRehearsals.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  const nextGig = upcomingGigs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  const recentSongs = songs.slice(0, 5)

  const handleAddSong = () => router.push('/composer')
  const handleSchedule = () => router.push('/calendar')
  const handleBuildSetlist = () => router.push('/setlists')

  return (
    <div style={{
      minHeight: '100vh',
      background: BRAND.midnight,
      padding: '24px 16px',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '48px',
            color: BRAND.hotPink,
            margin: 0,
            lineHeight: 1,
          }}>DASHBOARD</h1>
          <p style={{
            fontFamily: '"Oswald", sans-serif',
            fontSize: '14px',
            color: BRAND.muted,
            margin: '8px 0 0',
            letterSpacing: '1px',
          }}>The Loin Kings — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </header>

        {/* Stat Cards */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <StatCard value={songs.length} label="Total Songs" accent={BRAND.hotPink} />
            <StatCard value={upcomingGigs.length} label="Upcoming Gigs" accent={BRAND.electricTeal} />
            <StatCard value={upcomingRehearsals.length} label="Rehearsals This Month" accent={BRAND.deepViolet} />
            <StatCard value={0} label="Total Sets" accent={BRAND.glamGold} />
          </div>
        </section>

        {/* Upcoming Events */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '24px',
            color: '#fff',
            marginBottom: '16px',
          }}>Upcoming</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {nextRehearsal ? (
              <div style={{ flex: 1, minWidth: '280px' }}>
                <EventCard
                  title="Next Rehearsal"
                  date={formatEventDate(nextRehearsal.date)}
                  time={nextRehearsal.time}
                  countdown={getCountdown(nextRehearsal.date)}
                  accent={BRAND.deepViolet}
                />
              </div>
            ) : (
              <div style={{ flex: 1, minWidth: '280px', background: BRAND.card, borderRadius: '12px', padding: '20px' }}>
                <span style={{ fontFamily: '"Oswald", sans-serif', fontSize: '12px', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Next Rehearsal</span>
                <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '18px', color: BRAND.muted, margin: '8px 0 0' }}>No rehearsals scheduled</p>
                <button onClick={() => router.push('/calendar')} style={{ marginTop: '12px', padding: '8px 16px', background: BRAND.deepViolet + '30', border: `1px solid ${BRAND.deepViolet}`, borderRadius: '8px', color: BRAND.deepViolet, fontFamily: '"Oswald", sans-serif', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>+ Schedule Rehearsal</button>
              </div>
            )}
            {nextGig ? (
              <div style={{ flex: 1, minWidth: '280px' }}>
                <EventCard
                  title="Next Gig"
                  date={formatEventDate(nextGig.date)}
                  time={nextGig.time}
                  venue={nextGig.venue}
                  countdown={getCountdown(nextGig.date)}
                  accent={BRAND.electricTeal}
                />
              </div>
            ) : (
              <div style={{ flex: 1, minWidth: '280px', background: BRAND.card, borderRadius: '12px', padding: '20px' }}>
                <span style={{ fontFamily: '"Oswald", sans-serif', fontSize: '12px', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Next Gig</span>
                <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '18px', color: BRAND.muted, margin: '8px 0 0' }}>No gigs scheduled</p>
                <button onClick={() => router.push('/calendar')} style={{ marginTop: '12px', padding: '8px 16px', background: BRAND.electricTeal + '30', border: `1px solid ${BRAND.electricTeal}`, borderRadius: '8px', color: BRAND.electricTeal, fontFamily: '"Oswald", sans-serif', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>+ Add Gig</button>
              </div>
            )}
          </div>
        </section>

        {/* Recent Songs */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '24px',
              color: '#fff',
              margin: 0,
            }}>Recent Songs</h2>
            <Link href="/songs" style={{
              fontFamily: '"Oswald", sans-serif',
              fontSize: '11px',
              color: BRAND.hotPink,
              textDecoration: 'none',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>View All →</Link>
          </div>
          <div className="dashboard-recent-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {recentSongs.length > 0 ? recentSongs.map(song => (
              <SongItem
                key={song.id}
                title={song.title}
                keySig={song.key}
                bpm={song.bpm}
                onClick={() => router.push(`/composer?songId=${song.id}`)}
              />
            )) : (
              <div style={{ padding: '24px', background: BRAND.card, borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ fontFamily: '"Oswald", sans-serif', fontSize: '14px', color: BRAND.muted, margin: '0 0 12px' }}>No songs yet</p>
                <button onClick={handleAddSong} style={{ padding: '10px 20px', background: BRAND.hotPink, border: 'none', borderRadius: '8px', color: '#08060F', fontFamily: '"Oswald", sans-serif', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>+ Add First Song</button>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '24px',
            color: '#fff',
            marginBottom: '16px',
          }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <QuickAction
              icon="📋"
              label="+ New Song"
              onClick={handleAddSong}
            />
            <QuickAction
              icon="📅"
              label="Schedule"
              onClick={handleSchedule}
            />
            <QuickAction
              icon="🎸"
              label="Build Setlist"
              onClick={handleBuildSetlist}
              primary
            />
            <QuickAction
              icon="✏️"
              label="Compose"
              onClick={() => router.push('/composer')}
            />
            <QuickAction
              icon="🎹"
              label="Scales"
              onClick={() => router.push('/scales')}
            />
          </div>
        </section>

        {/* Practice Stats */}
        <section>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '24px',
            color: '#fff',
            marginBottom: '16px',
          }}>Practice Stats</h2>
          <div style={{
            background: BRAND.card,
            borderRadius: '12px',
            padding: '24px',
          }}>
            <p style={{ fontFamily: '"Space Mono", monospace', fontSize: '12px', color: BRAND.muted, margin: '0 0 16px' }}>Practice tracking coming soon — log sessions in the calendar to see your progress here.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontFamily: '"Oswald", sans-serif', fontSize: '10px', color: BRAND.muted, textTransform: 'uppercase' }}>Total Practice Time</span>
                <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: BRAND.electricTeal, margin: '4px 0 0' }}>— hrs</p>
              </div>
              <div>
                <span style={{ fontFamily: '"Oswald", sans-serif', fontSize: '10px', color: BRAND.muted, textTransform: 'uppercase' }}>Sessions</span>
                <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: BRAND.glamGold, margin: '4px 0 0' }}>0</p>
              </div>
              <div>
                <span style={{ fontFamily: '"Oswald", sans-serif', fontSize: '10px', color: BRAND.muted, textTransform: 'uppercase' }}>Avg Duration</span>
                <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: BRAND.deepViolet, margin: '4px 0 0' }}>— hrs</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}