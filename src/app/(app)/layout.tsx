'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// AppLayout — AuthGate wraps everything with NavBar already.
// This layout used to render a duplicate left sidebar (DASHBOARD/SONGS/etc)
// which was clipping the songs page sidebar and confusing users.
// Now it just renders the page. NavBar is the single source of nav truth.

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return <>{children}</>;
}
