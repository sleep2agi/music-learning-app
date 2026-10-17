import { useEffect, useRef, useState, type ReactNode } from 'react'
import { applyPlayEvent, badgeTitle, loadPlayStats, recordVisit, savePlayStats, type PlayEvent, type PlayStats } from '../play/stats.ts'
import { PlayStatsContext } from './playStatsContext.ts'

export function PlayStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<PlayStats>(() => {
    const next = recordVisit(loadPlayStats(), new Date())
    savePlayStats(next)
    return next
  })
  const [freshBadges, setFreshBadges] = useState<string[]>([])
  const statsRef = useRef(stats)
  const toastTimer = useRef<number | null>(null)

  useEffect(() => {
    statsRef.current = stats
  }, [stats])

  function record(event: PlayEvent) {
    const next = applyPlayEvent(statsRef.current, event)
    const gained = next.badges.filter((id) => !statsRef.current.badges.includes(id))
    statsRef.current = next
    savePlayStats(next)
    setStats(next)
    if (gained.length === 0) return
    setFreshBadges(gained)
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setFreshBadges([]), 2200)
  }

  return (
    <PlayStatsContext.Provider value={{ stats, freshBadges, record }}>
      {children}
      {freshBadges.length > 0 && (
        <div className="toast" role="status">
          新徽章 {freshBadges.map((id) => badgeTitle(id)).join('、')}
        </div>
      )}
    </PlayStatsContext.Provider>
  )
}
