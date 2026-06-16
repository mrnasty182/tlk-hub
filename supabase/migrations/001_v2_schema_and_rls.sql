-- TLK Hub v2.0 Migration: Schema + RLS
-- Run this in Supabase SQL Editor
-- Project: yitpnjhpearuhngshbxu

-- ═══════════════════════════════════════════════════════════════
-- PART 1: ADD COLUMNS TO SONGS TABLE
-- ═══════════════════════════════════════════════════════════════

-- Add sections JSONB column (array of updated section objects)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb;

-- Add time_sig if not present (some schemas already have it)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS time_sig text DEFAULT '4/4';

-- Add bpm if not present (some schemas have tempo instead)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS bpm integer;

-- Migrate tempo -> bpm if tempo exists and bpm is null
UPDATE songs SET bpm = tempo WHERE bpm IS NULL AND tempo IS NOT NULL;

-- Add visibility for sharing
ALTER TABLE songs ADD COLUMN IF NOT EXISTS visibility text 
  CHECK (visibility IN ('private', 'band', 'public')) DEFAULT 'private';

-- Add band_id for future band association
ALTER TABLE songs ADD COLUMN IF NOT EXISTS band_id uuid;

-- Rename user_id if schema uses owner_id (check first)
-- Skip if user_id already exists

-- ═══════════════════════════════════════════════════════════════
-- PART 2: BANDS + BAND_MEMBERS TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text,
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

-- Enable RLS on band tables
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;

-- Members can see their band
CREATE POLICY "members see own band" ON band_members
  FOR SELECT USING (auth.uid() = user_id);

-- Members can insert themselves
CREATE POLICY "members insert self" ON band_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Members can update own instrument
CREATE POLICY "members update self" ON band_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Bands visible to members
CREATE POLICY "bands visible to members" ON bands
  FOR SELECT USING (
    id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- PART 3: SONG_HISTORY TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS song_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id     uuid REFERENCES songs ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  snapshot    jsonb,
  saved_at    timestamptz DEFAULT now()
);

ALTER TABLE song_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own history" ON song_history
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- PART 4: SETLISTS TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS setlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  name        text NOT NULL,
  notes       text,
  locked      boolean DEFAULT false,
  songs       jsonb DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own setlists" ON setlists
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- PART 5: RLS ON SONGS TABLE
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe re-run)
DROP POLICY IF EXISTS "own songs" ON songs;
DROP POLICY IF EXISTS "band songs" ON songs;

-- Users can do everything with their own songs
CREATE POLICY "own songs" ON songs
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Users can SELECT band/public songs if they're in the band
CREATE POLICY "band songs" ON songs
  FOR SELECT USING (
    visibility IN ('band', 'public')
    AND band_id IN (
      SELECT band_id FROM band_members WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- PART 6: ADD USER_ID COLUMN IF MISSING
-- ═══════════════════════════════════════════════════════════════

-- If songs table has owner_id instead of user_id, add user_id
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'user_id') THEN
    ALTER TABLE songs ADD COLUMN user_id uuid REFERENCES auth.users ON DELETE CASCADE;
    -- Migrate owner_id -> user_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'owner_id') THEN
      UPDATE songs SET user_id = owner_id WHERE user_id IS NULL;
    END IF;
  END IF;
END $$;

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

-- ═══════════════════════════════════════════════════════════════
-- PART 8: SEED THE LOIN KINGS BAND
-- ═══════════════════════════════════════════════════════════════

INSERT INTO bands (name) VALUES ('The Loin Kings')
ON CONFLICT DO NOTHING;

-- Done. Verify with:
-- SELECT * FROM bands;
-- SELECT * FROM band_members;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'songs' ORDER BY ordinal_position;
