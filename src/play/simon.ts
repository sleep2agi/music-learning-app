/** One octave of white keys, C4 through A4. Short and easy to see on a phone. */
export const SIMON_POOL = [60, 62, 64, 65, 67, 69] as const

export function extendSequence(sequence: readonly number[], rng: () => number, pool: readonly number[] = SIMON_POOL): number[] {
  if (pool.length === 0) return [...sequence]
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  const next = pool[index] ?? pool[0]
  return [...sequence, next]
}

export function judgePress(sequence: readonly number[], progress: number, midi: number): 'continue' | 'complete' | 'miss' {
  if (sequence[progress] !== midi) return 'miss'
  if (progress + 1 >= sequence.length) return 'complete'
  return 'continue'
}
