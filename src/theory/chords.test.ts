import { describe, expect, it } from 'vitest'
import {
  chordLabel,
  chordMatchesLabel,
  chordMidis,
  chordPitchClasses,
  chordSymbol,
  identifyChord,
  spellChord,
  type ChordQuality,
} from './chords.ts'
import { LETTERS, parseNoteName } from './notes.ts'

const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const QUALITIES = ['major', 'minor', 'diminished', 'augmented', 'dom7', 'maj7', 'min7'] as const satisfies readonly ChordQuality[]
const STEPS: Record<ChordQuality, readonly number[]> = {
  major: [0, 2, 4],
  minor: [0, 2, 4],
  diminished: [0, 2, 4],
  augmented: [0, 2, 4],
  dom7: [0, 2, 4, 6],
  maj7: [0, 2, 4, 6],
  min7: [0, 2, 4, 6],
}

describe('chord spelling', () => {
  it('spells common triads and seventh chords', () => {
    expect(spellChord('C', 'major')).toEqual(['C', 'E', 'G'])
    expect(spellChord('A', 'minor')).toEqual(['A', 'C', 'E'])
    expect(spellChord('G', 'major')).toEqual(['G', 'B', 'D'])
    expect(spellChord('F', 'major')).toEqual(['F', 'A', 'C'])
    expect(spellChord('D', 'minor')).toEqual(['D', 'F', 'A'])
    expect(spellChord('B', 'diminished')).toEqual(['B', 'D', 'F'])
    expect(spellChord('Eb', 'major')).toEqual(['Eb', 'G', 'Bb'])
    expect(spellChord('F#', 'minor')).toEqual(['F#', 'A', 'C#'])
    expect(spellChord('C', 'augmented')).toEqual(['C', 'E', 'G#'])
    expect(spellChord('C', 'dom7')).toEqual(['C', 'E', 'G', 'Bb'])
    expect(spellChord('G', 'dom7')).toEqual(['G', 'B', 'D', 'F'])
    expect(spellChord('F', 'maj7')).toEqual(['F', 'A', 'C', 'E'])
    expect(spellChord('A', 'min7')).toEqual(['A', 'C', 'E', 'G'])
  })

  it('keeps chord tones on the right letters and pitch classes', () => {
    for (const rootName of ROOTS) {
      for (const quality of QUALITIES) {
        const root = parseNoteName(rootName)
        const spelled = spellChord(rootName, quality)
        const letters = spelled.map((name) => parseNoteName(name).letter)
        const start = LETTERS.indexOf(root.letter)
        expect(letters).toEqual(STEPS[quality].map((step) => LETTERS[(start + step) % 7]))
        expect(spelled.map((name) => parseNoteName(name).pitchClass)).toEqual(
          chordPitchClasses(root.pitchClass, quality),
        )
      }
    }
  })

  it('formats symbols and Chinese labels', () => {
    expect(chordSymbol('C', 'major')).toBe('C')
    expect(chordSymbol('A', 'minor')).toBe('Am')
    expect(chordSymbol('G', 'dom7')).toBe('G7')
    expect(chordLabel('C', 'major')).toBe('C 大三和弦')
    expect(chordLabel('Bb', 'minor')).toBe('Bbm 小三和弦')
  })

  it('identifies chords from pitch classes, including doubled notes', () => {
    expect(identifyChord([0, 4, 7])).toEqual({ rootPc: 0, quality: 'major' })
    expect(identifyChord([9, 0, 4])).toEqual({ rootPc: 9, quality: 'minor' })
    expect(identifyChord([7, 11, 2, 5])).toEqual({ rootPc: 7, quality: 'dom7' })
    expect(identifyChord([0, 4, 7, 12, 16])).toEqual({ rootPc: 0, quality: 'major' })
    expect(identifyChord([0, 4, 8])?.quality).toBe('augmented')
    expect(identifyChord([0, 1, 2])).toBeNull()
  })

  it('matches a label to the identified root and quality', () => {
    expect(chordMatchesLabel('Bb 大三和弦', 10, 'major')).toBe(true)
    expect(chordMatchesLabel('A# 大三和弦', 10, 'major')).toBe(true)
    expect(chordMatchesLabel('Am 小三和弦', 9, 'minor')).toBe(true)
    expect(chordMatchesLabel('C 大三和弦', 0, 'minor')).toBe(false)
  })

  it('places close-position chords on MIDI keys', () => {
    expect(chordMidis('C', 'major', 4)).toEqual([60, 64, 67])
    expect(chordMidis('A', 'minor', 4)).toEqual([69, 72, 76])
  })
})
