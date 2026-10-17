import { LETTERS, mod12, parseNoteName, spellOnLetter } from './notes.ts'

export type ScaleType = 'major' | 'naturalMinor'

export const SCALE_PATTERNS: Record<ScaleType, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
}

export const SCALE_LABEL: Record<ScaleType, string> = {
  major: '大调',
  naturalMinor: '自然小调',
}

export const SCALE_FORMULA: Record<ScaleType, string> = {
  major: '全、全、半、全、全、全、半',
  naturalMinor: '全、半、全、全、半、全、全',
}

export const DEGREE_NAMES: Record<ScaleType, readonly string[]> = {
  major: ['主音', '上主音', '中音', '下属音', '属音', '下中音', '导音'],
  naturalMinor: ['主音', '上主音', '中音', '下属音', '属音', '下中音', '下主音'],
}

export const ROOT_OPTIONS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

export function scalePitchClasses(rootPc: number, type: ScaleType): number[] {
  return SCALE_PATTERNS[type].map((semi) => mod12(rootPc + semi))
}

export function spellScale(rootName: string, type: ScaleType): string[] {
  const root = parseNoteName(rootName)
  const rootIndex = LETTERS.indexOf(root.letter)
  return SCALE_PATTERNS[type].map((semi, degree) => {
    const letter = LETTERS[(rootIndex + degree) % LETTERS.length]
    if (!letter) throw new Error('Missing scale letter')
    return spellOnLetter(root.pitchClass + semi, letter).name
  })
}

export function scaleTitle(rootName: string, type: ScaleType): string {
  const root = parseNoteName(rootName)
  return `${root.name} ${SCALE_LABEL[type]}`
}

export function scaleMidis(rootName: string, type: ScaleType, octave = 4): number[] {
  const rootMidi = (octave + 1) * 12 + parseNoteName(rootName).pitchClass
  return [...SCALE_PATTERNS[type].map((semi) => rootMidi + semi), rootMidi + 12]
}
