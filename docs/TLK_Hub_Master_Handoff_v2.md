# TLK HUB — MASTER BUILD HANDOFF v2.0
**For: Heremes**
**From: Josh Mitchell / The Loin Kings**
**Date: June 2026**
**Supersedes:** v1.0

---

> This is the complete spec. Read it top to bottom before touching code. Everything is here — editor, performance view, instrument views, drum grid, tab system, scales, audio, schema, and priority order. No back and forth needed.

---

# QUICK CONTEXT

**What TLK Hub is:** A band management and rehearsal tool for The Loin Kings — a 4-piece rock band. Not a DAW. Not a notation app. Not a tab editor in the Guitar Pro sense. It's a **collaborative song reference tool** — the digital version of the chord chart + lyric sheet the band would pass around at rehearsal, extended to support each member's instrument view.

**The core use case:**
1. Josh writes a new song — chords + lyrics
2. Band pulls it up on their own devices at rehearsal
3. First run through — everyone follows along on their instrument view
4. Between rehearsals — each member goes in and edits/adds their own parts
5. At the gig — performance view auto-scrolls at BPM, everyone reads their part

**The four members and their instrument views:**

| Member | Instrument | Default View |
|---|---|---|
| Josh (J Stead) | Guitar, Lead Vocals | Chords + Lead Tab |
| Brad (B Rad) | Lead Guitar | Guitar Tab |
| Scotty Bush | Bass | Bass Tab |
| K Long | Drums | Drum Grid |

---

# PART ONE: SCHEMA FIRST
*The current schema needs to evolve before Phase 2 code gets written or it'll need to be torn apart*

---

## Current Schema (Baltar's brief)

```json
Section object (current):
{
  "id": "uuid",
  "name": "Verse 1",
  "content": "chord/lyric lines here"
}
```

This is a single string blob. It can't support per-instrument parts. **Change this now.**

## Updated Section Object

```json
{
  "id": "uuid",
  "type": "verse",
  "name": "Verse 1",
  "order_index": 0,
  "chords": "Am . . . | G . . . | C . . . | D . . .",
  "lyrics": "You came around when I was low\nPicked me up and let me know",
  "guitar_tab": "",
  "bass_tab": "",
  "drum_grid": {
    "bars": 2,
    "subdivisions": 16,
    "rows": {
      "kick":      [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      "snare":     [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      "hihat":     [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      "hitom1":    [],
      "hitom2":    [],
      "floortom":  [],
      "crash":     [],
      "splash":    [],
      "ride":      []
    }
  },
  "notes": "",
  "audio_url": ""
}
```

## Updated Songs Table

```sql
songs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users ON DELETE CASCADE,
  band_id         uuid REFERENCES bands,         -- nullable, future use
  title           text NOT NULL,
  key             text,
  bpm             integer,
  time_sig        text DEFAULT '4/4',
  visibility      text CHECK (visibility IN ('private', 'band', 'public')) DEFAULT 'private',
  raw_lyrics      text,                           -- Write mode freeform scratch
  sections        jsonb DEFAULT '[]'::jsonb,      -- Array of updated section objects
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)

bands (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,
  created_at      timestamptz DEFAULT now()
)

band_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id         uuid REFERENCES bands ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users ON DELETE CASCADE,
  instrument      text CHECK (instrument IN ('guitar_chords', 'guitar_tab', 'bass_tab', 'drums')),
  role            text,                           -- 'admin', 'member'
  created_at      timestamptz DEFAULT now()
)
```

## Profile Page — Add Instrument Field

The `/app/profile` route exists. Add a single `instrument` field wired to `band_members.instrument`. This sets each member's default view across the entire app. One dropdown, one save.

Options: Guitar (Chords/Lead Tab) | Guitar (Tab) | Bass (Tab) | Drums (Grid)

## RLS — Fix This Now

Currently everyone sees all songs. This is a security hole. Fix before any other member gets access.

