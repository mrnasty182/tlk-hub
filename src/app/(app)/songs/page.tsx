'use client';

import { useState } from 'react';
import Link from 'next/link';

type SongFilter = 'mine' | 'all';

export default function Songs() {
  const [filter, setFilter] = useState<SongFilter>('mine');
  
  const songs = [
    { id: 1, name: 'Thunderstruck', band: 'AC/DC', key: 'Em', genre: 'Rock', tempo: 134, owner: 'Chuck Berry' },
    { id: 2, name: 'Back in Black', band: 'AC/DC', key: 'Am', genre: 'Rock', tempo: 111, owner: 'Chuck Berry' },
    { id: 3, name: 'Highway to Hell', band: 'AC/DC', key: 'E', genre: 'Rock', tempo: 124, owner: 'Elvis' },
    { id: 4, name: 'Pour Some Sugar on Me', band: 'Def Leppard', key: 'A', genre: 'Rock', tempo: 138, owner: 'Chuck Berry' },
    { id: 5, name: 'Living on a Prayer', band: 'Bon Jovi', key: 'Bm', genre: 'Rock', tempo: 123, owner: 'Jimi' },
    { id: 6, name: "Don't Stop Believin'", band: 'Journey', key: 'E', genre: 'Rock', tempo: 119, owner: 'Elvis' },
    { id: 7, name: 'Enter Sandman', band: 'Metallica', key: 'Em', genre: 'Metal', tempo: 131, owner: 'Jimi' },
    { id: 8, name: 'Sweet Child O Mine', band: "Guns N' Roses", key: 'D', genre: 'Rock', tempo: 124, owner: 'Chuck Berry' },
  ];

  const filteredSongs = filter === 'mine' 
    ? songs.filter(s => s.owner === 'Chuck Berry')
    : songs;

  return (
    <div className="songs-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Songs</h1>
          <p className="page-subtitle">{filteredSongs.length} songs in library</p>
        </div>
        <Link href="/songs/new" className="btn btn-primary">
          <span>+</span> Add Song
        </Link>
      </header>

      <div className="filter-bar">
        <div className="filter-toggle">
          <button 
            className={`toggle-btn ${filter === 'mine' ? 'active' : ''}`}
            onClick={() => setFilter('mine')}
          >
            My Songs
          </button>
          <button 
            className={`toggle-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Band Songs
          </button>
        </div>
        <div className="filter-info">
          {filter === 'mine' ? 'Showing songs you created' : 'Showing all band songs'}
        </div>
      </div>

      <div className="songs-grid">
        {filteredSongs.map((song) => (
          <div key={song.id} className="song-card">
            <div className="song-card-header">
              <span className="song-genre">{song.genre}</span>
              <span className="song-owner">{song.owner}</span>
            </div>
            <h3 className="song-card-title">{song.name}</h3>
            <p className="song-card-band">{song.band}</p>
            <div className="song-card-meta">
              <span className="meta-item">
                <span className="meta-label">Key</span>
                <span className="meta-value key">{song.key}</span>
              </span>
              <span className="meta-item">
                <span className="meta-label">Tempo</span>
                <span className="meta-value">{song.tempo} BPM</span>
              </span>
            </div>
            <div className="song-card-actions">
              <button className="btn btn-ghost btn-sm">Edit</button>
              <button className="btn btn-ghost btn-sm">Setlists</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .songs-page {
          padding: 32px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
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
        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 12px;
        }
        .filter-toggle {
          display: flex;
          background: var(--lk-deep);
          border-radius: 8px;
          padding: 4px;
        }
        .toggle-btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--lk-muted);
          font-family: var(--font-heading);
          font-size: 12px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .toggle-btn:hover {
          color: var(--lk-white);
        }
        .toggle-btn.active {
          background: var(--lk-pink);
          color: var(--lk-black);
        }
        .filter-info {
          color: var(--lk-muted);
          font-size: 13px;
        }
        .songs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .song-card {
          background: var(--lk-void);
          border: 1px solid var(--lk-subtle);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s;
        }
        .song-card:hover {
          border-color: var(--lk-violet);
        }
        .song-card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .song-genre {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--lk-teal);
          background: rgba(0,229,204,0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }
        .song-owner {
          font-size: 11px;
          color: var(--lk-muted);
        }
        .song-card-title {
          font-family: var(--font-heading);
          font-size: 18px;
          margin-bottom: 4px;
        }
        .song-card-band {
          color: var(--lk-muted);
          font-size: 13px;
          margin-bottom: 16px;
        }
        .song-card-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .meta-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--lk-muted);
        }
        .meta-value {
          font-family: var(--font-mono);
          font-size: 14px;
        }
        .meta-value.key {
          color: var(--lk-gold);
        }
        .song-card-actions {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}