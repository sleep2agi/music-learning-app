import { describe, expect, it } from 'vitest'
import { chordPitchClasses, identifyChord } from '../theory/chords.ts'
import { midiToFreq, midiToName, parseNoteName } from '../theory/notes.ts'
import { chordMidiNotes, fretMidi, GUITAR_CHORDS, GUITAR_STRINGS } from './guitar.ts'

describe('guitar voicings', () => {
  it('uses standard tuning E A D G B E', () => {
    expect(GUITAR_STRINGS.map((string) => midiToName(string.midi))).toEqual(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'])
    expect(midiToFreq(GUITAR_STRINGS[1]?.midi ?? 0)).toBeCloseTo(110, 5)
    expect(fretMidi(0, 0)).toBe(40)
    expect(fretMidi(0, 5)).toBe(45)
    expect(fretMidi(5, 0)).toBe(64)
    expect(() => fretMidi(0, -1)).toThrow(/Muted/)
  })

  it('spells each diagram as the named chord', () => {
    expect(new Set(GUITAR_CHORDS.map((chord) => chord.id)).size).toBe(GUITAR_CHORDS.length)
    for (const chord of GUITAR_CHORDS) {
      const sounding = chordMidiNotes(chord).map((midi) => midi % 12)
      const identified = identifyChord(sounding)
      expect(identified).toEqual({
        rootPc: parseNoteName(chord.root).pitchClass,
        quality: chord.quality,
      })
      expect([...new Set(sounding)].sort((a, b) => a - b)).toEqual(
        [...new Set(chordPitchClasses(parseNoteName(chord.root).pitchClass, chord.quality))].sort((a, b) => a - b),
      )
      expect(chord.frets).toHaveLength(6)
      expect(chord.fingers).toHaveLength(6)
    }
  })
})