```sql
-- Enable RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Users see their own songs
CREATE POLICY "own songs" ON songs
  FOR ALL USING (auth.uid() = user_id);

-- Users see band songs if they're in the band
CREATE POLICY "band songs" ON songs
  FOR SELECT USING (
    visibility IN ('band', 'public')
    AND band_id IN (
      SELECT band_id FROM band_members WHERE user_id = auth.uid()
    )
  );
```

---

# PART TWO: SONG EDITOR SPEC
*Complete feature spec — all questions answered*

---

## Layout

Single unified view. Everything on screen at once.

- **Top bar** — Song title, Key, BPM, view mode toggles (Write / Arrange / History / Record)
- **Left sidebar** — Song library list + "+ New" button (persists inside editor)
- **Main area** — Full song as scrollable accordion of sections
- **No separate composer panel** — editing is inline

## Section Navigation — Accordion

- All sections stacked vertically, all visible simultaneously
- Click header to expand/collapse
- Multiple sections can be open at once
- Natural scroll — no tab switching

## Section Fields

| Field | Notes |
|---|---|
| Type | Preset: Intro, Verse, Pre-Chorus, Chorus, Hook, Post-Chorus, Bridge, Breakdown, Musical Break, Instrumental, Tag, Solo, Outro |
| Name | Optional free-text rename ("Verse 2", "Josh's Hook") |
| Chords | Text input — chord per beat notation |
| Lyrics | Multi-line, one line per row |
| Guitar Tab | 6-string tab notation (see Part Three) |
| Bass Tab | 4-string tab notation (see Part Three) |
| Drum Grid | Visual hit grid (see Part Four) |
| Notes | Personal annotations, production ideas |
| Audio Clip | Voice memo attachment — audio only, no notation (see Part Five) |

## Adding a Section

1. New section inserts after currently active section
2. Arrives expanded and ready to edit — no modal
3. Pick type, optionally rename, start typing
4. If no section active, appends to bottom

## Freeform Writing Philosophy ← MOST IMPORTANT

> Type first. Structure later.

Write mode = one big freeform text field. Slam lyrics down, drop section headers inline as plain text whenever. No required fields. No friction. Think SongWriter Pro (defunct).

"Convert to Sections" button parses headers and builds the accordion automatically.

## Reordering

Drag and drop. Handle icon (⠿) on each section header.

## Save Behavior

- Auto-save as user types (debounced, ~2–3 seconds after stopping)
- Manual save button in top bar
- Saves whole song — not section by section
- "Saved ✓" / "Saving..." indicator — unobtrusive

## View Modes

**WRITE** — Freeform scratchpad. One text field. No structure required.

**ARRANGE** — Accordion editor. All sections, all fields, all instrument views. Full editing.

**PERFORMANCE** — See Part Six.

---

# PART THREE: INSTRUMENT VIEWS
*Per-member views — everyone sees lyrics, everyone sees their music*

---

## The Core Principle

**Everyone always sees lyrics.** The music view defaults to their instrument. They can toggle to see other parts if needed (e.g. Josh wants to see what Brad is playing in a section).

Every instrument view auto-scrolls in sync during performance mode. Same song, same position, different music layer.

---

## View 1 — Josh: Chords + Lead Tab

**Default for:** Josh (guitar, lead vocals)

**What renders:**

Section header in hot pink. Then chord-above-lyric layout:

```
G              Em             C              D
You came a  -  round when I   was low,  picked  me up
```

Each chord-lyric unit = `inline-flex, flex-direction: column`:
- Top: chord name — Oswald 700, 14px, electric teal #00E5CC
- Bottom: lyric word — Inter 400, 20px min, white #F0EAF8

For lead guitar hooks/melodies that aren't chord-based, Josh enters a tab block below the chord/lyric lines for that section. Same 6-string tab format as Brad's view (see below) but only for specific riff/melody moments — not whole sections.

