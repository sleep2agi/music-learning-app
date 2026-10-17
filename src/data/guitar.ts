import { chordLabel, chordSymbol, type ChordQuality } from '../theory/chords.ts'

export interface GuitarStringInfo {
  index: number
  label: string
  title: string
  midi: number
}

export const GUITAR_STRINGS: readonly GuitarStringInfo[] = [
  { index: 0, label: '6弦', title: '6弦 · 低音 E', midi: 40 },
  { index: 1, label: '5弦', title: '5弦 · A', midi: 45 },
  { index: 2, label: '4弦', title: '4弦 · D', midi: 50 },
  { index: 3, label: '3弦', title: '3弦 · G', midi: 55 },
  { index: 4, label: '2弦', title: '2弦 · B', midi: 59 },
  { index: 5, label: '1弦', title: '1弦 · 高音 E', midi: 64 },
]

export const FRET_COUNT = 12

export function fretMidi(stringIndex: number, fret: number): number {
  const open = GUITAR_STRINGS[stringIndex]
  if (!open) throw new Error(`Invalid string index: ${stringIndex}`)
  if (fret < 0) throw new Error('Muted string has no pitch')
  return open.midi + fret
}

export interface GuitarChordShape {
  id: string
  symbol: string
  label: string
  root: string
  quality: ChordQuality
  frets: readonly [number, number, number, number, number, number]
  fingers: readonly [number, number, number, number, number, number]
}

function shape(
  root: string,
  quality: ChordQuality,
  frets: GuitarChordShape['frets'],
  fingers: GuitarChordShape['fingers'],
): GuitarChordShape {
  return {
    id: `${root}-${quality}`,
    symbol: chordSymbol(root, quality),
    label: chordLabel(root, quality),
    root,
    quality,
    frets,
    fingers,
  }
}

export const GUITAR_CHORDS: readonly GuitarChordShape[] = [
  shape('C', 'major', [-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]),
  shape('G', 'major', [3, 2, 0, 0, 0, 3], [2, 1, 0, 0, 0, 3]),
  shape('D', 'major', [-1, -1, 0, 2, 3, 2], [0, 0, 0, 1, 3, 2]),
  shape('A', 'minor', [-1, 0, 2, 2, 1, 0], [0, 0, 2, 3, 1, 0]),
  shape('E', 'minor', [0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0]),
  shape('F', 'major', [1, 3, 3, 2, 1, 1], [1, 3, 4, 2, 1, 1]),
  shape('D', 'minor', [-1, -1, 0, 2, 3, 1], [0, 0, 0, 2, 3, 1]),
  shape('E', 'major', [0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0]),
  shape('A', 'major', [-1, 0, 2, 2, 2, 0], [0, 0, 1, 2, 3, 0]),
  shape('G', 'dom7', [3, 2, 0, 0, 0, 1], [3, 2, 0, 0, 0, 1]),
]

export function chordMidiNotes(chord: GuitarChordShape): number[] {
  return chord.frets.flatMap((fret, stringIndex) => (fret < 0 ? [] : [fretMidi(stringIndex, fret)]))
}

export function chordCellKeys(chord: GuitarChordShape): string[] {
  return chord.frets.flatMap((fret, stringIndex) => (fret < 0 ? [] : [`${stringIndex}:${fret}`]))
}
