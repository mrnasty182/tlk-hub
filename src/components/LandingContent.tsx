import Link from 'next/link'

export default function LandingContent() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      background: 'var(--lk-black, #08060F)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Hero */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px 48px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 'min(70vh, 600px)',
      }}>
        {/* Background steak image + gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/logo-skull.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.45,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(8,6,15,0.35) 0%, rgba(8,6,15,0.55) 60%, #08060F 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Logo */}
        <img
          src="/images/logo.jpg"
          alt="The Loin Kings logo"
          style={{
            width: 'min(180px, 40vw)',
            borderRadius: 16,
            marginBottom: 20,
            position: 'relative',
            zIndex: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        />

        <h1 style={{
          fontFamily: 'Bebas Neue, Impact, sans-serif',
          fontSize: 'clamp(40px, 8vw, 96px)',
          letterSpacing: 6,
          color: '#FF2D9B',
          lineHeight: 0.9,
          marginBottom: 12,
          position: 'relative',
          zIndex: 2,
          textShadow: '0 4px 24px rgba(0,0,0,0.7)',
        }}>
          THE LOIN KINGS
        </h1>
        <p style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 'clamp(14px, 2vw, 18px)',
          color: '#E0D8F0',
          maxWidth: 480,
          lineHeight: 1.5,
          marginBottom: 0,
          position: 'relative',
          zIndex: 2,
          textShadow: '0 2px 8px rgba(0,0,0,0.7)',
        }}>
          Write. Rehearse. Rock.
        </p>
      </section>

      {/* Quick nav cards — give every section equal billing */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        padding: '0 24px 40px',
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
      }}>
        {[
          { href: '/songs', emoji: '📋', label: 'Songs', desc: 'Chord sheets, drum grids & rehearsal mode' },
          { href: '/setlists', emoji: '🎸', label: 'Setlists', desc: 'Build and order sets for every show' },
          { href: '/calendar', emoji: '📅', label: 'Calendar', desc: 'Rehearsal schedule & gigs' },
          { href: '/composer', emoji: '✏️', label: 'Compose', desc: 'Write and arrange new songs' },
        ].map(({ href, emoji, label, desc }) => (
          <Link key={href} href={href} style={{
            background: '#0E0B18',
            border: '1px solid #1E1830',
            borderRadius: 12,
            padding: '20px 18px',
            textDecoration: 'none',
            transition: 'all 0.15s',
            display: 'block',
          }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{emoji}</div>
            <div style={{
              fontFamily: 'Bebas Neue, Impact, sans-serif',
              fontSize: 18,
              letterSpacing: 2,
              color: '#FF2D9B',
              marginBottom: 4,
            }}>{label}</div>
            <div style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 11,
              color: '#9080A8',
              lineHeight: 1.4,
            }}>{desc}</div>
          </Link>
        ))}
      </section>

      <footer style={{
        textAlign: 'center',
        padding: '20px 24px',
        borderTop: '1px solid #1E1830',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        color: '#6B6180',
        marginTop: 'auto',
      }}>
        TLK Hub — Built for the band, by the band.
      </footer>
    </div>
  )
}
