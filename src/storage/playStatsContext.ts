import { createContext } from 'react'
import type { PlayEvent, PlayStats } from '../play/stats.ts'

export interface PlayStatsApi {
  stats: PlayStats
  freshBadges: string[]
  record: (event: PlayEvent) => void
}

export const PlayStatsContext = createContext<PlayStatsApi | null>(null)
