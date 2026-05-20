'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const streakData = [
    { day: 'Mon', completed: true },
    { day: 'Tue', completed: true },
    { day: 'Wed', completed: true },
    { day: 'Thu', completed: false },
    { day: 'Fri', completed: true },
    { day: 'Sat', completed: true },
    { day: 'Sun', completed: true },
  ];

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.user_metadata?.full_name || 'King'}</p>
        </div>
        <Link href="/songs/new" className="btn btn-primary">
          <span>+</span> Add Song
        </Link>
      </header>

      <div className="dashboard-grid">
        <section className="dashboard-card streak-card">
          <div className="card-header">
            <h2 className="card-title">🔥 Practice Streak</h2>
            <span className="streak-count">5 days</span>
          </div>
          <div className="streak-visual">
            <div className="flame-icon">🔥</div>
            <div className="streak-label">Keep it going!</div>
          </div>
          <div className="week-grid">
            {streakData.map((d, i) => (
              <div key={i} className={`day-cell ${d.completed ? 'completed' : ''}`}>
                <span className="day-name">{d.day}</span>
                <div className="day-dot"></div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card jam-banner">
          <div className="jam-badge">NEXT JAM</div>
          <h2 className="jam-title">Saturday Night Jam</h2>
          <p className="jam-details">📅 Saturday, May 23rd @ 7:00 PM</p>
          <p className="jam-details">📍 The Dungeon</p>
          <div className="jam-actions">
            <button className="btn btn-gold btn-sm">View Details</button>
            <button className="btn btn-ghost btn-sm">Add to Calendar</button>
          </div>
        </section>

        <section className="dashboard-card recent-songs">
          <div className="card-header">
            <h2 className="card-title">Recent Songs</h2>
            <Link href="/songs" className="card-link">View all →</Link>
          </div>
          <div className="song-list">
            <div className="song-item">
              <span className="song-name">Thunderstruck</span>
              <span className="song-band">AC/DC</span>
              <span className="song-key">Em</span>
            </div>
            <div className="song-item">
              <span className="song-name">Back in Black</span>
              <span className="song-band">AC/DC</span>
              <span className="song-key">Am</span>
            </div>
            <div className="song-item">
              <span className="song-name">Highway to Hell</span>
              <span className="song-band">AC/DC</span>
              <span className="song-key">E</span>
            </div>
            <div className="song-item">
              <span className="song-name">Pour Some Sugar on Me</span>
              <span className="song-band">Def Leppard</span>
              <span className="song-key">A</span>
            </div>
          </div>
        </section>

        <section className="dashboard-card quick-add">
          <h2 className="card-title">Quick Add</h2>
          <div className="quick-actions">
            <Link href="/songs/new" className="quick-btn">
              <span className="quick-icon">🎵</span>
              <span>New Song</span>
            </Link>
            <Link href="/setlists/new" className="quick-btn">
              <span className="quick-icon">📋</span>
              <span>New Setlist</span>
            </Link>
            <Link href="/calendar" className="quick-btn">
              <span className="quick-icon">📅</span>
              <span>Schedule Jam</span>
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        .dashboard {
          padding: 32px;
        }
        .page-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
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
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .dashboard-card {
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 16px;
          padding: 24px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .card-title {
          font-family: var(--font-heading);
          font-size: 16px;
          letter-spacing: 1px;
        }
        .card-link {
          color: var(--lk-teal);
          font-size: 13px;
        }
        .card-link:hover {
          text-decoration: underline;
        }
        .streak-card {
          grid-column: span 1;
        }
        .streak-count {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--lk-gold);
        }
        .streak-visual {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .flame-icon {
          font-size: 48px;
        }
        .streak-label {
          font-family: var(--font-heading);
          font-size: 18px;
          color: var(--lk-pink);
        }
        .week-grid {
          display: flex;
          justify-content: space-between;
        }
        .day-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .day-name {
          font-size: 11px;
          color: var(--lk-muted);
          text-transform: uppercase;
        }
        .day-dot {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--lk-subtle);
          border: 2px solid transparent;
        }
        .day-cell.completed .day-dot {
          background: linear-gradient(135deg, var(--lk-pink), var(--lk-violet));
          border-color: var(--lk-pink);
        }
        .jam-banner {
          background: linear-gradient(135deg, rgba(123,47,190,0.2), rgba(255,45,155,0.1));
          border-color: rgba(123,47,190,0.3);
          position: relative;
          overflow: hidden;
        }
        .jam-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--lk-gold);
          color: var(--lk-black);
          font-family: var(--font-heading);
          font-size: 10px;
          padding: 6px 12px;
          border-radius: 0 16px 0 8px;
          letter-spacing: 2px;
        }
        .jam-title {
          font-family: var(--font-heading);
          font-size: 24px;
          margin-bottom: 12px;
        }
        .jam-details {
          color: var(--lk-muted);
          font-size: 14px;
          margin-bottom: 8px;
        }
        .jam-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .song-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .song-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 16px;
          align-items: center;
          padding: 12px 16px;
          background: var(--lk-deep);
          border-radius: 8px;
          border: 1px solid var(--lk-subtle);
        }
        .song-name {
          font-weight: 500;
        }
        .song-band {
          color: var(--lk-muted);
          font-size: 13px;
        }
        .song-key {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--lk-teal);
          background: rgba(0,229,204,0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }
        .quick-add .card-title {
          margin-bottom: 20px;
        }
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .quick-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          background: var(--lk-deep);
          border: 1px solid var(--lk-subtle);
          border-radius: 12px;
          transition: all 0.2s;
          color: var(--lk-white);
        }
        .quick-btn:hover {
          border-color: var(--lk-pink);
          transform: translateY(-2px);
        }
        .quick-icon {
          font-size: 28px;
        }
        .quick-btn span:last-child {
          font-size: 12px;
          font-family: var(--font-heading);
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}