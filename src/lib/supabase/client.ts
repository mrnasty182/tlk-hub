import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client for build-time static generation
    // This will be replaced by the real client on the client side
    if (typeof window === 'undefined') {
      return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    throw new Error(
      `Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL=${url}, NEXT_PUBLIC_SUPABASE_ANON_KEY=${key ? '[SET]' : '[MISSING]'}`
    );
  }

  supabaseClient = createBrowserClient(url, key);
  return supabaseClient;
}
