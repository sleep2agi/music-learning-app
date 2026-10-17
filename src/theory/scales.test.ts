import { describe, expect, it } from 'vitest'
import { LETTERS, parseNoteName } from './notes.ts'
import { scaleMidis, scalePitchClasses, spellScale, type ScaleType } from './scales.ts'

const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'Cb', 'E#', 'B#']
const TYPES = ['major', 'naturalMinor'] as const satisfies readonly ScaleType[]

describe('scales', () => {
  it('spells familiar major and minor scales', () => {
    expect(spellScale('C', 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    expect(spellScale('G', 'major')).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#'])
    expect(spellScale('F', 'major')).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E'])
    expect(spellScale('D', 'major')).toEqual(['D', 'E', 'F#', 'G', 'A', 'B', 'C#'])
    expect(spellScale('Bb', 'major')).toEqual(['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'])
    expect(spellScale('F#', 'major')).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'])
    expect(spellScale('Gb', 'major')).toEqual(['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'])
    expect(spellScale('A', 'naturalMinor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    expect(spellScale('E', 'naturalMinor')).toEqual(['E', 'F#', 'G', 'A', 'B', 'C', 'D'])
    expect(spellScale('C', 'naturalMinor')).toEqual(['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'])
  })

  it('uses each letter once and lands on the requested pitch classes', () => {
    for (const rootName of ROOTS) {
      for (const type of TYPES) {
        const root = parseNoteName(rootName)
        const spelled = spellScale(rootName, type)
        expect(spelled).toHaveLength(7)
        const letters = spelled.map((name) => parseNoteName(name).letter)
        const start = LETTERS.indexOf(root.letter)
        expect(letters).toEqual(LETTERS.map((_, index) => LETTERS[(start + index) % 7]))
        const pitchClasses = spelled.map((name) => parseNoteName(name).pitchClass)
        expect(pitchClasses).toEqual(scalePitchClasses(root.pitchClass, type))
        for (const name of spelled) {
          expect(Math.abs(parseNoteName(name).accidental)).toBeLessThanOrEqual(2)
        }
      }
    }
  })

  it('treats A natural minor as the relative minor of C major', () => {
    const major = [...scalePitchClasses(0, 'major')].sort((a, b) => a - b)
    const minor = [...scalePitchClasses(9, 'naturalMinor')].sort((a, b) => a - b)
    expect(minor).toEqual(major)
  })

  it('builds ascending MIDI notes for playback', () => {
    expect(scaleMidis('C', 'major', 4)).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
    expect(scaleMidis('A', 'naturalMinor', 4)).toEqual([69, 71, 72, 74, 76, 77, 79, 81])
  })
})
