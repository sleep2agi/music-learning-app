import { describe, expect, it } from 'vitest'
import { extendSequence, judgePress, SIMON_POOL } from './simon.ts'

describe('simon sequence', () => {
  it('appends a note from the pool', () => {
    expect(extendSequence([], () => 0)).toEqual([SIMON_POOL[0]])
    expect(extendSequence([60], () => 0.99)).toEqual([60, SIMON_POOL[SIMON_POOL.length - 1]])
  })

  it('accepts the next note, completes the phrase, or misses', () => {
    expect(judgePress([60, 62], 0, 60)).toBe('continue')
    expect(judgePress([60, 62], 1, 62)).toBe('complete')
    expect(judgePress([60], 0, 64)).toBe('miss')
    expect(judgePress([], 0, 60)).toBe('miss')
  })
})
