'use client'

import React, { useState, useCallback } from 'react'

const BRAND = {
  hotPink: '#FF2D9B',
  electricTeal: '#00E5CC',
  deepViolet: '#7B2FBE',
  glamGold: '#F0C040',
  midnight: '#08060F',
  muted: '#6B6180',
  surface: '#130E20',
  card: '#0E0B18',
  border: '#1E1830',
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

// All keys guitarists actually use (sharps + appropriate flats)
const ALL_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const SCALE_TYPES = {
  pentatonicMinor: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    description: 'The rock/blues workhorse. Can\'t go wrong with this.',
    formula: 'R b3 4 5 b7',
  },
  pentatonicMajor: {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    description: 'Safe, always sounds good. Great for solos and improvisation.',
    formula: 'R 2 3 5 6',
  },
  blues: {
    name: 'Blues Scale',
    intervals: [0, 3, 5, 6, 7, 10],
    description: 'Minor pentatonic + the "blue note" (b5). The spine of blues and rock.',
    formula: 'R b3 4 b5 5 b7',
  },
  major: {
    name: 'Major Scale',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'Bright, happy, resolved. The default "happy" scale.',
    formula: 'R 2 3 4 5 6 7',
  },
  naturalMinor: {
    name: 'Natural Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: 'Dark, sad, moody. Use for melancholy songs.',
    formula: 'R 2 b3 4 5 b6 b7',
  },
  dorian: {
    name: 'Dorian Mode',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: 'Minor scale with a raised 6th. Funky, jazzy, slightly mysterious.',
    formula: 'R 2 b3 4 5 6 b7',
  },
  mixolydian: {
    name: 'Mixolydian Mode',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    description: 'Major scale with a flat 7th. The sound of classic rock and blues.',
    formula: 'R 2 3 4 5 6 b7',
  },
  harmonicMinor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Natural minor + raised 7th. Exotic, Middle Eastern sound.',
    formula: 'R 2 b3 4 5 b6 7',
  },
}

type ScaleKey = keyof typeof SCALE_TYPES

// Real guitar scale positions.
// Each entry: { startFret, label, notes: [{s: stringIndex (0=lowE), f: fretOffset, isRoot: bool}] }
// Strings are indexed 0-5 (low E to high E).
// fretOffset is relative to startFret (0 = startFret, 1 = startFret+1, etc.)
// A "•" means the note exists at that position on that string.

