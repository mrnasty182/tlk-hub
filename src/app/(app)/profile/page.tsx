'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { INSTRUMENT_LABELS, type InstrumentType } from '@/types/music'

const INSTRUMENTS: InstrumentType[] = ['guitar_chords', 'guitar_tab', 'bass_tab', 'drums']

const BAND_ID_KEY = 'tlk-band-id'
const INSTRUMENT_KEY = 'tlk-instrument'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [instrument, setInstrument] = useState<InstrumentType | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Try loading from band_members table
      if (user) {
        const { data: member } = await supabase
          .from('band_members')
          .select('instrument, band_id')
          .eq('user_id', user.id)
          .single()

        if (member?.instrument) {
          setInstrument(member.instrument as InstrumentType)
        } else {
          // Fall back to localStorage
          const saved = localStorage.getItem(INSTRUMENT_KEY) as InstrumentType | null
          setInstrument(saved)
        }
      } else {
        const saved = localStorage.getItem(INSTRUMENT_KEY) as InstrumentType | null
        setInstrument(saved)
      }

      setLoading(false)
    }
    init()
  }, [])

  const handleInstrumentChange = async (value: InstrumentType) => {
    setInstrument(value)
    setSaving(true)
    setSaved(false)

    // Always save to localStorage as fallback
    localStorage.setItem(INSTRUMENT_KEY, value)

    // Try saving to Supabase if logged in
    if (user) {
      const bandId = localStorage.getItem(BAND_ID_KEY)

      const { error } = await supabase
        .from('band_members')
        .upsert({
          user_id: user.id,
          band_id: bandId || null,
          instrument: value,
          role: 'member',
        }, { onConflict: 'band_id,user_id' })

      if (error) {
        console.warn('Could not save instrument to Supabase:', error.message)
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>
  }

  return (
    <div className="profile-page">
      <header className="page-header">
        <h1 className="page-title">Profile</h1>
      </header>

      <div className="profile-grid">
        {/* User Info */}
        <section className="profile-card user-info-card">
          <div className="user-avatar-large">
            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="user-details-full">
            <h2 className="user-name-large">
              {user?.user_metadata?.full_name || 'Guest'}
            </h2>
            <p className="user-email-full">{user?.email || 'Not signed in'}</p>
          </div>
        </section>

        {/* Instrument Selection */}
        <section className="profile-card instrument-card">
          <h2 className="card-title">🎸 Your Instrument</h2>
          <p className="card-desc">Sets your default view across the whole app.</p>

          <div className="instrument-options">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst}
                className={`instrument-btn ${instrument === inst ? 'selected' : ''}`}
                onClick={() => handleInstrumentChange(inst)}
              >
                <span className="instrument-label">{INSTRUMENT_LABELS[inst]}</span>
                {instrument === inst && <span className="instrument-check">✓</span>}
              </button>
            ))}
          </div>

          <div className="save-status">
            {saving && <span className="saving">Saving...</span>}
            {saved && <span className="saved">✓ Saved</span>}
          </div>
        </section>
      </div>

      <style>{`
        .profile-page {
          padding: 32px;
          min-height: 100vh;
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
          color: var(--lk-white);
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          max-width: 900px;
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
          color: var(--lk-white);
        }
        .user-email-full {
          color: var(--lk-muted);
          font-size: 14px;
        }

        /* Instrument Card */
        .instrument-card .card-title {
          font-family: var(--font-heading);
          font-size: 18px;
          letter-spacing: 1px;
          margin-bottom: 8px;
          color: var(--lk-white);
        }
        .card-desc {
          color: var(--lk-muted);
          font-size: 13px;
          margin-bottom: 24px;
        }
        .instrument-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .instrument-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--lk-deep);
          border: 1px solid var(--lk-subtle);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          color: var(--lk-white);
          font-family: var(--font-body);
          font-size: 15px;
        }
        .instrument-btn:hover {
          border-color: var(--lk-violet);
          background: rgba(123, 47, 190, 0.1);
        }
        .instrument-btn.selected {
          border-color: var(--lk-pink);
          background: rgba(255, 45, 155, 0.1);
          box-shadow: 0 0 0 1px var(--lk-pink);
        }
        .instrument-check {
          color: var(--lk-pink);
          font-size: 18px;
        }
        .save-status {
          margin-top: 16px;
          min-height: 20px;
          font-size: 13px;
        }
        .saving {
          color: var(--lk-muted);
        }
        .saved {
          color: var(--lk-teal);
        }

        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
