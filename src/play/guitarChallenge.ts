import { fretMidi, GUITAR_CHORDS, type GuitarChordShape } from '../data/guitar.ts'

export const FRET_GAME_MAX = 5
export const FRET_LIMIT_MS = 10000
export const CHORD_LIMIT_MS = 12000

export interface FretTarget {
  kind: 'fret'
  stringIndex: number
  fret: number
  midi: number
  key: string
}

export interface ChordTarget {
  kind: 'chord'
  chordId: string
  symbol: string
  label: string
}

export type GuitarTarget = FretTarget | ChordTarget

function pickIndex(rng: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(rng() * length))
}

export function nextFretTarget(rng: () => number, avoidKey?: string): FretTarget {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const stringIndex = pickIndex(rng, 6)
    const fret = pickIndex(rng, FRET_GAME_MAX + 1)
    const key = `${stringIndex}:${fret}`
    if (key !== avoidKey) {
      return { kind: 'fret', stringIndex, fret, midi: fretMidi(stringIndex, fret), key }
    }
  }
  return { kind: 'fret', stringIndex: 0, fret: 1, midi: fretMidi(0, 1), key: '0:1' }
}

export function nextChordTarget(
  rng: () => number,
  avoidId?: string,
  chords: readonly GuitarChordShape[] = GUITAR_CHORDS,
): ChordTarget {
  const pool = chords.filter((chord) => chord.id !== avoidId)
  const source = pool.length > 0 ? pool : chords
  const chord = source[pickIndex(rng, source.length)]
  if (!chord) throw new Error('No guitar chords')
  return { kind: 'chord', chordId: chord.id, symbol: chord.symbol, label: chord.label }
}

export function matchesFret(target: FretTarget, stringIndex: number, fret: number): boolean {
  return target.stringIndex === stringIndex && target.fret === fret
}

export function matchesChord(target: ChordTarget, chordId: string): boolean {
  return target.chordId === chordId
}

export function remainingMs(startedAt: number, now: number, limitMs: number): number {
  return Math.max(0, limitMs - (now - startedAt))
}

export function hitPoints(leftMs: number, limitMs: number, combo: number): number {
  const ratio = limitMs <= 0 ? 0 : Math.max(0, Math.min(1, leftMs / limitMs))
  return 10 + Math.round(ratio * 20) + Math.min(Math.max(combo, 0), 8) * 2
}
