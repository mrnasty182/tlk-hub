import Link from 'next/link'

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

export default function LandingContent() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--lk-black, #08060F)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background steak image + gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/images/hero-steak.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.55, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,6,15,0.15) 0%, rgba(8,6,15,0.4) 60%, #08060F 100%)', pointerEvents: 'none' }} />
        {/* Logo */}
        <img
          src="/images/logo.jpg"
          alt="The Loin Kings logo"
          style={{ maxWidth: 180, borderRadius: 16, marginBottom: 24, position: 'relative', zIndex: 1 }}
        />
        <div style={{ marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, border: '1px solid #7B2FBE', color: '#7B2FBE', fontFamily: 'Oswald, sans-serif', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>The Loin Kings</span>
        </div>
        <h1 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(56px, 10vw, 120px)', letterSpacing: 6, color: '#FF2D9B', lineHeight: 0.9, marginBottom: 24, position: 'relative', zIndex: 1 }}>
          THE LOIN KINGS
        </h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 16, color: '#C0B8D0', maxWidth: 440, lineHeight: 1.6, marginBottom: 48, position: 'relative', zIndex: 1 }}>
          Write. Rehearse. Rock.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/songs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, background: '#FF2D9B', color: '#08060F', fontFamily: 'Oswald, sans-serif', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}>
            Open Songs →
          </Link>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, border: '1.5px solid #1E1830', color: '#6B6180', fontFamily: 'Oswald, sans-serif', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}>
            Dashboard
          </Link>
        </div>
      </section>

      {/* Quick nav cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, padding: '0 32px 48px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {[
          { href: '/songs', emoji: '📋', label: 'Songs', desc: 'Chord sheets, drum grids & rehearsal mode' },
          { href: '/setlists', emoji: '🎸', label: 'Setlists', desc: 'Build and order sets for every show' },
          { href: '/calendar', emoji: '📅', label: 'Calendar', desc: 'Rehearsal schedule & gigs' },
          { href: '/composer', emoji: '✏️', label: 'Compose', desc: 'Write and arrange new songs' },
        ].map(({ href, emoji, label, desc }) => (
          <Link key={href} href={href} style={{ background: '#0E0B18', border: '1px solid #1E1830', borderRadius: 16, padding: '24px 20px', textDecoration: 'none', transition: 'border-color 0.15s', display: 'block' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{emoji}</div>
            <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 18, letterSpacing: 2, color: '#FF2D9B', marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#6B6180', lineHeight: 1.5 }}>{desc}</div>
          </Link>
        ))}
      </section>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid #1E1830', fontFamily: 'system-ui, sans-serif', fontSize: 11, color: '#6B6180' }}>
        TLK Hub — Built for the band, by the band.
      </footer>
    </div>
  )
}