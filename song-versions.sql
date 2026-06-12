-- Song Versions table for TLK Hub
-- Run this in Supabase SQL Editor

CREATE TABLE song_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  song_key TEXT,
  bpm INTEGER,
  time_sig TEXT,
  raw_lyrics TEXT,
  sections JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE song_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own song_versions" ON song_versions FOR ALL USING (auth.uid() = user_id);