---

## View 2 — Brad: Guitar Tab

**Default for:** Brad (lead guitar)

**What renders:**

Lyrics displayed above the tab block. Then 6-string standard tab notation:

```
e |--12--10--8--|--12--10--8--|
B |-------------|-------------|
G |-------------|-------------|
D |-------------|-------------|
A |-------------|-------------|
E |-------------|-------------|
```

**Tab editor implementation:**

- 6 rows, monospace font (Space Mono), string labels left (e B G D A E, high to low top to bottom)
- Each row = text input, free-type fret numbers and dashes
- Pipe characters ( | ) as bar dividers — auto-inserted or manually typed
- No playback. No sound. Pure visual reference.
- Tab block is per-section. Each section has its own tab field.

**Entry method:**
- Manual text entry is the primary method
- Riff Analyzer (see Part Five) can attempt to translate a played riff to tab notation
- **Important:** Riff Analyzer accuracy is best-effort only. It works for clean single-note runs. It will struggle with distortion, bends, harmonics, and dirty tones. Ship it, don't oversell it. Brad will likely enter solos manually most of the time.

---

## View 3 — Scotty: Bass Tab

**Default for:** Scotty Bush (bass)

**What renders:**

Lyrics above the tab block. Then 4-string bass tab:

```
G |-------------|-------------|
D |-------------|-------------|
A |--0--3--5----|--0--3--5----|
E |-------------|-------------|
```

- 4 rows (G D A E, high to low)
- Same monospace text entry as guitar tab
- Scotty is described as "a basic bitch" — keep the UI simple and obvious
- No complexity, no theory, just: strings, frets, bars

---

## View 4 — K Long: Drum Grid

**Default for:** K Long (drums)

**What renders:**

Lyrics displayed above the grid. Then the drum grid.

### Drum Grid Specification

**Concept:** Digital version of K Long's graph paper. He draws patterns — the app is the same thing but on screen. No sound. No playback. Pure visual hit reference while auto-scrolling.

**K Long's kit:**
- Kick
- Snare
- Hi-Hat
- Hi-Tom 1
- Hi-Tom 2
- Floor Tom
- Crash
- Splash
- Ride

**Grid layout:**

```
         1  e  +  a  2  e  +  a  3  e  +  a  4  e  +  a
KICK    [■][ ][ ][ ][■][ ][ ][ ][■][ ][ ][ ][■][ ][ ][ ]
SNARE   [ ][ ][ ][ ][■][ ][ ][ ][ ][ ][ ][ ][■][ ][ ][ ]
HI-HAT  [■][ ][■][ ][■][ ][■][ ][■][ ][■][ ][■][ ][■][ ]
HI-TOM1 [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
HI-TOM2 [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
FLR TOM [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
CRASH   [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
SPLASH  [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
RIDE    [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
```

**Grid rules:**
- One bar per row — reads left to right like a sentence (American reader)
- Default subdivision: 16th notes (16 columns per bar = 1 e + a per beat)
- Option to switch to 8th notes (8 columns) for simpler patterns
- Click a cell = toggle hit on/off
- Filled cell (■) = hit. Empty cell = silence.
- Each section stores its own grid pattern
- Grid repeats visually if the section is more than one bar (show bar number on left)
- NO SOUND. NO PLAYBACK. Visual reference only.

**Visual design:**
- Background: #100018 (Void)
- Grid lines: white at 10% opacity
- Beat markers (1, 2, 3, 4): slightly brighter column dividers
- Active cell (hit): hot pink #FF2D9B fill
- Empty cell: transparent, grid outline only
- Drum row labels: Space Mono, 11px, muted #6644AA, left column
- Beat labels (1 e + a): Space Mono, 10px, muted, top row
- Selected/active row: subtle teal left border

**Reference aesthetic:** Auxy-style grid layout — K Long already knows this visual language. Clean, minimal, tap to activate. The difference is no sound.

