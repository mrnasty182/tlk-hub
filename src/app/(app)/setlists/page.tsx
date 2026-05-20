export default function Setlists() {
  const setlists = [
    { id: 1, name: 'Friday Night Lights', songCount: 8, duration: '45 min', lastPlayed: 'May 15' },
    { id: 2, name: 'Open Mic Night', songCount: 5, duration: '30 min', lastPlayed: 'May 8' },
    { id: 3, name: 'Practice Session', songCount: 4, duration: '25 min', lastPlayed: 'May 5' },
  ];

  return (
    <div className="setlists-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Setlists</h1>
          <p className="page-subtitle">{setlists.length} setlists</p>
        </div>
        <button className="btn btn-primary">
          <span>+</span> Create Setlist
        </button>
      </header>

      <div className="setlists-grid">
        {setlists.map((setlist) => (
          <div key={setlist.id} className="setlist-card">
            <div className="setlist-header">
              <h3 className="setlist-name">{setlist.name}</h3>
              <span className="song-count-badge">{setlist.songCount} songs</span>
            </div>
            <div className="setlist-meta">
              <span className="meta-item">⏱️ {setlist.duration}</span>
              <span className="meta-item">📅 Last: {setlist.lastPlayed}</span>
            </div>
            <div className="setlist-actions">
              <button className="btn btn-ghost btn-sm">View</button>
              <button className="btn btn-ghost btn-sm">Edit</button>
              <button className="btn btn-ghost btn-sm">Play</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .setlists-page {
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
        .setlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .setlist-card {
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 12px;
          padding: 24px;
          transition: all 0.2s;
        }
        .setlist-card:hover {
          border-color: var(--lk-violet);
        }
        .setlist-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .setlist-name {
          font-family: var(--font-heading);
          font-size: 20px;
        }
        .song-count-badge {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--lk-pink);
          background: rgba(255,45,155,0.1);
          padding: 4px 10px;
          border-radius: 4px;
        }
        .setlist-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          color: var(--lk-muted);
          font-size: 14px;
        }
        .setlist-actions {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}