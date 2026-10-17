import { describe, expect, it } from 'vitest'
import {
  formatNote,
  isBlackKey,
  midiLabel,
  midiToFreq,
  midiToName,
  parseNoteName,
  pitchClassName,
  spellOnLetter,
} from './notes.ts'

describe('note names', () => {
  it('parses naturals, sharps, and flats', () => {
    expect(parseNoteName('C')).toMatchObject({ letter: 'C', accidental: 0, pitchClass: 0, name: 'C' })
    expect(parseNoteName('f#')).toMatchObject({ letter: 'F', accidental: 1, pitchClass: 6, name: 'F#' })
    expect(parseNoteName('Bb')).toMatchObject({ letter: 'B', accidental: -1, pitchClass: 10, name: 'Bb' })
    expect(parseNoteName('E#')).toMatchObject({ pitchClass: 5, name: 'E#' })
    expect(parseNoteName('Cb')).toMatchObject({ pitchClass: 11, name: 'Cb' })
    expect(parseNoteName('F##')).toMatchObject({ accidental: 2, pitchClass: 7, name: 'F##' })
    expect(parseNoteName('Gbb')).toMatchObject({ accidental: -2, pitchClass: 5, name: 'Gbb' })
  })

  it('rejects names that are not notes', () => {
    expect(() => parseNoteName('H')).toThrow(/Invalid note name/)
    expect(() => parseNoteName('C###')).toThrow(/Invalid note name/)
    expect(() => parseNoteName('')).toThrow(/Invalid note name/)
    expect(() => parseNoteName('C #')).toThrow(/Invalid note name/)
  })

  it('round-trips formatted spellings', () => {
    for (const name of ['C', 'F#', 'Bb', 'E#', 'Cb', 'F##', 'Gbb']) {
      const parsed = parseNoteName(name)
      expect(formatNote(parsed.letter, parsed.accidental)).toBe(name)
    }
  })

  it('spells a pitch class onto a chosen letter', () => {
    expect(spellOnLetter(6, 'F').name).toBe('F#')
    expect(spellOnLetter(10, 'B').name).toBe('Bb')
    expect(spellOnLetter(11, 'C').name).toBe('Cb')
    expect(spellOnLetter(0, 'B').name).toBe('B#')
    expect(spellOnLetter(5, 'E').name).toBe('E#')
  })

  it('converts MIDI note numbers to names and frequencies', () => {
    expect(midiToName(60)).toBe('C4')
    expect(midiToName(69)).toBe('A4')
    expect(midiToName(70, true)).toBe('Bb4')
    expect(midiToName(61)).toBe('C#4')
    expect(pitchClassName(10, true)).toBe('Bb')
    expect(midiLabel(61)).toBe('C#4 / Db4')
    expect(midiLabel(60)).toBe('C4')
    expect(midiToFreq(69)).toBeCloseTo(440, 8)
    expect(midiToFreq(57)).toBeCloseTo(220, 6)
    expect(midiToFreq(81)).toBeCloseTo(880, 6)
  })

  it('knows which keys are black', () => {
    expect(isBlackKey(60)).toBe(false)
    expect(isBlackKey(61)).toBe(true)
    expect(isBlackKey(64)).toBe(false)
    expect(isBlackKey(70)).toBe(true)
  })
})
