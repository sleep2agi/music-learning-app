import { useRef, useState } from 'react'
import { playChord, playSequence, playTone, unlockAudio, type Timbre } from './synth.ts'

export function useSound() {
  const [sounding, setSounding] = useState<number[]>([])
  const [last, setLast] = useState<number[]>([])
  const timer = useRef<number | null>(null)

  function scheduleClear(ms: number) {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setSounding([]), ms)
  }

  function remember(midis: readonly number[]) {
    const notes = [...midis]
    setSounding(notes)
    setLast(notes)
  }

  function tone(midi: number, timbre: Timbre) {
    unlockAudio()
    remember([midi])
    scheduleClear(780)
    playTone(midi, { timbre, duration: timbre === 'guitar' ? 1.15 : 0.9 })
  }

  function chord(midis: readonly number[], timbre: Timbre) {
    unlockAudio()
    remember(midis)
    scheduleClear(1300)
    playChord(midis, timbre)
  }

  function sequence(midis: readonly number[], timbre: Timbre, gap = 0.34) {
    unlockAudio()
    remember(midis)
    scheduleClear(midis.length * gap * 1000 + 700)
    playSequence(midis, gap, timbre)
  }

  return { sounding, last, tone, chord, sequence }
}
