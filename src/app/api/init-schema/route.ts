import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SCHEMA_SQL = `
-- Songs table
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  key TEXT NOT NULL DEFAULT 'Am',
  bpm INTEGER NOT NULL DEFAULT 120,
  time_sig TEXT NOT NULL DEFAULT '4/4',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_lyrics TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Setlists table
CREATE TABLE IF NOT EXISTS public.setlists (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  song_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jam events table
CREATE TABLE IF NOT EXISTS public.jam_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_events ENABLE ROW LEVEL SECURITY;

-- RLS policies — users only see their own data
DROP POLICY IF EXISTS "users own songs" ON public.songs;
CREATE POLICY "users own songs" ON public.songs
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users own setlists" ON public.setlists;
CREATE POLICY "users own setlists" ON public.setlists
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users own jam_events" ON public.jam_events;
CREATE POLICY "users own jam_events" ON public.jam_events
  FOR ALL USING (auth.uid() = user_id);
`

export async function POST() {
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  // Use service role client — bypasses RLS
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })

  // Check if songs table already has data or exists
  const { data: songsCheck } = await supabaseAdmin
    .from('songs')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (songsCheck !== null) {
    return NextResponse.json({ success: true, message: 'Schema already initialized' })
  }

  // Try to run the schema via PostgREST — this will fail if we don't have
  // direct DB access. We need the Supabase CLI for this.
  // For now, return the SQL so Josh can run it in the Supabase SQL editor.
  return NextResponse.json({
    error: 'Schema not created yet',
    sql: SCHEMA_SQL,
    instructions: 'Go to your Supabase dashboard → SQL Editor → paste and run the SQL above',
    supabaseUrl,
  }, { status: 200 })
}

// GET returns the SQL so it can be copy-pasted
export async function GET() {
  return NextResponse.json({
    sql: SCHEMA_SQL,
    instructions: 'Go to your Supabase dashboard → SQL Editor → paste and run the SQL above',
  })
}
