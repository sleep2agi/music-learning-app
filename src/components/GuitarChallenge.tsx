import { useEffect, useRef, useState } from 'react'
import { playCheer, playChord, playOops, playTone, unlockAudio } from '../audio/synth.ts'
import { chordMidiNotes, fretMidi, GUITAR_CHORDS, GUITAR_STRINGS } from '../data/guitar.ts'
import {
  CHORD_LIMIT_MS,
  FRET_GAME_MAX,
  FRET_LIMIT_MS,
  hitPoints,
  matchesChord,
  matchesFret,
  nextChordTarget,
  nextFretTarget,
  remainingMs,
  type ChordTarget,
  type FretTarget,
  type GuitarTarget,
} from '../play/guitarChallenge.ts'
import { gameRng } from '../play/rng.ts'
import { usePlayStats } from '../storage/usePlayStats.ts'
import { Burst, Stars } from './Burst.tsx'
import { starsForCombo } from '../play/score.ts'

type Mode = 'fret' | 'chord'
type Life = 'ready' | 'live' | 'gap' | 'over'

const FRETS = Array.from({ length: FRET_GAME_MAX + 1 }, (_, fret) => fret)

export function GuitarChallenge() {
  const { record } = usePlayStats()
  const rng = useRef<(() => number) | null>(null)
  const [mode, setMode] = useState<Mode>('fret')
  const [target, setTarget] = useState<GuitarTarget | null>(null)
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [life, setLife] = useState<Life>('ready')
  const [combo, setCombo] = useState(0)
  const [points, setPoints] = useState(0)
  const [burst, setBurst] = useState(0)
  const [note, setNote] = useState('点开始，抢金色目标')
  const resolved = useRef(false)
  const followTimer = useRef<number | null>(null)

  const limit = mode === 'fret' ? FRET_LIMIT_MS : CHORD_LIMIT_MS
  const left = life === 'over' ? 0 : life === 'live' ? remainingMs(startedAt, now, limit) : limit

  useEffect(() => {
    if (life !== 'live') return
    const id = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (!resolved.current && remainingMs(startedAt, current, limit) <= 0) {
        resolved.current = true
        setLife('over')
        setCombo(0)
        setNote('时间到')
        playOops()
      }
    }, 80)
    return () => window.clearInterval(id)
  }, [life, startedAt, limit])

  useEffect(() => () => {
    if (followTimer.current !== null) window.clearTimeout(followTimer.current)
  }, [])

  useEffect(() => {
    if (life !== 'live' || target?.kind !== 'fret') return
    const cell = document.querySelector<HTMLElement>('.fret-cell.is-target')
    const scroller = cell?.closest('.fretboard-scroll')
    if (!cell || !(scroller instanceof HTMLElement)) return
    const delta = cell.offsetLeft - scroller.clientWidth / 2 + cell.clientWidth / 2
    scroller.scrollTo({ left: Math.max(0, delta), behavior: 'smooth' })
  }, [life, target])

  function roll(): () => number {
    if (!rng.current) rng.current = gameRng()
    return rng.current
  }

  function arm(next: GuitarTarget) {
    resolved.current = false
    setTarget(next)
    const stamp = Date.now()
    setStartedAt(stamp)
    setNow(stamp)
    setLife('live')
    setNote(next.kind === 'fret' ? '点金色格子' : '点亮起的和弦')
  }

  function start(nextMode: Mode = mode) {
    unlockAudio()
    if (followTimer.current !== null) window.clearTimeout(followTimer.current)
    setMode(nextMode)
    setCombo(0)
    setPoints(0)
    const next = nextMode === 'fret' ? nextFretTarget(roll()) : nextChordTarget(roll())
    arm(next)
  }

  function succeed(nextCombo: number, active: Mode) {
    const gained = hitPoints(remainingMs(startedAt, Date.now(), limit), limit, nextCombo)
    resolved.current = true
    setLife('gap')
    setCombo(nextCombo)
    setPoints((value) => value + gained)
    setBurst((value) => value + 1)
    setNote('漂亮！')
    playCheer()
    record({ type: 'guitar', combo: nextCombo })
    const previous = target
    followTimer.current = window.setTimeout(() => {
      const follow =
        active === 'fret'
          ? nextFretTarget(roll(), previous?.kind === 'fret' ? previous.key : undefined)
          : nextChordTarget(roll(), previous?.kind === 'chord' ? previous.chordId : undefined)
      arm(follow)
    }, 700)
  }

  function miss() {
    if (resolved.current) return
    resolved.current = true
    setLife('over')
    setCombo(0)
    setNote('不是这个')
    playOops()
  }

  function tapFret(stringIndex: number, fret: number) {
    unlockAudio()
    playTone(fretMidi(stringIndex, fret), { timbre: 'guitar', duration: 0.45 })
    if (life !== 'live' || target?.kind !== 'fret') return
    if (matchesFret(target, stringIndex, fret)) succeed(combo + 1, mode)
    else miss()
  }

  function tapChord(chordId: string) {
    unlockAudio()
    const chord = GUITAR_CHORDS.find((item) => item.id === chordId)
    if (chord) playChord(chordMidiNotes(chord), 'guitar')
    if (life !== 'live' || target?.kind !== 'chord') return
    if (matchesChord(target, chordId)) succeed(combo + 1, mode)
    else miss()
  }

  return (
    <section className="card play-card">
      <Burst tick={burst} />
      <div className="play-toolbar">
        <div>
          <h2>抢音</h2>
          <p>{note}</p>
        </div>
        <div className="play-score">
          <Stars count={starsForCombo(combo)} />
          <strong>{points}</strong>
          <span>连击 {combo}</span>
        </div>
      </div>
      <div className="mode-switch" role="group" aria-label="吉他挑战">
        <button type="button" aria-pressed={mode === 'fret'} onClick={() => start('fret')}>
          品位
        </button>
        <button type="button" aria-pressed={mode === 'chord'} onClick={() => start('chord')}>
          和弦
        </button>
      </div>
      <div className="timer" aria-hidden="true">
        <span style={{ width: `${Math.round((left / limit) * 100)}%` }} />
      </div>
      {life === 'ready' && (
        <button type="button" className="primary play-start" onClick={() => start(mode)}>
          开始抢音
        </button>
      )}
      {target?.kind === 'fret' && <FretBoard target={target} onTap={tapFret} />}
      {target?.kind === 'chord' && <ChordPick target={target} onTap={tapChord} />}
      {life === 'over' && (
        <button type="button" className="primary" onClick={() => start(mode)}>
          再来一局
        </button>
      )}
    </section>
  )
}

