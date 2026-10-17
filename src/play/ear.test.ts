import { describe, expect, it } from 'vitest'
import { chordPitchClasses } from '../theory/chords.ts'
import { INTERVALS } from '../theory/intervals.ts'
import { mod12 } from '../theory/notes.ts'
import { createRng } from '../theory/quiz.ts'
import { buildEarRound, isEarCorrect } from './ear.ts'

describe('ear rounds', () => {
  it('builds a stable note round whose answer is one of four choices', () => {
    const first = buildEarRound('note', createRng(7))
    const second = buildEarRound('note', createRng(7))
    expect(first).toEqual(second)
    expect(first.playback).toBe('note')
    expect(first.midis).toHaveLength(1)
    expect(first.choices).toHaveLength(4)
    expect(new Set(first.choices.map((choice) => choice.id)).size).toBe(4)
    expect(first.choices.some((choice) => choice.id === first.answerId)).toBe(true)
    expect(isEarCorrect(first, first.answerId)).toBe(true)
    expect(isEarCorrect(first, 'nope')).toBe(false)
  })

  it('plays an interval that matches the answer id', () => {
    const round = buildEarRound('interval', createRng(11))
    const interval = INTERVALS.find((item) => item.id === round.answerId)
    expect(round.midis).toHaveLength(2)
    expect(interval).toBeTruthy()
    expect((round.midis[1] ?? 0) - (round.midis[0] ?? 0)).toBe(interval?.semitones)
    expect(round.choices.map((choice) => choice.id)).toContain(round.answerId)
  })

  it('spells a triad for chord rounds', () => {
    const round = buildEarRound('chord', createRng(3))
    expect(round.playback).toBe('chord')
    expect(round.midis).toHaveLength(3)
    expect(['major', 'minor', 'diminished']).toContain(round.answerId)
    const quality = round.answerId as 'major' | 'minor' | 'diminished'
    const root = mod12(round.midis[0] ?? 0)
    const sounded = round.midis.map((midi) => mod12(midi)).sort((a, b) => a - b)
    const expected = chordPitchClasses(root, quality).sort((a, b) => a - b)
    expect(sounded).toEqual(expected)
  })
})
