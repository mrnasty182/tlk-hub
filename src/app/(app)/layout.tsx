'use client';

import AuthGate from '@/components/AuthGate';
import BottomNav from '@/components/BottomNav';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

// AuthGate renders NavBar at the top + children below, gated on auth.
// If user is not logged in, AuthGate shows the auth modal instead.
// BottomNav renders on mobile only (CSS hides it on desktop) for thumb-friendly nav.
// ServiceWorkerRegister installs the offline service worker once on mount.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      {children}
      <BottomNav />
      <ServiceWorkerRegister />
    </AuthGate>
  );
}
