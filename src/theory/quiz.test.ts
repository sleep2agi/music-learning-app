import { describe, expect, it } from 'vitest'
import { chordMatchesLabel, identifyChord } from './chords.ts'
import { describeSemitones } from './intervals.ts'
import { buildQuiz } from './quiz.ts'

describe('quiz builder', () => {
  it('is deterministic for a seed', () => {
    expect(buildQuiz(7, 6)).toEqual(buildQuiz(7, 6))
  })

  it('asks interval and chord questions whose answers match the theory helpers', () => {
    for (const seed of [1, 2, 42, 99, 2026]) {
      const questions = buildQuiz(seed, 8)
      expect(questions.map((question) => question.kind)).toEqual([
        'interval',
        'chord',
        'interval',
        'chord',
        'interval',
        'chord',
        'interval',
        'chord',
      ])
      for (const question of questions) {
        expect(question.choices).toHaveLength(4)
        expect(new Set(question.choices).size).toBe(4)
        expect(question.answerIndex).toBeGreaterThanOrEqual(0)
        expect(question.answerIndex).toBeLessThan(4)
        const answer = question.choices[question.answerIndex]
        if (question.kind === 'interval') {
          const [from, to] = question.midis
          expect(from).toBeTypeOf('number')
          expect(to).toBeTypeOf('number')
          expect(answer).toBe(describeSemitones(Math.abs((to ?? 0) - (from ?? 0))).name)
          expect(question.playback).toBe('sequence')
        } else {
          const identified = identifyChord(question.midis)
          expect(identified).not.toBeNull()
          expect(chordMatchesLabel(answer ?? '', identified?.rootPc ?? -1, identified?.quality ?? 'major')).toBe(true)
          expect(question.playback).toBe('chord')
          expect(question.hint.length).toBeGreaterThan(0)
        }
      }
    }
  })
})
