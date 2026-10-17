import { chordLabel, chordMidis, spellChord, type ChordQuality } from './chords.ts'
import { describeSemitones, INTERVALS } from './intervals.ts'
import { midiToName, parseNoteName } from './notes.ts'

export type QuizKind = 'interval' | 'chord'

export interface QuizQuestion {
  kind: QuizKind
  prompt: string
  hint: string
  explain: string
  choices: string[]
  answerIndex: number
  midis: number[]
  playback: 'sequence' | 'chord'
}

const NATURAL_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const QUIZ_INTERVALS = INTERVALS.filter((interval) => interval.semitones >= 1)
const CHORD_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'F#'] as const
const QUIZ_QUALITIES = ['major', 'minor', 'diminished', 'dom7'] as const satisfies readonly ChordQuality[]

export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildQuiz(seed: number, count = 6): QuizQuestion[] {
  const rng = createRng(seed)
  return Array.from({ length: count }, (_, index) =>
    index % 2 === 0 ? makeIntervalQuestion(rng) : makeChordQuestion(rng),
  )
}

function makeIntervalQuestion(rng: () => number): QuizQuestion {
  const from = parseNoteName(pick(rng, NATURAL_ROOTS))
  const interval = pick(rng, QUIZ_INTERVALS)
  const fromMidi = 60 + from.pitchClass
  const toMidi = fromMidi + interval.semitones
  const fromName = midiToName(fromMidi)
  const toName = midiToName(toMidi, prefersFlat(interval.semitones))
  const answer = describeSemitones(interval.semitones).name
  const distractors = shuffle(
    rng,
    QUIZ_INTERVALS.map((item) => item.name).filter((name) => name !== answer),
  ).slice(0, 3)
  const choices = shuffle(rng, [answer, ...distractors])
  return {
    kind: 'interval',
    prompt: '这两个音是什么音程？',
    hint: `${fromName} → ${toName}`,
    explain: `${fromName} 到 ${toName} 相距 ${interval.semitones} 个半音，是${answer}。`,
    choices,
    answerIndex: choices.indexOf(answer),
    midis: [fromMidi, toMidi],
    playback: 'sequence',
  }
}

function makeChordQuestion(rng: () => number): QuizQuestion {
  const root = pick(rng, CHORD_ROOTS)
  const quality = pick(rng, QUIZ_QUALITIES)
  const spelled = spellChord(root, quality)
  const answer = chordLabel(root, quality)
  const choices = shuffle(
    rng,
    QUIZ_QUALITIES.map((item) => chordLabel(root, item)),
  )
  return {
    kind: 'chord',
    prompt: '这些音组成什么和弦？',
    hint: spelled.join('、'),
    explain: `${answer}的组成音是 ${spelled.join('、')}。`,
    choices,
    answerIndex: choices.indexOf(answer),
    midis: chordMidis(root, quality, 4),
    playback: 'chord',
  }
}

function prefersFlat(semitones: number): boolean {
  return semitones === 1 || semitones === 3 || semitones === 8 || semitones === 10
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) throw new Error('Cannot pick from an empty list')
  return item
}

function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swap] as T
    copy[swap] = current as T
  }
  return copy
}
