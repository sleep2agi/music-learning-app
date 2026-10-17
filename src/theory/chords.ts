import { LETTERS, mod12, parseNoteName, spellOnLetter } from './notes.ts'

export const CHORD_QUALITIES = ['major', 'minor', 'diminished', 'augmented', 'dom7', 'maj7', 'min7'] as const
export type ChordQuality = (typeof CHORD_QUALITIES)[number]

export const CHORD_INTERVALS: Record<ChordQuality, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
}

const LETTER_STEPS: Record<ChordQuality, readonly number[]> = {
  major: [0, 2, 4],
  minor: [0, 2, 4],
  diminished: [0, 2, 4],
  augmented: [0, 2, 4],
  dom7: [0, 2, 4, 6],
  maj7: [0, 2, 4, 6],
  min7: [0, 2, 4, 6],
}

export const CHORD_QUALITY_LABEL: Record<ChordQuality, string> = {
  major: '大三和弦',
  minor: '小三和弦',
  diminished: '减三和弦',
  augmented: '增三和弦',
  dom7: '属七和弦',
  maj7: '大七和弦',
  min7: '小七和弦',
}

export const CHORD_SYMBOL_SUFFIX: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  dom7: '7',
  maj7: 'maj7',
  min7: 'm7',
}

export function chordPitchClasses(rootPc: number, quality: ChordQuality): number[] {
  return CHORD_INTERVALS[quality].map((semi) => mod12(rootPc + semi))
}

export function spellChord(rootName: string, quality: ChordQuality): string[] {
  const root = parseNoteName(rootName)
  const rootIndex = LETTERS.indexOf(root.letter)
  return CHORD_INTERVALS[quality].map((semi, index) => {
    const step = LETTER_STEPS[quality][index]
    if (step === undefined) throw new Error('Missing chord degree')
    const letter = LETTERS[(rootIndex + step) % LETTERS.length]
    if (!letter) throw new Error('Missing chord letter')
    return spellOnLetter(root.pitchClass + semi, letter).name
  })
}

export function chordSymbol(rootName: string, quality: ChordQuality): string {
  return `${parseNoteName(rootName).name}${CHORD_SYMBOL_SUFFIX[quality]}`
}

export function chordLabel(rootName: string, quality: ChordQuality): string {
  return `${chordSymbol(rootName, quality)} ${CHORD_QUALITY_LABEL[quality]}`
}

export function chordMidis(rootName: string, quality: ChordQuality, octave = 4): number[] {
  const rootMidi = (octave + 1) * 12 + parseNoteName(rootName).pitchClass
  return CHORD_INTERVALS[quality].map((semi) => rootMidi + semi)
}

export interface IdentifiedChord {
  rootPc: number
  quality: ChordQuality
}

export function identifyChord(pitchClasses: readonly number[]): IdentifiedChord | null {
  const unique = [...new Set(pitchClasses.map((pc) => mod12(pc)))].sort((a, b) => a - b)
  for (const quality of CHORD_QUALITIES) {
    const pattern = CHORD_INTERVALS[quality]
    if (pattern.length !== unique.length) continue
    for (const rootPc of unique) {
      const expected = pattern.map((semi) => mod12(rootPc + semi)).sort((a, b) => a - b)
      if (expected.every((pc, index) => pc === unique[index])) return { rootPc, quality }
    }
  }
  return null
}

export function chordMatchesLabel(label: string, rootPc: number, quality: ChordQuality): boolean {
  const tail = ` ${CHORD_QUALITY_LABEL[quality]}`
  if (!label.endsWith(tail)) return false
  const symbol = label.slice(0, -tail.length)
  const suffix = CHORD_SYMBOL_SUFFIX[quality]
  if (!symbol.endsWith(suffix)) return false
  const rootPart = symbol.slice(0, symbol.length - suffix.length)
  try {
    return parseNoteName(rootPart).pitchClass === mod12(rootPc)
  } catch {
    return false
  }
}
