import { describe, expect, it } from 'vitest'
import { applyPlayEvent, emptyPlayStats, loadPlayStats, normalizePlayStats, recordVisit, savePlayStats, shiftDay } from './stats.ts'
import type { KeyValueStore } from './stats.ts'

function memoryStore(): KeyValueStore & { raw: Map<string, string> } {
  const raw = new Map<string, string>()
  return {
    raw,
    getItem: (key) => raw.get(key) ?? null,
    setItem: (key, value) => {
      raw.set(key, value)
    },
  }
}

describe('play stats', () => {
  it('shifts calendar days across month boundaries', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDay('2024-03-01', -1)).toBe('2024-02-29')
  })

  it('starts a streak, continues it, and resets after a gap', () => {
    const first = recordVisit(emptyPlayStats(), new Date(2026, 9, 17))
    expect(first).toMatchObject({ lastDay: '2026-10-17', streak: 1 })
    expect(recordVisit(first, new Date(2026, 9, 17))).toBe(first)
    const second = recordVisit(first, new Date(2026, 9, 18))
    expect(second.streak).toBe(2)
    const gap = recordVisit(second, new Date(2026, 9, 20))
    expect(gap.streak).toBe(1)
  })

  it('unlocks badges from ear, simon, guitar and streak events', () => {
    let stats = recordVisit(emptyPlayStats(), new Date(2026, 9, 1))
    stats = recordVisit(stats, new Date(2026, 9, 2))
    stats = recordVisit(stats, new Date(2026, 9, 3))
    expect(stats.badges).toContain('streak-3')
    stats = applyPlayEvent(stats, { type: 'correct', combo: 10 })
    for (let count = 0; count < 9; count += 1) stats = applyPlayEvent(stats, { type: 'correct', combo: 1 })
    stats = applyPlayEvent(stats, { type: 'simon', length: 5 })
    for (let count = 0; count < 10; count += 1) stats = applyPlayEvent(stats, { type: 'guitar', combo: 2 })
    expect(stats.badges).toEqual([
      'first-ear',
      'combo-3',
      'combo-7',
      'ear-10',
      'simon-5',
      'guitar-10',
      'streak-3',
      'stars-3',
    ])
  })

  it('drops broken saved data and rewrites badges', () => {
    expect(normalizePlayStats({ lastDay: 'nope', streak: -3, earCorrect: 4.8 })).toMatchObject({
      lastDay: null,
      streak: 0,
      earCorrect: 4,
    })
    const store = memoryStore()
    savePlayStats({ ...emptyPlayStats(), bestCombo: 3, badges: [] }, store)
    expect(loadPlayStats(store).badges).toEqual(['combo-3'])
    store.setItem('yuexi.play.v1', '{')
    expect(loadPlayStats(store)).toEqual(emptyPlayStats())
  })
})
