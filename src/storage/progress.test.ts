import { describe, expect, it } from 'vitest'
import { emptyProgress, loadProgress, normalizeProgress, saveProgress, type KeyValueStore } from './progress.ts'

function memoryStore(initial: string | null = null): KeyValueStore & { snapshot(): string | null } {
  let value = initial
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next
    },
    snapshot: () => value,
  }
}

describe('local progress', () => {
  it('returns an empty record when nothing is stored', () => {
    expect(loadProgress(memoryStore())).toEqual(emptyProgress())
  })

  it('drops corrupt fields and keeps valid lesson ids', () => {
    const store = memoryStore(
      JSON.stringify({
        completedLessonIds: ['notes', 'notes', 3, 'scales'],
        quizAnswered: 4.8,
        quizCorrect: 9,
      }),
    )
    expect(loadProgress(store)).toEqual({
      completedLessonIds: ['notes', 'scales'],
      quizAnswered: 4,
      quizCorrect: 4,
    })
  })

  it('round-trips through the store', () => {
    const store = memoryStore()
    saveProgress({ completedLessonIds: ['chords'], quizAnswered: 2, quizCorrect: 1 }, store)
    expect(loadProgress(store)).toEqual({
      completedLessonIds: ['chords'],
      quizAnswered: 2,
      quizCorrect: 1,
    })
  })

  it('ignores invalid JSON', () => {
    expect(loadProgress(memoryStore('{'))).toEqual(emptyProgress())
    expect(normalizeProgress(null)).toEqual(emptyProgress())
  })
})