function FretBoard({ target, onTap }: { target: FretTarget; onTap: (stringIndex: number, fret: number) => void }) {
  return (
    <div className="fretboard-scroll">
      <table className="fretboard fretboard-mini">
        <thead>
          <tr>
            <th className="string-label">弦</th>
            {FRETS.map((fret) => (
              <th key={fret}>{fret === 0 ? '空' : fret}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GUITAR_STRINGS.map((string) => (
            <tr key={string.index}>
              <th className="string-label">{string.label}</th>
              {FRETS.map((fret) => {
                const on = target.stringIndex === string.index && target.fret === fret
                return (
                  <td key={fret}>
                    <button
                      type="button"
                      className={['fret-cell', `string-${string.index}`, on ? 'is-target' : ''].filter(Boolean).join(' ')}
                      aria-label={`${string.title} ${fret === 0 ? '空弦' : `${fret} 品`}`}
                      onClick={() => onTap(string.index, fret)}
                    >
                      <span>{on ? '●' : ''}</span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChordPick({ target, onTap }: { target: ChordTarget; onTap: (chordId: string) => void }) {
  return (
    <div className="chord-pick">
      {GUITAR_CHORDS.map((chord) => (
        <button
          key={chord.id}
          type="button"
          className={chord.id === target.chordId ? 'choice is-target' : 'choice'}
          onClick={() => onTap(chord.id)}
        >
          <strong>{chord.symbol}</strong>
          <span>{chord.label}</span>
        </button>
      ))}
    </div>
  )
}