const SCALE_POSITIONS: Record<ScaleKey, {
  label: string;
  fretRange: string;
  notes: { s: number; f: number; isRoot: boolean }[];
}[]> = {
  pentatonicMinor: [
    {
      label: 'Position 1',
      fretRange: '5th–9th fret',
      notes: [
        // Low E (s=0): A(5), C(8)  — A is root
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},
        // A string (s=1): C(8), E(10)  — A is root
        {s:1,f:0,isRoot:true},{s:1,f:3,isRoot:false},
        // D string (s=2): F(8), G(10)  — A is root
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        // G string (s=3): A(7), C(9)  — A is root
        {s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},
        // B string (s=4): D(7), F(8)  — A is root
        {s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},
        // High E (s=5): A(5), C(8)  — A is root
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 2',
      fretRange: '5th–12th fret',
      notes: [
        // Box 2 typically starts at 5th fret
        // Low E: A(5)=root, C(8), D(10)
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:0,f:5,isRoot:false},
        // A: C(8), D(10), E(12)
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        // D: F(8), G(10)
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        // G: A(7)=root, B(8), D(10)
        {s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},
        // B: D(7), E(9)
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        // High E: A(5)=root, C(8)
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 3',
      fretRange: '7th–12th fret',
      notes: [
        // Low E: G(7), A(9)=root, C(12)
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:true},{s:0,f:5,isRoot:false},
        // A: C(8), D(10), E(12)
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        // D: F(8), G(10), A(12)=root
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},
        // G: A(7)=root, B(8), D(10)
        {s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},
        // B: D(7), E(9), G(12)
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},
        // High E: G(7), A(9)=root
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:true},
      ],
    },
    {
      label: 'Position 4',
      fretRange: '9th–12th fret',
      notes: [
        // Low E: A(9)=root, C(12)
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},
        // A: C(8), D(10), E(12)
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        // D: F(8), G(10), A(12)=root
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},
        // G: B(8), D(10)
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},
        // B: D(7), E(9), G(12)
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},
        // High E: A(9)=root, C(12)
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 5',
      fretRange: '12th–15th fret',
      notes: [
        // Low E: A(12)=root, C(15)
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},
        // A: D(10), E(12)=root
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:true},
        // D: G(10), A(12)=root
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:true},
        // G: A(7)=root (12th fret harmonic area)
        {s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},
        // B: D(7), E(9)
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        // High E: A(12)=root, C(15)
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
  ],
  pentatonicMajor: [
    {
      label: 'Position 1',
      fretRange: '5th–9th fret',
      notes: [
        // A Major Pentatonic at 5th fret
        // Low E (A): C(8), D(10), E(12)
        {s:0,f:0,isRoot:false},{s:0,f:3,isRoot:false},{s:0,f:5,isRoot:false},
        // A (A): C(8), D(10), E(12)
        {s:1,f:0,isRoot:false},{s:1,f:3,isRoot:false},{s:1,f:5,isRoot:false},
        // D (D): F(8), G(10), A(12)
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:false},
        // G (G): A(7), B(8), D(10)
        {s:3,f:0,isRoot:false},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},
        // B (B): D(7), E(9)
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        // High E (E): G(7), A(9)=root, B(11)
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:true},{s:5,f:4,isRoot:false},
      ],
    },
    {
      label: 'Position 2',
      fretRange: '5th–12th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},{s:0,f:5,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:5,isRoot:false},
      ],
    },
    {
      label: 'Position 3',
      fretRange: '7th–12th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:5,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},{s:3,f:4,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},{s:4,f:3,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false},
      ],
    },
    {
      label: 'Position 4',
      fretRange: '9th–12th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:3,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:3,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:3,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:3,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:4,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 5',
      fretRange: '12th–15th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},{s:4,f:3,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false},
      ],
    },
  ],
  blues: [
    {
      label: 'Position 1',
      fretRange: '5th–9th fret',
      notes: [
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},
        {s:1,f:0,isRoot:true},{s:1,f:3,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 2',
      fretRange: '5th–12th fret',
      notes: [
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:0,f:5,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 3',
      fretRange: '7th–12th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:true},{s:0,f:5,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},
        {s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:true},
      ],
    },
    {
      label: 'Position 4',
      fretRange: '9th–12th fret',
      notes: [
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 5',
      fretRange: '12th–15th fret',
      notes: [
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:true},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:true},
        {s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
  ],
  major: [
    {
      label: 'Position 1',
      fretRange: '5th–9th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},{s:0,f:5,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:3,isRoot:false},{s:1,f:5,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:3,f:5,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false},{s:5,f:5,isRoot:false},
      ],
    },
    {
      label: 'Position 2',
      fretRange: '5th–12th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},{s:0,f:5,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:3,f:5,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false},{s:5,f:5,isRoot:false},
      ],
    },
    {
      label: 'Position 3',
      fretRange: '7th–12th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:5,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:3,f:5,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:4,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false},
      ],
    },
    {
      label: 'Position 4',
      fretRange: '9th–12th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:3,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:3,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:3,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:3,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:4,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 5',
      fretRange: '12th–15th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},{s:4,f:3,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false},
      ],
    },
  ],
  naturalMinor: [
    {
      label: 'Position 1',
      fretRange: '5th–9th fret',
      notes: [
        {s:0,f:0,isRoot:true},{s:0,f:2,isRoot:false},{s:0,f:3,isRoot:false},
        {s:1,f:0,isRoot:true},{s:1,f:2,isRoot:false},{s:1,f:3,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:3,f:5,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},
        {s:5,f:0,isRoot:true},{s:5,f:2,isRoot:false},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 2',
      fretRange: '5th–12th fret',
      notes: [
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:0,f:5,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},
        {s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 3',
      fretRange: '7th–12th fret',
      notes: [
        {s:0,f:0,isRoot:false},{s:0,f:2,isRoot:true},{s:0,f:5,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},
        {s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},
        {s:5,f:0,isRoot:false},{s:5,f:2,isRoot:true},
      ],
    },
    {
      label: 'Position 4',
      fretRange: '9th–12th fret',
      notes: [
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},
        {s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
    {
      label: 'Position 5',
      fretRange: '12th–15th fret',
      notes: [
        {s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},
        {s:1,f:0,isRoot:false},{s:1,f:2,isRoot:true},
        {s:2,f:0,isRoot:false},{s:2,f:2,isRoot:true},
        {s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},
        {s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},
        {s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false},
      ],
    },
  ],
  dorian: [
    {label:'Position 1', fretRange:'5th–9th fret', notes:[{s:0,f:0,isRoot:true},{s:0,f:2,isRoot:false},{s:0,f:3,isRoot:false},{s:1,f:0,isRoot:true},{s:1,f:2,isRoot:false},{s:1,f:3,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},{s:5,f:0,isRoot:true},{s:5,f:2,isRoot:false},{s:5,f:3,isRoot:false}]},
    {label:'Position 2', fretRange:'5th–12th fret', notes:[{s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:0,f:5,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false}]},
    {label:'Position 3', fretRange:'7th–12th fret', notes:[{s:0,f:0,isRoot:false},{s:0,f:2,isRoot:true},{s:0,f:5,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},{s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},{s:5,f:0,isRoot:false},{s:5,f:2,isRoot:true}]},
    {label:'Position 4', fretRange:'9th–12th fret', notes:[{s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},{s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},{s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false}]},
    {label:'Position 5', fretRange:'12th–15th fret', notes:[{s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:true},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:true},{s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false}]},
  ],
  mixolydian: [
    {label:'Position 1', fretRange:'5th–9th fret', notes:[{s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},{s:0,f:5,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:1,f:5,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:3,f:5,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false},{s:5,f:5,isRoot:false}]},
    {label:'Position 2', fretRange:'5th–12th fret', notes:[{s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},{s:0,f:5,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:3,f:5,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false},{s:5,f:5,isRoot:false}]},
    {label:'Position 3', fretRange:'7th–12th fret', notes:[{s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:5,isRoot:false},{s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:3,f:5,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:4,isRoot:false},{s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false}]},
    {label:'Position 4', fretRange:'9th–12th fret', notes:[{s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:3,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:3,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:3,isRoot:false},{s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:3,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:4,isRoot:false},{s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:3,isRoot:false}]},
    {label:'Position 5', fretRange:'12th–15th fret', notes:[{s:0,f:0,isRoot:false},{s:0,f:2,isRoot:false},{s:0,f:4,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},{s:4,f:3,isRoot:false},{s:5,f:0,isRoot:false},{s:5,f:2,isRoot:false},{s:5,f:4,isRoot:false}]},
  ],
  harmonicMinor: [
    {label:'Position 1', fretRange:'5th–9th fret', notes:[{s:0,f:0,isRoot:true},{s:0,f:2,isRoot:false},{s:0,f:3,isRoot:false},{s:1,f:0,isRoot:true},{s:1,f:2,isRoot:false},{s:1,f:3,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},{s:3,f:4,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:1,isRoot:false},{s:5,f:0,isRoot:true},{s:5,f:2,isRoot:false},{s:5,f:3,isRoot:false}]},
    {label:'Position 2', fretRange:'5th–12th fret', notes:[{s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:0,f:5,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false}]},
    {label:'Position 3', fretRange:'7th–12th fret', notes:[{s:0,f:0,isRoot:false},{s:0,f:2,isRoot:true},{s:0,f:5,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},{s:3,f:0,isRoot:true},{s:3,f:1,isRoot:false},{s:3,f:3,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},{s:5,f:0,isRoot:false},{s:5,f:2,isRoot:true}]},
    {label:'Position 4', fretRange:'9th–12th fret', notes:[{s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:false},{s:1,f:4,isRoot:false},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:false},{s:2,f:4,isRoot:true},{s:3,f:0,isRoot:false},{s:3,f:2,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:4,f:5,isRoot:false},{s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false}]},
    {label:'Position 5', fretRange:'12th–15th fret', notes:[{s:0,f:0,isRoot:true},{s:0,f:3,isRoot:false},{s:1,f:0,isRoot:false},{s:1,f:2,isRoot:true},{s:2,f:0,isRoot:false},{s:2,f:2,isRoot:true},{s:3,f:0,isRoot:true},{s:3,f:2,isRoot:false},{s:4,f:0,isRoot:false},{s:4,f:2,isRoot:false},{s:5,f:0,isRoot:true},{s:5,f:3,isRoot:false}]},
  ],
}

// ─── Key Finder Logic ────────────────────────────────────────────────────────

const KEY_DIATONIC_CHORDS: Record<string, { root: string; quality: 'major' | 'minor' | 'dim' }[]> = {
  'C':  [{root:'C',quality:'major'},{root:'Dm',quality:'minor'},{root:'Em',quality:'minor'},{root:'F',quality:'major'},{root:'G',quality:'major'},{root:'Am',quality:'minor'},{root:'Bdim',quality:'dim'}],
  'G':  [{root:'G',quality:'major'},{root:'Am',quality:'minor'},{root:'Bm',quality:'minor'},{root:'C',quality:'major'},{root:'D',quality:'major'},{root:'Em',quality:'minor'},{root:'F#dim',quality:'dim'}],
  'D':  [{root:'D',quality:'major'},{root:'Em',quality:'minor'},{root:'F#m',quality:'minor'},{root:'G',quality:'major'},{root:'A',quality:'major'},{root:'Bm',quality:'minor'},{root:'C#dim',quality:'dim'}],
  'A':  [{root:'A',quality:'major'},{root:'Bm',quality:'minor'},{root:'C#m',quality:'minor'},{root:'D',quality:'major'},{root:'E',quality:'major'},{root:'F#m',quality:'minor'},{root:'G#dim',quality:'dim'}],
  'E':  [{root:'E',quality:'major'},{root:'F#m',quality:'minor'},{root:'G#m',quality:'minor'},{root:'A',quality:'major'},{root:'B',quality:'major'},{root:'C#m',quality:'minor'},{root:'D#dim',quality:'dim'}],
  'B':  [{root:'B',quality:'major'},{root:'C#m',quality:'minor'},{root:'D#m',quality:'minor'},{root:'E',quality:'major'},{root:'F#',quality:'major'},{root:'G#m',quality:'minor'},{root:'A#dim',quality:'dim'}],
  'F#': [{root:'F#',quality:'major'},{root:'G#m',quality:'minor'},{root:'A#m',quality:'minor'},{root:'B',quality:'major'},{root:'C#',quality:'major'},{root:'D#m',quality:'minor'},{root:'E#dim',quality:'dim'}],
  'C#': [{root:'C#',quality:'major'},{root:'D#m',quality:'minor'},{root:'E#m',quality:'minor'},{root:'F#',quality:'major'},{root:'G#',quality:'major'},{root:'A#m',quality:'minor'},{root:'B#dim',quality:'dim'}],
  'F':  [{root:'F',quality:'major'},{root:'Gm',quality:'minor'},{root:'Am',quality:'minor'},{root:'Bb',quality:'major'},{root:'C',quality:'major'},{root:'Dm',quality:'minor'},{root:'Edim',quality:'dim'}],
  'Bb': [{root:'Bb',quality:'major'},{root:'Cm',quality:'minor'},{root:'Dm',quality:'minor'},{root:'Eb',quality:'major'},{root:'F',quality:'major'},{root:'Gm',quality:'minor'},{root:'Adim',quality:'dim'}],
  'Eb': [{root:'Eb',quality:'major'},{root:'Fm',quality:'minor'},{root:'Gm',quality:'minor'},{root:'Ab',quality:'major'},{root:'Bb',quality:'major'},{root:'Cm',quality:'minor'},{root:'Ddim',quality:'dim'}],
  'Ab': [{root:'Ab',quality:'major'},{root:'Bbm',quality:'minor'},{root:'Cm',quality:'minor'},{root:'Db',quality:'major'},{root:'Eb',quality:'major'},{root:'Fm',quality:'minor'},{root:'Gdim',quality:'dim'}],
  'Db': [{root:'Db',quality:'major'},{root:'Ebm',quality:'minor'},{root:'Fm',quality:'minor'},{root:'Gb',quality:'major'},{root:'Ab',quality:'major'},{root:'Bbm',quality:'minor'},{root:'Cdim',quality:'dim'}],
  'Gb': [{root:'Gb',quality:'major'},{root:'Abm',quality:'minor'},{root:'Bbm',quality:'minor'},{root:'Cb',quality:'major'},{root:'Db',quality:'major'},{root:'Ebm',quality:'minor'},{root:'Fdim',quality:'dim'}],
}

function normalizeNote(note: string): string {
  const map: Record<string, string> = { 'Cb':'B', 'Eb':'D#', 'Gb':'F#', 'Ab':'G#', 'Bb':'A#', 'Db':'C#', 'Fb':'E', 'E#':'F', 'B#':'C', 'Gx':'A#', 'Dx':'E#', 'Ax':'G#', 'Fx':'E' }
  return map[note] || note
}

function chordToRootAndQuality(chord: string): { root: string; quality: 'major' | 'minor' | 'dim' } {
  const normalized = normalizeNote(chord)
  // Strip bass note if present (e.g. "A/G")
  const rootOnly = normalized.replace(/^\(([^)]+)\)\/.*$|^(.*)\/.*$/, '$1$2').trim()
  
  let root = rootOnly.replace(/m$|m7$|maj$|maj7$|dim$|dim7$|sus[234]$|add[0-9]+$|aug$|[0-9]+$/g, '')
  const quality: 'major' | 'minor' | 'dim' = 
    /dim$|dim7$/.test(rootOnly) ? 'dim' :
    /m$|m7$/.test(rootOnly) ? 'minor' : 'major'
  
  if (!root) root = rootOnly.charAt(0) + (rootOnly.charAt(1) === '#' || rootOnly.charAt(1) === 'b' ? rootOnly.charAt(1) : '')
  root = normalizeNote(root)
  return { root, quality }
}

