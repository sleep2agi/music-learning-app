import { useEffect, useState } from 'react'
import { emptyProgress, loadProgress, saveProgress, type LearningProgress } from './progress.ts'

export function useProgress() {
  const [progress, setProgress] = useState<LearningProgress>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  function toggleLesson(id: string) {
    setProgress((current) => {
      const has = current.completedLessonIds.includes(id)
      return {
        ...current,
        completedLessonIds: has
          ? current.completedLessonIds.filter((item) => item !== id)
          : [...current.completedLessonIds, id],
      }
    })
  }

  function recordAnswer(correct: boolean) {
    setProgress((current) => ({
      ...current,
      quizAnswered: current.quizAnswered + 1,
      quizCorrect: current.quizCorrect + (correct ? 1 : 0),
    }))
  }

  function reset() {
    setProgress(emptyProgress())
  }

  return { progress, toggleLesson, recordAnswer, reset }
}
