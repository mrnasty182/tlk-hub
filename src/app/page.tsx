import AuthGate from '@/components/AuthGate'
import LandingContent from '@/components/LandingContent'

export default function HomePage() {
  return (
    <AuthGate>
      <LandingContent />
    </AuthGate>
  )
}