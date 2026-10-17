import { describe, expect, it } from 'vitest'
import { GUITAR_CHORDS } from '../data/guitar.ts'
import {
  CHORD_LIMIT_MS,
  hitPoints,
  matchesChord,
  matchesFret,
  nextChordTarget,
  nextFretTarget,
  remainingMs,
} from './guitarChallenge.ts'

describe('guitar challenge', () => {
  it('picks a fret inside the short board and can avoid a repeat', () => {
    const first = nextFretTarget(() => 0)
    expect(first).toEqual({ kind: 'fret', stringIndex: 0, fret: 0, midi: 40, key: '0:0' })
    let step = 0
    const values = [0, 0, 0.2, 0.5]
    const next = nextFretTarget(() => values[step++] ?? 0, '0:0')
    expect(next.key).toBe('1:3')
    expect(matchesFret(next, 1, 3)).toBe(true)
    expect(matchesFret(next, 1, 2)).toBe(false)
  })

  it('picks a different chord when asked', () => {
    const target = nextChordTarget(() => 0, GUITAR_CHORDS[0]?.id)
    expect(target.chordId).not.toBe(GUITAR_CHORDS[0]?.id)
    expect(matchesChord(target, target.chordId)).toBe(true)
  })

  it('counts down and scores faster hits higher', () => {
    expect(remainingMs(1_000, 1_500, 7_000)).toBe(6_500)
    expect(remainingMs(1_000, 9_000, 7_000)).toBe(0)
    expect(hitPoints(CHORD_LIMIT_MS, CHORD_LIMIT_MS, 1)).toBe(32)
    expect(hitPoints(0, CHORD_LIMIT_MS, 0)).toBe(10)
  })
})