function findKey(chordInput: string): { key: string; isMinor: boolean; scale: ScaleKey; confidence: number } | null {
  const tokens = chordInput.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null

  const parsed = tokens.map(t => chordToRootAndQuality(t))
  const uniqueRoots = [...new Set(parsed.map(p => p.root))]

  let bestKey = ''
  let bestScore = 0
  let isMinor = false

  for (const [key, diatonic] of Object.entries(KEY_DIATONIC_CHORDS)) {
    const diatonicRoots = diatonic.map(d => normalizeNote(d.root.replace(/m$|dim$/g, '')))
    const matches = parsed.filter(p => {
      const chordRoot = normalizeNote(p.root.replace(/m$|dim$/g, ''))
      return diatonicRoots.includes(chordRoot)
    }).length

    if (matches > bestScore) {
      bestScore = matches
      bestKey = key
 }
  }

  if (!bestKey) return null

  // Determine if minor (based on whether first chord is minor or relative minor)
  const firstChord = parsed[0]
  const diatonic = KEY_DIATONIC_CHORDS[bestKey]
  const firstMatch = diatonic.find(d => normalizeNote(d.root.replace(/m$|dim$/g, '')) === normalizeNote(firstChord.root.replace(/m$|dim$/g, '')))
  isMinor = firstMatch?.quality === 'minor'

  // Scale recommendation
  const scale: ScaleKey = isMinor ? 'pentatonicMinor' : 'major'

  return {
    key: bestKey,
    isMinor,
    scale,
    confidence: bestScore / parsed.length,
  }
}

