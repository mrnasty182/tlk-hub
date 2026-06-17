-- TLK Hub v2.0 Migration: Align schema + RLS to Claude Master Handoff v2.0
-- Run via: supabase db query --linked -f 001_v2_schema_and_rls.sql
-- Project: yitpnjhpearuhngshbxu
-- IDEMPOTENT — safe to re-run

-- ═══════════════════════════════════════════════════════════════
-- PART 1: ALIGN songs TABLE TO v2.0 SPEC
-- ═══════════════════════════════════════════════════════════════

-- Add visibility (private | band | public)
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS visibility text
  CHECK (visibility IN ('private', 'band', 'public')) DEFAULT 'private';

-- Add band_id (nullable, future use per v2.0 spec)
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS band_id uuid;

-- ═══════════════════════════════════════════════════════════════
-- PART 2: bands + band_members TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS band_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id     uuid REFERENCES bands ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  instrument  text CHECK (instrument IN ('guitar_chords', 'guitar_tab', 'bass_tab', 'drums')),
  role        text DEFAULT 'member',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(band_id, user_id)
);

ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;

-- band_members policies
DROP POLICY IF EXISTS "members see own band" ON band_members;
DROP POLICY IF EXISTS "members insert self" ON band_members;
DROP POLICY IF EXISTS "members update self" ON band_members;
DROP POLICY IF EXISTS "Users can manage own band_members" ON band_members;

CREATE POLICY "members see own band" ON band_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "members insert self" ON band_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "members update self" ON band_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "admins manage band" ON band_members
  FOR ALL USING (
    band_id IN (
      SELECT band_id FROM band_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- bands policies
DROP POLICY IF EXISTS "bands visible to members" ON bands;
DROP POLICY IF EXISTS "Users can manage own bands" ON bands;

CREATE POLICY "bands visible to members" ON bands
  FOR SELECT USING (
    id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- PART 3: song_history TABLE (versioning per v2.0 spec)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS song_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id     uuid REFERENCES songs ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  snapshot    jsonb,
  saved_at    timestamptz DEFAULT now()
);

ALTER TABLE song_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own history" ON song_history;
CREATE POLICY "own history" ON song_history
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- PART 4: SECTIONS TABLE (already exists — align columns)
-- ═══════════════════════════════════════════════════════════════

-- Add columns the live table may be missing per v2.0 spec
ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS order_index integer,
  ADD COLUMN IF NOT EXISTS guitar_tab text,
  ADD COLUMN IF NOT EXISTS bass_tab text,
  ADD COLUMN IF NOT EXISTS drum_grid jsonb,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Make sure RLS is on
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- PART 5: SONGS RLS — kill "Allow all", enforce user isolation
-- ═══════════════════════════════════════════════════════════════

-- Drop the dangerous permissive policies
DROP POLICY IF EXISTS "Allow all" ON songs;
DROP POLICY IF EXISTS "own songs" ON songs;
DROP POLICY IF EXISTS "band songs" ON songs;
DROP POLICY IF EXISTS "Users can manage own songs" ON songs;

-- Users see and edit only their own songs
CREATE POLICY "users_own_songs" ON songs
  FOR ALL USING (auth.uid() = user_id);

-- Users can see band/public songs if they are a member of that band
CREATE POLICY "users_see_band_songs" ON songs
  FOR SELECT USING (
    visibility IN ('band', 'public')
    AND band_id IN (
      SELECT band_id FROM band_members WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- PART 6: SETLISTS RLS — kill "Allow all", enforce user isolation
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow all" ON setlists;
DROP POLICY IF EXISTS "Users can manage own setlists" ON setlists;
DROP POLICY IF EXISTS "Users see own setlists" ON setlists;
DROP POLICY IF EXISTS "own setlists" ON setlists;

CREATE POLICY "users_own_setlists" ON setlists
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- PART 7: AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS songs_updated_at ON songs;
CREATE TRIGGER songs_updated_at BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS setlists_updated_at ON setlists;
CREATE TRIGGER setlists_updated_at BEFORE UPDATE ON setlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sections_updated_at ON sections;
CREATE TRIGGER sections_updated_at BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- PART 8: SEED THE LOIN KINGS BAND
-- ═══════════════════════════════════════════════════════════════

INSERT INTO bands (name) VALUES ('The Loin Kings')
ON CONFLICT DO NOTHING;
