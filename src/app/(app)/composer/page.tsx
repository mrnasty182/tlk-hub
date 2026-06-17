import { Suspense } from 'react'
import NewComposer from '@/components/NewComposer'

export default function ComposerPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#08060F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 28,
        letterSpacing: 4,
        color: '#FF2D9B',
      }}>
        LOADING COMPOSER...
      </div>
    }>
      <NewComposer />
    </Suspense>
  )
}