// ─── Chord Voicings ──────────────────────────────────────────────────────────

type Voicing = {
  label: string
  positions: (number | null)[] // 6 strings, null = muted/x, -1 = open, number = fret
}

const CHORD_VOICINGS: Record<string, Voicing[]> = {
  'C': [
    { label: 'Open', positions: [-1, 3, 2, 0, 1, 0] },
    { label: 'C/E (1st fret)', positions: [-1, 3, 2, 0, 1, 3] },
    { label: 'C/G (3rd fret)', positions: [3, 5, 5, 5, 3, -1] },
    { label: 'Barre 8th fret', positions: [8, 10, 10, 9, 8, 8] },
  ],
  'D': [
    { label: 'Open', positions: [-1, -1, 0, 2, 3, 2] },
    { label: 'D/F# (1st fret)', positions: [-1, -1, 0, 2, 3, 2] },
    { label: 'D/A (5th fret)', positions: [-1, 5, 7, 7, 5, -1] },
    { label: 'Barre 10th fret', positions: [10, 12, 12, 11, 10, 10] },
  ],
  'E': [
    { label: 'Open', positions: [0, 2, 2, 1, 0, 0] },
    { label: 'E/G# (1st fret)', positions: [0, 2, 2, 1, 0, 0] },
    { label: 'Power (2nd fret)', positions: [-1, -1, 2, 2, 0, 0] },
    { label: 'Barre 12th fret', positions: [12, 14, 14, 13, 12, 12] },
  ],
  'F': [
    { label: 'Barre 1st fret', positions: [1, 3, 3, 2, 1, 1] },
    { label: 'F/A (3rd fret)', positions: [-1, 3, 3, 2, 1, 1] },
    { label: 'F/C (5th fret)', positions: [-1, 5, 6, 5, 3, 1] },
    { label: 'Fadd9 open', positions: [-1, -1, 0, 2, 3, 3] },
  ],
  'G': [
    { label: 'Open', positions: [3, 2, 0, 0, 0, 3] },
    { label: 'G/B (2nd fret)', positions: [3, 5, 5, 4, 3, 3] },
    { label: 'G/D (3rd fret)', positions: [-1, 3, 2, 0, 0, 3] },
    { label: 'Barre 8th fret', positions: [8, 10, 10, 9, 8, 8] },
  ],
  'A': [
    { label: 'Open', positions: [-1, 0, 2, 2, 2, 0] },
    { label: 'Power (2nd fret)', positions: [-1, -1, 2, 2, 2, 0] },
    { label: 'A/C# (4th fret)', positions: [-1, 4, 6, 6, 5, 4] },
    { label: 'Barre 5th fret', positions: [5, 7, 7, 6, 5, 5] },
  ],
  'B': [
    { label: 'Barre 2nd fret', positions: [-1, 2, 4, 4, 3, 2] },
    { label: 'B/D# (4th fret)', positions: [-1, 4, 6, 6, 5, 4] },
    { label: 'B/F# (6th fret)', positions: [-1, 6, 8, 8, 7, 6] },
    { label: 'Badd9 open', positions: [-1, 2, 4, 4, 3, 2] },
  ],
  'Am': [
    { label: 'Open', positions: [-1, 0, 2, 2, 1, 0] },
    { label: 'Am/C (1st fret)', positions: [-1, 1, 2, 2, 1, 1] },
    { label: 'Am/G (3rd fret)', positions: [3, 2, 0, 2, 1, 0] },
    { label: 'Barre 5th fret', positions: [5, 7, 7, 6, 5, 5] },
  ],
  'Dm': [
    { label: 'Open', positions: [-1, -1, 0, 2, 3, 1] },
    { label: 'Dm/F (1st fret)', positions: [-1, 1, 2, 2, 1, 1] },
    { label: 'Dm/A (5th fret)', positions: [-1, 5, 7, 7, 5, 5] },
    { label: 'Barre 10th fret', positions: [10, 12, 12, 11, 10, 10] },
  ],
  'Em': [
    { label: 'Open', positions: [0, 2, 2, 0, 0, 0] },
    { label: 'Em/G (2nd fret)', positions: [0, 2, 2, 0, 0, 0] },
    { label: 'Power (2nd fret)', positions: [-1, -1, 2, 2, 0, 0] },
    { label: 'Barre 12th fret', positions: [12, 14, 14, 12, 12, 12] },
  ],
 'Fm': [
    { label: 'Barre 1st fret', positions: [1, 3, 3, 1, 1, 1] },
    { label: 'Fm/Ab (3rd fret)', positions: [-1, 3, 3, 1, 1, 1] },
    { label: 'Fm/C (5th fret)', positions: [-1, 5, 6, 5, 3, 1] },
    { label: 'Fm/Bb (3rd fret)', positions: [3, 5, 5, 3, 3, 3] },
  ],
  'Gm': [
    { label: 'Barre 3rd fret', positions: [3, 5, 5, 3, 3, 3] },
    { label: 'Gm/Bb (5th fret)', positions: [-1, 5, 7, 7, 5, 5] },
    { label: 'Gm/D (7th fret)', positions: [-1, 7, 8, 7, 5, 3] },
    { label: 'Gm/Eb (3rd fret)', positions: [3, 5, 5, 3, 3, 3] },
  ],
  'Bm': [
    { label: 'Barre 2nd fret', positions: [-1, 2, 4, 4, 3, 2] },
    { label: 'Bm/D (4th fret)', positions: [-1, 4, 6, 6, 5, 4] },
    { label: 'Bm/F# (6th fret)', positions: [-1, 6, 8, 8, 7, 6] },
    { label: 'Bm/G (7th fret)', positions: [-1, 7, 9, 9, 8, 7] },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function noteToSemitone(note: string): number {
  let idx = NOTES.indexOf(note)
  if (idx !== -1) return idx
  idx = FLAT_NOTES.indexOf(note)
  return idx !== -1 ? idx : 0
}

function getScaleNotes(root: string, scale: ScaleKey): string[] {
  const rootIdx = noteToSemitone(root)
  const useFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(root)
  const noteArray = useFlats ? FLAT_NOTES : NOTES
  return SCALE_TYPES[scale].intervals.map(i => noteArray[(rootIdx + i) % 12])
}

const FRET_WIDTH = 48
const STRING_SPACING = 26
const NUT_WIDTH = 8
const TOP_Y = 10
const NUM_STRINGS = 6
const BOX_WIDTH = FRET_WIDTH * 5 + NUT_WIDTH * 2 + 20
const BOX_HEIGHT = STRING_SPACING * (NUM_STRINGS - 1) + 20

// ─── Fretboard Diagram ────────────────────────────────────────────────────────

function FretboardDiagram({ root, scale, activePos, showAll = false, showFretNumbers = false }: {
  root: string; scale: ScaleKey; activePos: number; showAll?: boolean; showFretNumbers?: boolean
}) {
  const positions = SCALE_POSITIONS[scale] || SCALE_POSITIONS.pentatonicMinor
  const activePosition = positions[activePos] || positions[0]

  const startFret = activePos === 0 ? 5 : activePos === 1 ? 5 : activePos === 2 ? 7 : activePos === 3 ? 9 : 12
  const endFret = startFret + 4

  if (showAll) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {positions.map((pos, i) => (
          <div
            key={i}
            onClick={() => {}}
            style={{
              background: i === activePos ? `${BRAND.glamGold}11` : BRAND.card,
              border: `1px solid ${i === activePos ? BRAND.glamGold : BRAND.border}`,
              borderRadius: 12,
              padding: 12,
              cursor: 'pointer',
            }}
          >
            <FretboardDiagram root={root} scale={scale} activePos={i} showFretNumbers={true} />
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted, marginTop: 8, textAlign: 'center' }}>
              <div style={{ color: i === activePos ? BRAND.glamGold : BRAND.muted }}>{pos.label}</div>
              <div style={{ fontSize: 9, marginTop: 2 }}>{pos.fretRange}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <svg width={BOX_WIDTH} height={BOX_HEIGHT} style={{ display: 'block' }}>
        {/* Fret number label */}
        <text x={4} y={TOP_Y + STRING_SPACING * 2.5 + 1} textAnchor="middle" style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, fill: BRAND.muted }}>
          {startFret === 5 ? '5' : startFret}
        </text>

        {/* Nut */}
        <rect x={NUT_WIDTH} y={TOP_Y} width={NUT_WIDTH} height={STRING_SPACING * 5} rx={2} fill={BRAND.muted} />

        {/* Frets */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={NUT_WIDTH + (i + 1) * FRET_WIDTH + NUT_WIDTH}
            y1={TOP_Y}
            x2={NUT_WIDTH + (i + 1) * FRET_WIDTH + NUT_WIDTH}
            y2={TOP_Y + STRING_SPACING * 5}
            stroke={i === 4 ? BRAND.border : BRAND.border}
            strokeWidth={i === 4 ? 3 : 1.5}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: 6 }).map((_, s) => (
          <line
            key={`string-${s}`}
            x1={0}
            y1={TOP_Y + s * STRING_SPACING}
            x2={BOX_WIDTH}
            y2={TOP_Y + s * STRING_SPACING}
            stroke={s < 3 ? '#666' : '#888'}
            strokeWidth={s < 3 ? 1.5 : 1}
          />
        ))}

        {/* Fret dots */}
        {[3, 5].map(fret => {
          const x = NUT_WIDTH + (fret - startFret) * FRET_WIDTH + FRET_WIDTH / 2
          if (fret > endFret || fret < startFret) return null
          return <circle key={`dot-${fret}`} cx={x} cy={TOP_Y + STRING_SPACING * 2.5} r={4} fill={BRAND.border} opacity={0.5} />
        })}

        {/* Scale notes */}
        {activePosition.notes.map(({ s, f, isRoot }, noteIdx) => {
          const x = NUT_WIDTH + f * FRET_WIDTH + FRET_WIDTH / 2
          const y = TOP_Y + s * STRING_SPACING
          const color = isRoot ? BRAND.glamGold : BRAND.electricTeal
          return (
            <g key={`note-${noteIdx}`}>
              <circle cx={x} cy={y} r={10} fill={color} opacity={0.9} />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, fill: isRoot ? '#08060F' : '#000', fontWeight: 'bold' }}>
                {isRoot ? 'R' : '•'}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Fret numbers below diagram */}
      {showFretNumbers && (
        <div style={{ display: 'flex', marginTop: 4, paddingLeft: NUT_WIDTH }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              width: FRET_WIDTH,
              textAlign: 'center',
              fontFamily: 'Space Mono, monospace',
              fontSize: 9,
              color: BRAND.muted,
            }}>
              {startFret + i}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Key Finder Panel ────────────────────────────────────────────────────────

function KeyFinderPanel({ onLoadScale }: { onLoadScale: (root: string, scale: ScaleKey) => void }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ReturnType<typeof findKey>>(null)

  const handleAnalyze = useCallback(() => {
    const res = findKey(input)
    setResult(res)
  }, [input])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze()
  }, [handleAnalyze])

  return (
    <div style={{
      background: BRAND.card,
      border: `1px solid ${BRAND.border}`,
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 24,
    }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginBottom: 10, letterSpacing: 1 }}>
        KEY FINDER
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Am G C F"
          style={{
            flex: 1,
            minWidth: 180,
            background: BRAND.surface,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 8,
            padding: '8px 14px',
            color: '#F0EBF8',
            fontFamily: 'Space Mono, monospace',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={handleAnalyze}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: `1px solid ${BRAND.electricTeal}`,
            background: `${BRAND.electricTeal}22`,
            color: BRAND.electricTeal,
            fontFamily: 'Oswald, sans-serif',
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Analyze
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: 14,
          background: BRAND.surface,
          borderRadius: 8,
          padding: '12px 16px',
          border: `1px solid ${result.isMinor ? BRAND.electricTeal : BRAND.glamGold}44`,
        }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: result.isMinor ? BRAND.electricTeal : BRAND.glamGold, letterSpacing: 2 }}>
            {result.isMinor ? `${result.key} Minor` : `${result.key} Major`}
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginTop: 4 }}>
            {result.isMinor ? 'Am pentatonic' : 'Major scale'} recommended
          </div>
          <button
            onClick={() => onLoadScale(result.key, result.scale)}
            style={{
              marginTop: 10,
              padding: '6px 16px',
              borderRadius: 8,
              border: `1px solid ${BRAND.hotPink}`,
              background: `${BRAND.hotPink}22`,
              color: BRAND.hotPink,
              fontFamily: 'Oswald, sans-serif',
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Load {result.key} {SCALE_TYPES[result.scale].name}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Chord Voicings ──────────────────────────────────────────────────────────

function MiniVoicingDiagram({ positions, label }: { positions: (number | null)[]; label: string }) {
  const W = 80
  const H = 70
  const STR = 6
  const SS = 10
  const TOP = 8
  const numFrets = 4

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={W} height={H}>
        {/* Nut */}
<rect x={SS} y={TOP} width={4} height={SS *5} fill={BRAND.muted} />
        {/* Frets */}
        {Array.from({ length: numFrets }).map((_, i) => (
          <line key={i} x1={SS + (i + 1) * ((W - SS - 4) / numFrets)} y1={TOP} x2={SS + (i + 1) * ((W - SS - 4) / numFrets)} y2={TOP + SS * 5} stroke={BRAND.border} strokeWidth={1} />
        ))}
        {/* Strings */}
        {Array.from({ length: STR }).map((_, s) => (
          <line key={s} x1={0} y1={TOP + s * SS} x2={W} y2={TOP + s * SS} stroke="#666" strokeWidth={s < 3 ? 1.2 : 0.8} />
        ))}
        {/* Notes */}
        {positions.map((pos, s) => {
          if (pos === null) return null
          const x = pos === -1 ? SS / 2 : SS + 4 + (pos % numFrets) * ((W - SS - 4) / numFrets) + ((W - SS - 4) / numFrets) / 2
          const y = TOP + s * SS
          return (
            <g key={s}>
              <circle cx={x} cy={y} r={5} fill={pos === -1 ? BRAND.glamGold : BRAND.electricTeal} opacity={0.9} />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Space Mono, monospace', fontSize: 5, fill: '#08060F', fontWeight: 'bold' }}>
                {pos === -1 ? '○' : pos}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: BRAND.muted, marginTop: 4 }}>{label}</div>
    </div>
  )
}

function ChordVoicingsSection({ root, quality }: { root: string; quality: 'major' | 'minor' | 'dim' }) {
  const key = quality === 'minor' ? root + 'm' : root
  const voicings = CHORD_VOICINGS[key] || CHORD_VOICINGS[root] || []

  if (voicings.length === 0) return null

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginBottom: 12, letterSpacing: 1 }}>
        CHORD VOICINGS — {key}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {voicings.map((v, i) => (
          <MiniVoicingDiagram key={i} positions={v.positions} label={v.label} />
        ))}
      </div>
    </div>
  )
}

