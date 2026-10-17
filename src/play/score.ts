export interface RunScore {
  points: number
  combo: number
  bestCombo: number
  correct: number
  answered: number
}

export function emptyRun(): RunScore {
  return { points: 0, combo: 0, bestCombo: 0, correct: 0, answered: 0 }
}

/** Stars light up as a combo grows: 3, 6, then 10 correct answers in a row. */
export function starsForCombo(combo: number): number {
  if (combo >= 10) return 3
  if (combo >= 6) return 2
  if (combo >= 3) return 1
  return 0
}

export function applyAnswer(run: RunScore, correct: boolean): RunScore {
  if (!correct) {
    return { ...run, combo: 0, answered: run.answered + 1 }
  }
  const combo = run.combo + 1
  return {
    points: run.points + 10 * Math.min(combo, 8),
    combo,
    bestCombo: Math.max(run.bestCombo, combo),
    correct: run.correct + 1,
    answered: run.answered + 1,
  }
}
