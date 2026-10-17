import { useEffect, useRef, useState } from 'react'
import { playCheer, playOops, playTone, unlockAudio } from '../audio/synth.ts'
import { gameRng } from '../play/rng.ts'
import { extendSequence, judgePress } from '../play/simon.ts'
import { usePlayStats } from '../storage/usePlayStats.ts'
import { Burst } from './Burst.tsx'
import { PianoKeyboard } from './PianoKeyboard.tsx'

type Phase = 'idle' | 'showing' | 'input' | 'lose'

export function SimonGame() {
  const { record, stats } = usePlayStats()
  const [sequence, setSequence] = useState<number[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [cursor, setCursor] = useState(0)
  const [flash, setFlash] = useState<number | null>(null)
  const [burst, setBurst] = useState(0)
  const [roundBest, setRoundBest] = useState(0)
  const token = useRef(0)
  const rng = useRef<(() => number) | null>(null)

  useEffect(() => () => {
    token.current += 1
  }, [])

  function show(notes: number[], id: number) {
    notes.forEach((midi, index) => {
      window.setTimeout(() => {
        if (token.current !== id) return
        setFlash(midi)
        playTone(midi, { timbre: 'piano', duration: 0.55, gain: 0.22 })
        window.setTimeout(() => {
          if (token.current !== id) return
          setFlash(null)
          if (index === notes.length - 1) {
            setCursor(0)
            setPhase('input')
          }
        }, 700)
      }, index * 900)
    })
  }

  function roll(): () => number {
    if (!rng.current) rng.current = gameRng()
    return rng.current
  }

  function launch(notes: number[]) {
    const id = token.current + 1
    token.current = id
    setSequence(notes)
    setPhase('showing')
    setCursor(0)
    setFlash(null)
    window.setTimeout(() => show(notes, id), 280)
  }

  function start() {
    unlockAudio()
    setRoundBest(0)
    launch(extendSequence([], roll()))
  }

  function onKey(midi: number) {
    unlockAudio()
    if (phase !== 'input') {
      if (phase !== 'showing') playTone(midi, { timbre: 'piano', duration: 0.35 })
      return
    }
    setFlash(midi)
    const result = judgePress(sequence, cursor, midi)
    if (result === 'miss') {
      playOops()
      token.current += 1
      setPhase('lose')
      return
    }
    playTone(midi, { timbre: 'piano', duration: 0.28 })
    if (result === 'continue') {
      setCursor(cursor + 1)
      return
    }
    playCheer()
    setBurst((value) => value + 1)
    const cleared = sequence.length
    setRoundBest((current) => Math.max(current, cleared))
    record({ type: 'simon', length: cleared })
    launch(extendSequence(sequence, roll()))
  }

  const status =
    phase === 'showing'
      ? '看灯，先别按'
      : phase === 'input'
        ? `轮到你了 · ${cursor}/${sequence.length}`
        : phase === 'lose'
          ? `停在 ${sequence.length} 个音`
          : '灯亮到哪，就弹到哪'

  return (
    <section className="card play-card" data-expect={phase === 'input' ? String(sequence[cursor] ?? '') : ''}>
      <Burst tick={burst} />
      <div className="play-toolbar">
        <div>
          <h2>跟灯</h2>
          <p>{status}</p>
        </div>
        <div className="play-score">
          <strong>{sequence.length || 1}</strong>
          <span>本局 {roundBest || 0}</span>
          <span>纪录 {Math.max(stats.simonBest, roundBest)}</span>
        </div>
      </div>
      {phase === 'idle' || phase === 'lose' ? (
        <button type="button" className="primary play-start" onClick={start}>
          {phase === 'lose' ? '再来一局' : '开始跟灯'}
        </button>
      ) : null}
      <PianoKeyboard
        startMidi={48}
        endMidi={72}
        highlighted={[]}
        rootPc={0}
        markRoot={false}
        sounding={[]}
        cues={flash === null ? [] : [flash]}
        onPlay={onKey}
      />
    </section>
  )
}