// ─── Scale Info Panel ─────────────────────────────────────────────────────────

function ScaleInfoPanel({ root, scale }: { root: string; scale: ScaleKey }) {
  const scaleInfo = SCALE_TYPES[scale]
  const notes = getScaleNotes(root, scale)
  const useFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(root)
  const noteArray = useFlats ? FLAT_NOTES : NOTES

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: BRAND.hotPink, letterSpacing: 2 }}>{scaleInfo.name}</span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: BRAND.electricTeal, marginLeft: 12 }}>{root}</span>
      </div>
      <p style={{ color: BRAND.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16, fontFamily: 'system-ui' }}>
        {scaleInfo.description}
      </p>
      <div style={{ background: BRAND.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 16, border: `1px solid ${BRAND.border}` }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginBottom: 4 }}>FORMULA</div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: BRAND.glamGold, letterSpacing: 1 }}>
          {scaleInfo.formula}
        </div>
      </div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginBottom: 6 }}>NOTES IN {root} {scaleInfo.name.toUpperCase()}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {notes.map((note, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 18,
              background: i === 0 ? `${BRAND.glamGold}22` : BRAND.surface,
              border: `1px solid ${i === 0 ? BRAND.glamGold : BRAND.border}`,
              color: i === 0 ? BRAND.glamGold : BRAND.electricTeal,
              borderRadius: 8,
              padding: '4px 12px',
              letterSpacing: 1,
            }}
          >
            {note}{i === 0 ? ' ← root' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GuitarScalesPage() {
  const [selectedKey, setSelectedKey] = useState('A')
  const [keyQuality, setKeyQuality] = useState<'major' | 'minor'>('minor')
  const [selectedScale, setSelectedScale] = useState<ScaleKey>('pentatonicMinor')
  const [activePos, setActivePos] = useState(0)

  const handleLoadScale = useCallback((root: string, scale: ScaleKey) => {
    setSelectedKey(root)
    setSelectedScale(scale)
    setActivePos(0)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: BRAND.hotPink, letterSpacing: 4, margin: '0 0 8px' }}>GUITAR SCALES</h2>
          <p style={{ color: BRAND.muted, fontSize: 14, margin: 0 }}>5 positions per scale. Click a position to jump to it.</p>
        </div>
      </div>

      {/* Key Finder panel */}
      <KeyFinderPanel onLoadScale={handleLoadScale} />

      {/* Key selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, letterSpacing: 1 }}>ROOT NOTE</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setKeyQuality('major')}
              style={{
                padding: '4px 12px',
                borderRadius: 12,
                border: `1px solid ${keyQuality === 'major' ? BRAND.glamGold : BRAND.border}`,
                background: keyQuality === 'major' ? `${BRAND.glamGold}22` : 'transparent',
                color: keyQuality === 'major' ? BRAND.glamGold : BRAND.muted,
                fontFamily: 'Oswald, sans-serif',
                fontSize: 10,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >Major</button>
            <button
              onClick={() => setKeyQuality('minor')}
              style={{
                padding: '4px 12px',
                borderRadius: 12,
                border: `1px solid ${keyQuality === 'minor' ? BRAND.electricTeal : BRAND.border}`,
                background: keyQuality === 'minor' ? `${BRAND.electricTeal}22` : 'transparent',
                color: keyQuality === 'minor' ? BRAND.electricTeal : BRAND.muted,
                fontFamily: 'Oswald, sans-serif',
                fontSize: 10,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >Minor</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_KEYS.map(k => (
            <button
              key={k}
              onClick={() => { setSelectedKey(k); setActivePos(0) }}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: `1px solid ${selectedKey === k ? (keyQuality === 'minor' ? BRAND.electricTeal : BRAND.hotPink) : BRAND.border}`,
                background: selectedKey === k ? (keyQuality === 'minor' ? `${BRAND.electricTeal}22` : `${BRAND.hotPink}22`) : 'transparent',
                color: selectedKey === k ? (keyQuality === 'minor' ? BRAND.electricTeal : BRAND.hotPink) : BRAND.muted,
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 16,
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {k}{keyQuality === 'minor' ? 'm' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Scale type selector */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginBottom: 8, letterSpacing: 1 }}>SCALE TYPE</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(SCALE_TYPES) as ScaleKey[]).map(key => (
            <button
              key={key}
              onClick={() => { setSelectedScale(key); setActivePos(0) }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${selectedScale === key ? BRAND.electricTeal : BRAND.border}`,
                background: selectedScale === key ? `${BRAND.electricTeal}22` : 'transparent',
                color: selectedScale === key ? BRAND.electricTeal : BRAND.muted,
                fontFamily: 'Oswald, sans-serif',
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {SCALE_TYPES[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* Position selector */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginBottom: 8, letterSpacing: 1 }}>POSITION</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(SCALE_POSITIONS[selectedScale] || SCALE_POSITIONS.pentatonicMinor).map((pos, i) => (
            <button
              key={i}
              onClick={() => setActivePos(i)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${activePos === i ? BRAND.glamGold : BRAND.border}`,
                background: activePos === i ? `${BRAND.glamGold}22` : 'transparent',
                color: activePos === i ? BRAND.glamGold : BRAND.muted,
                fontFamily: 'Oswald, sans-serif',
                fontSize: 11,
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {pos.label}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: BRAND.muted, marginTop: 6 }}>
          {(SCALE_POSITIONS[selectedScale] || SCALE_POSITIONS.pentatonicMinor)[activePos]?.fretRange || ''}
        </div>
      </div>

      {/* Main content: fretboard + notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <FretboardDiagram root={selectedKey} scale={selectedScale} activePos={activePos} showFretNumbers={true} />
        </div>
        <div>
          <ScaleInfoPanel root={selectedKey} scale={selectedScale} />
        </div>
      </div>

      {/* Chord voicings section */}
      <ChordVoicingsSection root={selectedKey} quality="major" />

      {/* All 5 positions overview */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BRAND.muted, marginBottom: 12, letterSpacing: 1 }}>
          ALL5 POSITIONS — {selectedKey} {SCALE_TYPES[selectedScale].name}
        </div>
        <FretboardDiagram root={selectedKey} scale={selectedScale} activePos={activePos} showAll={true} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, marginTop: 32, padding: '16px 20px', background: BRAND.card, borderRadius: 12, border: `1px solid ${BRAND.border}`, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: BRAND.glamGold }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.muted }}>Root note (R)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: BRAND.electricTeal }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.muted }}>Scale note</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 3, background: BRAND.muted, borderRadius: 2 }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: BRAND.muted }}>Nut / Fret</span>
        </div>
      </div>
    </div>
  )
}
