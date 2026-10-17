import { midiToFreq } from '../theory/notes.ts'

export type Timbre = 'piano' | 'guitar' | 'pure'

export interface PlayOptions {
  timbre?: Timbre
  duration?: number
  when?: number
  gain?: number
}

let context: AudioContext | null = null
let unlocked = false

function getContext(): AudioContext {
  if (!context) context = new AudioContext()
  return context
}

/** Start audio inside a user gesture. iOS Safari and WKWebView ignore later notes until this runs. */
export function unlockAudio(): void {
  const ctx = getContext()
  if (ctx.state === 'suspended') void ctx.resume()
  if (unlocked) return
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start()
  unlocked = true
}

export async function resumeAudio(): Promise<void> {
  unlockAudio()
  const ctx = getContext()
  if (ctx.state === 'suspended') await ctx.resume()
}

export function playTone(midi: number, options: PlayOptions = {}): void {
  const ctx = getContext()
  const start = Math.max(ctx.currentTime, options.when ?? ctx.currentTime)
  const timbre = options.timbre ?? 'pure'
  const duration = Math.max(options.duration ?? 0.85, 0.2)
  const peak = options.gain ?? (timbre === 'guitar' ? 0.22 : timbre === 'piano' ? 0.24 : 0.18)
  const freq = midiToFreq(midi)
  const releaseAt = start + duration

  const oscA = ctx.createOscillator()
  const oscB = ctx.createOscillator()
  const mixB = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  const amp = ctx.createGain()

  oscA.frequency.setValueAtTime(freq, start)
  oscB.frequency.setValueAtTime(freq, start)
  filter.type = 'lowpass'

  if (timbre === 'guitar') {
    oscA.type = 'triangle'
    oscB.type = 'sawtooth'
    oscB.detune.setValueAtTime(8, start)
    mixB.gain.setValueAtTime(0.08, start)
    filter.frequency.setValueAtTime(2400, start)
    filter.frequency.exponentialRampToValueAtTime(480, releaseAt)
    filter.Q.setValueAtTime(0.7, start)
  } else if (timbre === 'piano') {
    oscA.type = 'triangle'
    oscB.type = 'sine'
    oscB.frequency.setValueAtTime(freq * 2, start)
    mixB.gain.setValueAtTime(0.18, start)
    filter.frequency.setValueAtTime(3200, start)
    filter.frequency.exponentialRampToValueAtTime(900, releaseAt)
    filter.Q.setValueAtTime(0.4, start)
  } else {
    oscA.type = 'sine'
    oscB.type = 'triangle'
    oscB.detune.setValueAtTime(4, start)
    mixB.gain.setValueAtTime(0.12, start)
    filter.frequency.setValueAtTime(2800, start)
    filter.Q.setValueAtTime(0.2, start)
  }

  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, releaseAt)

  oscA.connect(filter)
  oscB.connect(mixB)
  mixB.connect(filter)
  filter.connect(amp)
  amp.connect(ctx.destination)

  oscA.start(start)
  oscB.start(start)
  const stopAt = releaseAt + 0.05
  oscA.stop(stopAt)
  oscB.stop(stopAt)
  oscA.onended = () => {
    oscA.disconnect()
    oscB.disconnect()
    mixB.disconnect()
    filter.disconnect()
    amp.disconnect()
  }
}

export function playChord(midis: readonly number[], timbre: Timbre = 'piano'): void {
  const start = getContext().currentTime
  const gain = timbre === 'guitar' ? 0.11 : 0.15
  midis.forEach((midi, index) => {
    playTone(midi, { timbre, when: start + index * 0.028, duration: 1.35, gain })
  })
}

export function playSequence(midis: readonly number[], gapSeconds: number, timbre: Timbre = 'pure'): void {
  const start = getContext().currentTime
  midis.forEach((midi, index) => {
    playTone(midi, {
      timbre,
      when: start + index * gapSeconds,
      duration: Math.max(0.45, gapSeconds + 0.28),
      gain: 0.2,
    })
  })
}
