export interface LearningProgress {
  completedLessonIds: string[]
  quizAnswered: number
  quizCorrect: number
}

export const PROGRESS_STORAGE_KEY = 'yuexi.progress.v1'

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function emptyProgress(): LearningProgress {
  return { completedLessonIds: [], quizAnswered: 0, quizCorrect: 0 }
}

export function normalizeProgress(value: unknown): LearningProgress {
  if (!value || typeof value !== 'object') return emptyProgress()
  const record = value as Record<string, unknown>
  const ids = Array.isArray(record.completedLessonIds)
    ? [...new Set(record.completedLessonIds.filter((id): id is string => typeof id === 'string'))]
    : []
  const quizAnswered =
    typeof record.quizAnswered === 'number' && Number.isFinite(record.quizAnswered)
      ? Math.max(0, Math.floor(record.quizAnswered))
      : 0
  const quizCorrectRaw =
    typeof record.quizCorrect === 'number' && Number.isFinite(record.quizCorrect)
      ? Math.max(0, Math.floor(record.quizCorrect))
      : 0
  return {
    completedLessonIds: ids,
    quizAnswered,
    quizCorrect: Math.min(quizCorrectRaw, quizAnswered),
  }
}

export function loadProgress(store: KeyValueStore = localStorage): LearningProgress {
  try {
    const raw = store.getItem(PROGRESS_STORAGE_KEY)
    if (!raw) return emptyProgress()
    return normalizeProgress(JSON.parse(raw))
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: LearningProgress, store: KeyValueStore = localStorage): void {
  store.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalizeProgress(progress)))
}
