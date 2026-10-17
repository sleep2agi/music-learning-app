import { describe, expect, it } from 'vitest'
import { applyAnswer, emptyRun, starsForCombo } from './score.ts'

describe('run score', () => {
  it('awards more points as the combo grows and clears the combo on a miss', () => {
    const once = applyAnswer(emptyRun(), true)
    const twice = applyAnswer(once, true)
    const missed = applyAnswer(twice, false)
    expect(once).toMatchObject({ points: 10, combo: 1, bestCombo: 1, correct: 1, answered: 1 })
    expect(twice).toMatchObject({ points: 30, combo: 2, bestCombo: 2, correct: 2 })
    expect(missed).toMatchObject({ points: 30, combo: 0, bestCombo: 2, correct: 2, answered: 3 })
  })

  it('caps the combo multiplier at 8', () => {
    let run = emptyRun()
    for (let count = 0; count < 9; count += 1) run = applyAnswer(run, true)
    expect(run.combo).toBe(9)
    expect(run.points).toBe(10 * (1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 8))
  })

  it('lights stars at combo 3, 6 and 10', () => {
    expect(starsForCombo(2)).toBe(0)
    expect(starsForCombo(3)).toBe(1)
    expect(starsForCombo(6)).toBe(2)
    expect(starsForCombo(10)).toBe(3)
  })
})
