-- Add version_name column for song versions (acoustic, electric, alternate key, etc.)
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS version_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS parent_song_id uuid REFERENCES songs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transpose_delta integer DEFAULT 0;

-- Index for finding versions of a song
CREATE INDEX IF NOT EXISTS idx_songs_parent ON songs(parent_song_id) WHERE parent_song_id IS NOT NULL;

-- Update RLS: versions inherit parent's band/visibility access
DROP POLICY IF EXISTS "users_own_songs" ON songs;
CREATE POLICY "users_own_songs" ON songs
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_see_band_songs" ON songs;
CREATE POLICY "users_see_band_songs" ON songs
  FOR SELECT USING (
    visibility IN ('band', 'public')
    AND band_id IN (
      SELECT band_id FROM band_members WHERE user_id = auth.uid()
    )
  );

-- Allow seeing versions of songs you can already see
DROP POLICY IF EXISTS "users_see_version_siblings" ON songs;
CREATE POLICY "users_see_version_siblings" ON songs
  FOR SELECT USING (
    parent_song_id IN (
      SELECT id FROM songs
      WHERE user_id = auth.uid()
         OR (visibility IN ('band', 'public') AND band_id IN (
           SELECT band_id FROM band_members WHERE user_id = auth.uid()
         ))
    )
  );
