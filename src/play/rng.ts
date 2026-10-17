import { createRng } from '../theory/quiz.ts'

let salt = 0x51ed_15ed

/** A new generator for one play session. Not used for graded tests. */
export function gameRng(): () => number {
  salt = (Math.imul(salt, 1664525) + 1013904223) >>> 0
  return createRng(salt || 1)
}
