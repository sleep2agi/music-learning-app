import { useContext } from 'react'
import { PlayStatsContext, type PlayStatsApi } from './playStatsContext.ts'

export function usePlayStats(): PlayStatsApi {
  const value = useContext(PlayStatsContext)
  if (!value) throw new Error('Play stats are unavailable')
  return value
}
