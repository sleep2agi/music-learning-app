export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type Letter = (typeof LETTERS)[number]

export const NATURAL_PITCH: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10])
const NOTE_NAME = /^([A-Ga-g])(#{1,2}|b{1,2})?$/

export interface SpelledPitch {
  letter: Letter
  accidental: number
  pitchClass: number
  name: string
}

export function mod12(value: number): number {
  return ((value % 12) + 12) % 12
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function nameForPitchClass(pitchClass: number, preferFlat: boolean): string {
  const names = preferFlat ? FLAT_NAMES : SHARP_NAMES
  const name = names[mod12(pitchClass)]
  if (!name) throw new Error(`Invalid pitch class: ${pitchClass}`)
  return name
}

export function pitchClassName(pitchClass: number, preferFlat = false): string {
  return nameForPitchClass(pitchClass, preferFlat)
}

export function midiToName(midi: number, preferFlat = false): string {
  const octave = Math.floor(midi / 12) - 1
  return `${nameForPitchClass(midi, preferFlat)}${octave}`
}

export function midiLabel(midi: number): string {
  const sharp = midiToName(midi, false)
  const flat = midiToName(midi, true)
  return sharp === flat ? sharp : `${sharp} / ${flat}`
}

export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(mod12(midi))
}

export function formatNote(letter: Letter, accidental: number): string {
  if (accidental === 0) return letter
  if (accidental > 0) return `${letter}${'#'.repeat(accidental)}`
  return `${letter}${'b'.repeat(-accidental)}`
}

export function spellOnLetter(pitchClass: number, letter: Letter): SpelledPitch {
  const pc = mod12(pitchClass)
  let accidental = pc - NATURAL_PITCH[letter]
  if (accidental > 6) accidental -= 12
  if (accidental < -6) accidental += 12
  return {
    letter,
    accidental,
    pitchClass: pc,
    name: formatNote(letter, accidental),
  }
}

export function parseNoteName(name: string): SpelledPitch {
  const match = NOTE_NAME.exec(name.trim())
  if (!match) throw new Error(`Invalid note name: ${name}`)
  const letter = match[1].toUpperCase() as Letter
  const accidentalText = match[2] ?? ''
  let accidental = 0
  if (accidentalText.startsWith('#')) accidental = accidentalText.length
  if (accidentalText.startsWith('b')) accidental = -accidentalText.length
  return {
    letter,
    accidental,
    pitchClass: mod12(NATURAL_PITCH[letter] + accidental),
    name: formatNote(letter, accidental),
  }
}
