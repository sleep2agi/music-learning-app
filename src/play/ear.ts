import { CHORD_QUALITY_LABEL, chordMidis, type ChordQuality } from '../theory/chords.ts'
import { INTERVALS } from '../theory/intervals.ts'
import { pitchClassName } from '../theory/notes.ts'

export type EarKind = 'note' | 'interval' | 'chord'

export interface EarChoice {
  id: string
  label: string
}

export interface EarRound {
  kind: EarKind
  midis: number[]
  playback: 'note' | 'sequence' | 'chord'
  answerId: string
  choices: EarChoice[]
}

const NOTE_MIDIS = [60, 62, 64, 65, 67, 69, 71] as const
const EAR_INTERVALS = INTERVALS.filter((item) => [2, 3, 4, 5, 7, 12].includes(item.semitones))
const EAR_ROOTS = [60, 62, 64, 65, 67] as const
const EAR_QUALITIES = ['major', 'minor', 'diminished'] as const satisfies readonly ChordQuality[]
const CHORD_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A'] as const

function pickIndex(rng: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(rng() * length))
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.floor(rng() * (index + 1)))
    const current = copy[index]
    copy[index] = copy[swap] as T
    copy[swap] = current as T
  }
  return copy
}

function sampleChoices(all: readonly EarChoice[], count: number, rng: () => number, requiredId: string): EarChoice[] {
  const required = all.find((item) => item.id === requiredId)
  if (!required) throw new Error(`Missing ear choice ${requiredId}`)
  const pool = all.filter((item) => item.id !== requiredId)
  const picked = [required]
  while (picked.length < count && pool.length > 0) {
    const index = pickIndex(rng, pool.length)
    const removed = pool.splice(index, 1)
    const item = removed[0]
    if (item) picked.push(item)
  }
  return shuffle(picked, rng)
}

export function buildEarRound(kind: EarKind, rng: () => number): EarRound {
  if (kind === 'note') {
    const midi = NOTE_MIDIS[pickIndex(rng, NOTE_MIDIS.length)] ?? 60
    const choices = NOTE_MIDIS.map((value) => ({ id: String(value), label: pitchClassName(value) }))
    return {
      kind,
      midis: [midi],
      playback: 'note',
      answerId: String(midi),
      choices: sampleChoices(choices, 4, rng, String(midi)),
    }
  }

  if (kind === 'interval') {
    const interval = EAR_INTERVALS[pickIndex(rng, EAR_INTERVALS.length)] ?? EAR_INTERVALS[0]
    if (!interval) throw new Error('No ear intervals')
    const root = EAR_ROOTS[pickIndex(rng, EAR_ROOTS.length)] ?? 60
    const choices = EAR_INTERVALS.map((item) => ({ id: item.id, label: item.name }))
    return {
      kind,
      midis: [root, root + interval.semitones],
      playback: 'sequence',
      answerId: interval.id,
      choices: sampleChoices(choices, 4, rng, interval.id),
    }
  }

  const quality = EAR_QUALITIES[pickIndex(rng, EAR_QUALITIES.length)] ?? 'major'
  const rootName = CHORD_ROOTS[pickIndex(rng, CHORD_ROOTS.length)] ?? 'C'
  const choices = shuffle(
    EAR_QUALITIES.map((item) => ({ id: item, label: CHORD_QUALITY_LABEL[item] })),
    rng,
  )
  return {
    kind,
    midis: chordMidis(rootName, quality, 4),
    playback: 'chord',
    answerId: quality,
    choices,
  }
}

export function isEarCorrect(round: EarRound, choiceId: string): boolean {
  return round.answerId === choiceId
}
