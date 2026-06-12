-- Enable RLS on songs
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Drop existing bad policies
DROP POLICY IF EXISTS "public.songs users read own" ON public.songs;
DROP POLICY IF EXISTS "public.songs users insert own" ON public.songs;
DROP POLICY IF EXISTS "public.songs users update own" ON public.songs;
DROP POLICY IF EXISTS "public.songs users delete own" ON public.songs;

-- Create proper RLS policy: users only see/edit their own songs
CREATE POLICY "users own songs" ON public.songs
  FOR ALL USING (auth.uid() = user_id);

-- Setlists table
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own setlists" ON public.setlists;
CREATE POLICY "users own setlists" ON public.setlists
  FOR ALL USING (auth.uid() = user_id);

-- Jam events table
ALTER TABLE public.jam_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own jam_events" ON public.jam_events;
CREATE POLICY "users own jam_events" ON public.jam_events
  FOR ALL USING (auth.uid() = user_id);
