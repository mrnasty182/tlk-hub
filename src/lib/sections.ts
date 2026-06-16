// Section factory and utilities for TLK Hub v2.0

import type { Section, SectionType, DrumGrid, DrumRowName } from '@/types/music'
import { DRUM_ROWS, SECTION_TYPES } from '@/types/music'

let _idCounter = 0

export function uid(): string {
  return `sec_${Date.now()}_${++_idCounter}_${Math.random().toString(36).slice(2, 7)}`
}

export function createEmptyDrumGrid(timeSig: string = '4/4'): DrumGrid {
  const subdivisions = subdivisionsForTimeSig(timeSig)
  const rows = {} as Record<DrumRowName, number[]>
  for (const row of DRUM_ROWS) {
    rows[row] = new Array(subdivisions).fill(0)
  }
  return { bars: 1, subdivisions, rows }
}

export function createEmptySection(
  type: SectionType = 'verse',
  orderIndex: number = 0,
  timeSig: string = '4/4'
): Section {
  return {
    id: uid(),
    type,
    name: '',
    order_index: orderIndex,
    chords: '',
    lyrics: '',
    guitar_tab: '',
    bass_tab: '',
    drum_grid: null,
    notes: '',
    audio_url: '',
  }
}

/**
 * Create a Section with drum grid pre-attached (for drummers).
 */
export function createDrumSection(
  type: SectionType = 'verse',
  orderIndex: number = 0,
  timeSig: string = '4/4'
): Section {
  return {
    ...createEmptySection(type, orderIndex, timeSig),
    drum_grid: createEmptyDrumGrid(timeSig),
  }
}

/**
 * Parse a time signature string like "4/4" into beats and unit.
 */
export function parseTimeSig(timeSig: string): { beats: number; unit: number } {
  const [beats, unit] = timeSig.split('/').map(Number)
  return { beats: beats || 4, unit: unit || 4 }
}

/**
 * Calculate subdivisions per bar for a given time signature.
 * 4/4 = 16 sixteenths, 3/4 = 12, 6/8 = 12 (compound).
 */
export function subdivisionsForTimeSig(timeSig: string): number {
  const { beats, unit } = parseTimeSig(timeSig)

  // Compound meter (6/8, 9/8, 12/8) — dotted eighth pulse
  if (unit === 8 && beats % 3 === 0) {
    return (beats / 3) * 6
  }

  // Simple meter — sixteenth notes
  return beats * 4
}

/**
 * Format time signature display.
 */
export function formatTimeSig(timeSig: string): string {
  return timeSig || '4/4'
}

/**
 * Get the next section type in sequence (for quick-add).
 */
export function nextSectionType(current: SectionType): SectionType {
  const idx = SECTION_TYPES.indexOf(current)
  // Common song structure flow
  const flow: Record<string, SectionType> = {
    'intro': 'verse',
    'verse': 'chorus',
    'pre-chorus': 'chorus',
    'chorus': 'verse',
    'hook': 'verse',
    'post-chorus': 'verse',
    'bridge': 'chorus',
    'breakdown': 'chorus',
    'musical-break': 'chorus',
    'instrumental': 'chorus',
    'tag': 'outro',
    'solo': 'chorus',
    'outro': 'outro',
  }
  return flow[current] || 'verse'
}