---

## Toggling Between Views

In both Arrange and Performance modes, a view toggle sits in the top bar:

```
[CHORDS] [GUITAR TAB] [BASS TAB] [DRUMS]
```

- Default = member's instrument (set in profile)
- Can select multiple views simultaneously (e.g. Josh wants to see chords AND bass tab)
- Selected views stack vertically within each section
- Lyrics always visible regardless of view selection

---

# PART FOUR: PERFORMANCE VIEW
*The OnSong killer — stage-ready, auto-scrolling, each member sees their part*

---

## Entry

"Performance View" button in top bar. Full-screen takeover. Sidebar hides. Top bar minimizes to thin strip: Song Title + BPM + Exit only.

## Song Header

```
[SONG TITLE — Bebas Neue, 36px, white]
[KEY] [BPM] [TIME SIG]  ← Space Mono, teal pills
```

## Section Header

```
▸ VERSE 1                              8 bars ◆ 0:00
```

- Oswald 700, 13px, letter-spacing 3px, hot pink #FF2D9B
- Left border: 3px solid hot pink
- Bar count + timestamp: Space Mono, 11px, muted #6644AA

## Chord + Lyric Rendering (Josh's view)

Chords sit directly ABOVE the syllable they fall on:

```
G              Em             C              D
You came a  -  round when I   was low,  picked  me up
```

Each word unit = `inline-flex, flex-direction: column`:
- Chord: Oswald 700, 14px, electric teal
- Lyric: Inter 400, 20px minimum, white

## Auto-Scroll

- Speed calculated from BPM and line count
- **Linear velocity only — no easing, no bounce** (teleprompter behavior)
- Tap anywhere = pause/resume
- Floating BPM display stays visible
- Speed adjust ±10% without stopping

## Setlist Mode

When running a setlist ("Start Show"):
- Songs advance automatically at end of last section
- 4-beat visual count-in flash between songs (no audio — visual only)
- BPM-driven scroll continues across transitions
- Full screen, no chrome

## Visual Tokens

| Element | Value |
|---|---|
| Background | #08060F |
| Surface | #100018 |
| Divider | #1A0030 |
| Lyrics | #F0EAF8, Inter 400, 20px min |
| Chords | #00E5CC, Oswald 700, 14px |
| Section headers | #FF2D9B, Oswald 700, 13px |
| Metadata | #6644AA, Space Mono, 11px |
| Song title | Bebas Neue, 36px, white |

## Tablet Specifics

Tablet (iPad) = primary rehearsal device. Most critical breakpoint.
- Lyric font: 20px minimum
- Tap left half = scroll up, tap right half = scroll down
- Full screen — no browser chrome
- High contrast mode: 24px lyrics, line-height 2.2

---

# PART FIVE: AUDIO — VOICE RECORDINGS
*Everything audio in TLK Hub is reference-only. Nothing plays notation.*

---

## What Audio Is and Isn't

**IS:** Voice memo-style recordings attached to a section. Used to capture vibe, strumming intensity, chord voicings feel, a hook melody — things you can't write down fast enough.

**IS NOT:** Playback of notation. The chords, tab, and drum grid are all silent. There is no audio engine for musical playback anywhere in the app.

## Record Function (Transport Bar)

Triggered by the Record button in the top bar:

1. **Count-in:** Full bar of metronome click at song BPM — audio click + visual flash (4 beats)
2. **Recording starts:** Click track stops. Mic opens. Recording begins immediately.
3. **Stop** ends recording
4. Recording saves as audio clip attached to the active section (or new "Scratch" section if none active)

## Audio Clip Storage

- Store as audio file in Supabase Storage
- Reference via `audio_url` field in section object
- Playback inline within the section — simple play/pause, no waveform editor needed
- One clip per section (can be replaced)

## Calendar Integration

