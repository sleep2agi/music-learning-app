import { mod12 } from './notes.ts'

export interface Interval {
  semitones: number
  id: string
  name: string
  shortName: string
}

export const INTERVALS: readonly Interval[] = [
  { semitones: 0, id: 'P1', name: '纯一度', shortName: 'P1' },
  { semitones: 1, id: 'm2', name: '小二度', shortName: 'm2' },
  { semitones: 2, id: 'M2', name: '大二度', shortName: 'M2' },
  { semitones: 3, id: 'm3', name: '小三度', shortName: 'm3' },
  { semitones: 4, id: 'M3', name: '大三度', shortName: 'M3' },
  { semitones: 5, id: 'P4', name: '纯四度', shortName: 'P4' },
  { semitones: 6, id: 'TT', name: '三全音', shortName: 'TT' },
  { semitones: 7, id: 'P5', name: '纯五度', shortName: 'P5' },
  { semitones: 8, id: 'm6', name: '小六度', shortName: 'm6' },
  { semitones: 9, id: 'M6', name: '大六度', shortName: 'M6' },
  { semitones: 10, id: 'm7', name: '小七度', shortName: 'm7' },
  { semitones: 11, id: 'M7', name: '大七度', shortName: 'M7' },
  { semitones: 12, id: 'P8', name: '纯八度', shortName: 'P8' },
]

export function describeSemitones(semitones: number): Interval {
  const distance = Math.abs(semitones)
  if (distance === 0) return intervalBySemitones(0)
  if (distance % 12 === 0) return intervalBySemitones(12)
  return intervalBySemitones(distance % 12)
}

export function intervalBetweenPitchClasses(from: number, to: number): Interval {
  return describeSemitones(mod12(to - from))
}

function intervalBySemitones(semitones: number): Interval {
  const found = INTERVALS.find((interval) => interval.semitones === semitones)
  if (!found) throw new Error(`No interval for ${semitones} semitones`)
  return found
}
