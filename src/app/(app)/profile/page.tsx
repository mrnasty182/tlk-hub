'use client'

import { useAuth } from '@/components/AuthProvider'

const BRAND = {
  hotPink: '#FF2D9B',
  electricTeal: '#00E5CC',
  deepViolet: '#7B2FBE',
  glamGold: '#F0C040',
  midnight: '#08060F',
  muted: '#6B6180',
  surface: '#130E20',
  card: '#0E0B18',
  border: '#1E1830',
}

const BAND_MEMBERS = [
  { name: 'Josh', role: 'Guitar / Vox', color: BRAND.hotPink },
  { name: 'Bill', role: 'Bass', color: BRAND.electricTeal },
  { name: 'Estabon', role: 'Drums', color: BRAND.deepViolet },
  { name: 'Joe', role: 'Guitar', color: BRAND.glamGold },
]

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div style={{ minHeight: '100vh', background: BRAND.midnight, padding: '48px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Band header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 20,
              border: `1px solid ${BRAND.deepViolet}`,
              color: BRAND.deepViolet,
              fontFamily: 'Oswald, sans-serif',
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>The Loin Kings</span>
          </div>
          <h1 style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 'clamp(48px, 8vw, 96px)',
            letterSpacing: 6,
            color: BRAND.hotPink,
            lineHeight: 0.9,
            margin: '0 0 16px',
          }}>THE LOIN KINGS</h1>
          <p style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 16,
            color: BRAND.muted,
            maxWidth: 480,
            lineHeight: 1.6,
            margin: '0 auto',
          }}>Write. Rehearse. Rock. Atlanta's hardest-working rock band.</p>
        </div>

        {/* Account info */}
        <div style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 16,
          padding: 28,
          marginBottom: 40,
        }}>
          <div style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: BRAND.muted,
            marginBottom: 16,
          }}>Account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.muted }}>Email</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#fff' }}>
                {user?.email ?? 'Not signed in'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.muted }}>User ID</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted }}>
                {user?.id ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Band members */}
        <div style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 16,
          padding: 28,
          marginBottom: 40,
        }}>
          <div style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: BRAND.muted,
            marginBottom: 20,
          }}>Band Members</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {BAND_MEMBERS.map(member => (
              <div key={member.name} style={{
                background: BRAND.surface,
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
                border: `1px solid ${BRAND.border}`,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: `${member.color}22`,
                  border: `2px solid ${member.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 20,
                  color: member.color,
                }}>
                  {member.name[0]}
                </div>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, color: '#fff', marginBottom: 4 }}>
                  {member.name}
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: member.color }}>
                  {member.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 16,
          padding: 28,
        }}>
          <div style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: BRAND.muted,
            marginBottom: 20,
          }}>Band Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { label: 'Songs', value: '9', accent: BRAND.hotPink },
              { label: 'Setlists', value: '3', accent: BRAND.electricTeal },
              { label: 'Gigs Played', value: '12', accent: BRAND.glamGold },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 48, color: stat.accent, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted, letterSpacing: 1, marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