- Jam recordings from Record function attach to the calendar day they were captured
- Clicking a calendar day with recordings shows: audio clip + which song/section it's from
- Color: teal dot on calendar day = has a recording

## Riff Analyzer

Real-time pitch detection from mic. Best-effort tab translation.

- Works well: clean single-note runs, slow melodic lines
- Works poorly: distortion, bends, harmonics, heavy tone, fast shredding
- Ship it as a tool, not a feature. Don't promise accuracy. The disclaimer already in the UI ("Reference use only — always trust your ear first") is correct. Keep it.

---

# PART SIX: SCALES SECTION
*Accuracy first. Visual upgrade second. In that order.*

---

## ⚠️ ACCURACY AUDIT — DO THIS BEFORE ANY VISUAL WORK

### The B String Problem

Standard tuning (EADGBE) is tuned in fourths — **except** between string 3 (G) and string 2 (B). That interval is a major third (4 semitones), not a fourth (5 semitones).

**Any algorithm that treats all strings as fourths apart will produce wrong note positions on and around the B string.** This is the single most common bug in guitar scale apps. Audit every diagram for this.

### Verification Process

For every scale, every key, every position — cross-reference against **muted.io/guitar-scales** before shipping. It is visually verified and trusted in the guitar community. If your output doesn't match muted.io, your algorithm is wrong.

Secondary references: onlineguitarbooks.com, Guitar Pro 8.

### Standard Tuning Reference

```
String 6 (low E)  — thickest, bottom of diagram
String 5 (A)
String 4 (D)
String 3 (G)
String 2 (B)      ← major third from G, not a fourth
String 1 (high e) — thinnest, top of diagram
```

### CAGED Position System

5 positions per scale, derived from 5 open chord shapes (C, A, G, E, D). For Am pentatonic:

| Position | CAGED Shape | Fret range |
|---|---|---|
| 1 | E shape | 5th–8th fret |
| 2 | D shape | 7th–10th fret |
| 3 | C shape | 9th–12th fret |
| 4 | A shape | 12th–15th fret |
| 5 | G shape | 14th–17th fret |

Positions overlap by 1–2 frets at edges. If there are gaps or overlaps don't tile seamlessly across the neck, the algorithm is wrong.

### Common Errors to Check

1. B string offset ignored (most common)
2. Position boundaries gapped or wrong
3. Root note placement wrong (Am Position 1: root A on fret 5 of strings 6 and 1)
4. Fret numbering starting from 0 instead of 1
5. String order inverted (string 6 low E must be at bottom of vertical diagram)

### Scale Types Required

| Scale | Formula |
|---|---|
| Minor Pentatonic | 1 b3 4 5 b7 |
| Major Pentatonic | 1 2 3 5 6 |
| Blues Scale | 1 b3 4 b5 5 b7 |
| Natural Minor | 1 2 b3 4 5 b6 b7 |
| Major Scale | 1 2 3 4 5 6 7 |
| Dorian Mode | 1 2 b3 4 5 6 b7 |
| Mixolydian Mode | 1 2 3 4 5 6 b7 |
| Harmonic Minor | 1 2 b3 4 5 b6 7 |

All 5 CAGED positions for all 12 keys for every scale type. Verified against muted.io.

---

## Visual Upgrade

### Fretboard Diagrams

| Element | Target |
|---|---|
| Root notes | Gold #F0C040 filled circle, "R" in black |
| Scale notes | Teal #00E5CC filled circle, note name in black |
| Muted strings | X in hot pink #FF2D9B |
| Open strings | Open circle in teal |
| Fret lines | White at 15% opacity |
| String lines | White at 25% opacity |
| Nut | Thick white line at 60% opacity |
| Fret numbers | Space Mono, 11px, muted, below diagram |
| String labels | Space Mono, 10px, muted, left of diagram |
| Background | #100018 card on #08060F page |
| Selected position | Gold #F0C040 border, 2px, subtle glow |
| Unselected positions | #2A0040 border |

