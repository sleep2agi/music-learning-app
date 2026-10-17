import { describe, expect, it } from 'vitest'
import { describeSemitones, intervalBetweenPitchClasses, INTERVALS } from './intervals.ts'

describe('intervals', () => {
  it('names the common intervals inside an octave', () => {
    expect(describeSemitones(0).name).toBe('纯一度')
    expect(describeSemitones(1).name).toBe('小二度')
    expect(describeSemitones(3).name).toBe('小三度')
    expect(describeSemitones(4).name).toBe('大三度')
    expect(describeSemitones(5).name).toBe('纯四度')
    expect(describeSemitones(6).name).toBe('三全音')
    expect(describeSemitones(7).name).toBe('纯五度')
    expect(describeSemitones(12).name).toBe('纯八度')
    expect(describeSemitones(24).name).toBe('纯八度')
    expect(describeSemitones(-4).name).toBe('大三度')
  })

  it('measures pitch-class distance going upward', () => {
    expect(intervalBetweenPitchClasses(0, 4).shortName).toBe('M3')
    expect(intervalBetweenPitchClasses(0, 3).name).toBe('小三度')
    expect(intervalBetweenPitchClasses(7, 0).name).toBe('纯四度')
    expect(intervalBetweenPitchClasses(2, 2).name).toBe('纯一度')
  })

  it('keeps interval names unique', () => {
    expect(new Set(INTERVALS.map((interval) => interval.name)).size).toBe(INTERVALS.length)
  })
})
