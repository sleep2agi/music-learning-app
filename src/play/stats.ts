export const PLAY_STATS_KEY = 'yuexi.play.v1'

export interface PlayStats {
  lastDay: string | null
  streak: number
  bestCombo: number
  earCorrect: number
  simonBest: number
  guitarHits: number
  badges: string[]
}

export interface BadgeDef {
  id: string
  title: string
  detail: string
  mark: string
}

export const BADGE_DEFS: readonly BadgeDef[] = [
  { id: 'first-ear', title: '第一声', detail: '听辨答对 1 题', mark: '♪' },
  { id: 'combo-3', title: '三连击', detail: '连续答对 3 次', mark: '3' },
  { id: 'combo-7', title: '七连击', detail: '连续答对 7 次', mark: '7' },
  { id: 'ear-10', title: '顺耳', detail: '听辨累计答对 10 题', mark: '耳' },
  { id: 'simon-5', title: '跟灯五级', detail: '跟灯序列达到 5', mark: '灯' },
  { id: 'guitar-10', title: '指尖', detail: '吉他挑战命中 10 次', mark: '弦' },
  { id: 'streak-3', title: '三日火', detail: '连续 3 天来玩', mark: '火' },
  { id: 'stars-3', title: '三颗星', detail: '连击点亮 3 颗星', mark: '★' },
]

export type PlayEvent =
  | { type: 'correct'; combo: number }
  | { type: 'simon'; length: number }
  | { type: 'guitar'; combo: number }

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function emptyPlayStats(): PlayStats {
  return {
    lastDay: null,
    streak: 0,
    bestCombo: 0,
    earCorrect: 0,
    simonBest: 0,
    guitarHits: 0,
    badges: [],
  }
}

export function formatDay(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDay(day: string, delta: number): string {
  const [year, month, date] = day.split('-').map((part) => Number(part))
  const next = new Date(year || 1970, (month || 1) - 1, date || 1)
  next.setDate(next.getDate() + delta)
  return formatDay(next)
}

function finiteCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export function badgeIdsFor(stats: Pick<PlayStats, 'bestCombo' | 'earCorrect' | 'simonBest' | 'guitarHits' | 'streak'>): string[] {
  const ids: string[] = []
  if (stats.earCorrect >= 1) ids.push('first-ear')
  if (stats.bestCombo >= 3) ids.push('combo-3')
  if (stats.bestCombo >= 7) ids.push('combo-7')
  if (stats.earCorrect >= 10) ids.push('ear-10')
  if (stats.simonBest >= 5) ids.push('simon-5')
  if (stats.guitarHits >= 10) ids.push('guitar-10')
  if (stats.streak >= 3) ids.push('streak-3')
  if (stats.bestCombo >= 10) ids.push('stars-3')
  return ids
}

export function withBadges(stats: PlayStats): PlayStats {
  const badges = badgeIdsFor(stats)
  const same = badges.length === stats.badges.length && badges.every((id, index) => id === stats.badges[index])
  return same ? stats : { ...stats, badges }
}

export function normalizePlayStats(value: unknown): PlayStats {
  if (!value || typeof value !== 'object') return emptyPlayStats()
  const record = value as Record<string, unknown>
  const lastDay = typeof record.lastDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.lastDay) ? record.lastDay : null
  return withBadges({
    lastDay,
    streak: finiteCount(record.streak),
    bestCombo: finiteCount(record.bestCombo),
    earCorrect: finiteCount(record.earCorrect),
    simonBest: finiteCount(record.simonBest),
    guitarHits: finiteCount(record.guitarHits),
    badges: [],
  })
}

export function recordVisit(stats: PlayStats, now: Date): PlayStats {
  const today = formatDay(now)
  if (stats.lastDay === today) return stats
  const streak = stats.lastDay === shiftDay(today, -1) ? stats.streak + 1 : 1
  return withBadges({ ...stats, lastDay: today, streak })
}

export function applyPlayEvent(stats: PlayStats, event: PlayEvent): PlayStats {
  if (event.type === 'correct') {
    return withBadges({
      ...stats,
      earCorrect: stats.earCorrect + 1,
      bestCombo: Math.max(stats.bestCombo, event.combo),
    })
  }
  if (event.type === 'simon') {
    return withBadges({ ...stats, simonBest: Math.max(stats.simonBest, event.length) })
  }
  return withBadges({
    ...stats,
    guitarHits: stats.guitarHits + 1,
    bestCombo: Math.max(stats.bestCombo, event.combo),
  })
}

export function loadPlayStats(store: KeyValueStore = localStorage): PlayStats {
  try {
    const raw = store.getItem(PLAY_STATS_KEY)
    if (!raw) return emptyPlayStats()
    return normalizePlayStats(JSON.parse(raw))
  } catch {
    return emptyPlayStats()
  }
}

export function savePlayStats(stats: PlayStats, store: KeyValueStore = localStorage): void {
  store.setItem(PLAY_STATS_KEY, JSON.stringify(withBadges(stats)))
}

export function badgeTitle(id: string): string {
  return BADGE_DEFS.find((badge) => badge.id === id)?.title ?? id
}