### Circle of Fifths

- Outer ring (major keys): hot pink #FF2D9B segments
- Inner ring (relative minors): deep violet #7B2FBE segments
- Selected key: gold #F0C040 highlight
- Key labels: Bebas Neue
- Center: #08060F with LK mark
- Interactive: clicking a key updates all scale/chord displays

### Chord Charts

- Key letter: Bebas Neue, large, hot pink
- Roman numerals: Space Mono, small, muted
- Chord name: Oswald 700, white
- Border color by quality: major = teal, minor = violet, diminished = pink
- Selected chord: gold glow

---

# PART SEVEN: TECHNICAL NOTES FROM BALTAR'S BRIEF

---

## What's Done (Phase 1)
- App shell, auth, routing
- Song CRUD with section support (schema needs updating per Part One)
- Setlist CRUD
- Supabase backend
- Dashboard, landing, profile pages
- Dark glam theme
- Basic mobile responsiveness

## What's Broken / Known Issues
1. **Song editor is tab-based, not document-based** — Phase 2 fix
2. **No RLS on songs table** — fix immediately (CLI access and management key provided)
3. **Git history contamination** — node_modules in fix/phase1 branch ancestry (Heremes to resolve)
4. **Composer panel disconnected** — Phase 2 fix
5. **Auth bypass in dev** — no real user isolation yet

## Priority Order

1. **RLS fix** — before any other member gets access
2. **Schema update** — section object per Part One before Phase 2 code
3. **Song editor overhaul** — document model, accordion, all sections visible
4. **Instrument views** — per-member tab/grid/chord views
5. **Scales accuracy audit** — B string fix, verify all positions
6. **Performance view** — chord-above-lyric, auto-scroll
7. **Record function** — count-in + mic capture + section attachment
8. **Drum grid** — visual only, no sound
9. **Tab editors** — guitar (6-string) and bass (4-string)
10. **Scales visual upgrade** — after accuracy confirmed
11. **Profile instrument field** — sets default view per member

---

# PART EIGHT: VOICE & TONE

The app sounds like the band. Not a startup. Not a meditation app.

| Say this | Not this |
|---|---|
| "Bear WIP" | "Untitled Draft 1" |
| "Song locked. 👑 Nobody touches this one." | "This song has been finalized." |
| "⚡ 8 bars. Let's go." | "Section duration: 8 measures" |
| "G in A? Easy — capo 2." | "Transposition suggestion applied." |
| "Start Show" | "Begin Playback Session" |
| "No songs yet. Write something." | "No songs found in your library." |

Every label, empty state, error, and toast must pass this test.

---

# APPENDIX: BRAND TOKENS (QUICK REFERENCE)

```css
--lk-black:    #08060F;   /* page background */
--lk-void:     #100018;   /* card backgrounds */
--lk-deep:     #1A0030;   /* raised cards, inputs */
--lk-pink:     #FF2D9B;   /* primary — logos, CTAs, section tags */
--lk-teal:     #00E5CC;   /* secondary — chords, links, highlights */
--lk-violet:   #7B2FBE;   /* tertiary — minor chords, accents */
--lk-gold:     #F0C040;   /* premium — crowns, root notes, locked songs */
--lk-white:    #F0EAF8;   /* all body text */
--lk-muted:    #6644AA;   /* timestamps, labels, de-emphasized text */
--lk-subtle:   #2A0040;   /* borders, dividers */

--font-display: 'Bebas Neue';      /* song titles, hero headings, band name */
--font-heading: 'Oswald', 700;     /* section labels, chord names, nav, UI */
--font-body:    'Inter', 400/500;  /* lyrics, descriptions — 20px min in performance */
--font-mono:    'Space Mono';      /* BPM, key, fret numbers, metadata */
```

---

*TLK Hub — Built for the band, by the band.*
*"Write. Rehearse. Rock."*
