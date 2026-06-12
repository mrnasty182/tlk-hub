import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client for build-time SSG — real env vars injected at runtime
    return createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Export a singleton so the client is only created once per server instance
let _supabase: ReturnType<typeof getSupabaseClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = getSupabaseClient()
  }
  return _supabase
}

export const supabase = getSupabase()