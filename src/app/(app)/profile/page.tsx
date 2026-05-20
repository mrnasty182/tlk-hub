'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Profile() {
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

  const practiceHistory = [
    { date: 'May 19', minutes: 45, songs: ['Thunderstruck', 'Back in Black'] },
    { date: 'May 18', minutes: 30, songs: ['Highway to Hell'] },
    { date: 'May 17', minutes: 60, songs: ['Pour Some Sugar', 'Livin on a Prayer'] },
    { date: 'May 16', minutes: 20, songs: ['Enter Sandman'] },
    { date: 'May 15', minutes: 50, songs: ['Sweet Child', 'Thunderstruck'] },
  ];

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="profile-page">
      <header className="page-header">
        <h1 className="page-title">Profile</h1>
      </header>

      <div className="profile-grid">
        <section className="profile-card user-info-card">
          <div className="user-avatar-large">
            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="user-details-full">
            <h2 className="user-name-large">{user?.user_metadata?.full_name || 'User'}</h2>
            <p className="user-email-full">{user?.email}</p>
          </div>
          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-value">12</span>
              <span className="stat-label">Total Songs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">5</span>
              <span className="stat-label">Day Streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">4h 30m</span>
              <span className="stat-label">This Week</span>
            </div>
          </div>
        </section>

        <section className="profile-card practice-history">
          <h2 className="card-title">📊 Practice History</h2>
          <div className="history-list">
            {practiceHistory.map((entry, i) => (
              <div key={i} className="history-item">
                <div className="history-date">{entry.date}</div>
                <div className="history-details">
                  <span className="history-minutes">{entry.minutes} min</span>
                  <span className="history-songs">{entry.songs.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .profile-page {
          padding: 32px;
        }
        .page-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .page-header {
          margin-bottom: 32px;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 36px;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
        }
        .profile-card {
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 16px;
          padding: 32px;
        }
        .user-info-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .user-avatar-large {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--lk-pink), var(--lk-violet));
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--lk-black);
          margin-bottom: 20px;
        }
        .user-name-large {
          font-family: var(--font-heading);
          font-size: 24px;
          margin-bottom: 4px;
        }
        .user-email-full {
          color: var(--lk-muted);
          font-size: 14px;
          margin-bottom: 24px;
        }
        .user-stats {
          display: flex;
          gap: 24px;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--lk-gold);
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--lk-muted);
        }
        .practice-history .card-title {
          font-family: var(--font-heading);
          font-size: 18px;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .history-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--lk-deep);
          border-radius: 8px;
        }
        .history-date {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--lk-teal);
          min-width: 80px;
        }
        .history-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .history-minutes {
          font-family: var(--font-heading);
          font-size: 14px;
        }
        .history-songs {
          font-size: 13px;
          color: var(--lk-muted);
        }
      `}</style>
    </div>
  );
}