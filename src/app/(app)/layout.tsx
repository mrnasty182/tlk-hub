'use client';

import AuthGate from '@/components/AuthGate';

// AuthGate renders NavBar at the top + children below, gated on auth.
// If user is not logged in, AuthGate shows the auth modal instead.
// This used to render a duplicate left sidebar — killed that, NavBar is single source of truth.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
