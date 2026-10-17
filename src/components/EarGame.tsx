import { useRef, useState } from 'react'
import { playCheer, playChord, playOops, playSequence, playTone, unlockAudio } from '../audio/synth.ts'
import { buildEarRound, isEarCorrect, type EarKind, type EarRound } from '../play/ear.ts'
import { gameRng } from '../play/rng.ts'
import { applyAnswer, emptyRun, starsForCombo } from '../play/score.ts'
import { usePlayStats } from '../storage/usePlayStats.ts'
import { Burst, Stars } from './Burst.tsx'

const KINDS: { id: EarKind; label: string }[] = [
  { id: 'note', label: '单音' },
  { id: 'interval', label: '音程' },
  { id: 'chord', label: '和弦' },
]

function playRound(round: EarRound) {
  unlockAudio()
  if (round.playback === 'chord') playChord(round.midis, 'piano')
  else if (round.playback === 'sequence') playSequence(round.midis, 0.42, 'pure')
  else playTone(round.midis[0] ?? 60, { timbre: 'pure', duration: 0.75 })
}

export function EarGame() {
  const { record } = usePlayStats()
  const rng = useRef<(() => number) | null>(null)
  const [kind, setKind] = useState<EarKind>('note')
  const [round, setRound] = useState<EarRound | null>(null)
  const [run, setRun] = useState(emptyRun)
  const [picked, setPicked] = useState<string | null>(null)
  const [burst, setBurst] = useState(0)

  function roll(): () => number {
    if (!rng.current) rng.current = gameRng()
    return rng.current
  }

  function deal(nextKind: EarKind) {
    const next = buildEarRound(nextKind, roll())
    setKind(nextKind)
    setRound(next)
    setPicked(null)
    playRound(next)
  }

  function choose(id: string) {
    if (!round || picked) return
    const correct = isEarCorrect(round, id)
    const next = applyAnswer(run, correct)
    setRun(next)
    setPicked(id)
    if (correct) {
      playCheer()
      setBurst((value) => value + 1)
      record({ type: 'correct', combo: next.combo })
      return
    }
    playOops()
  }

  const stars = starsForCombo(run.combo)

  return (
    <section className="card play-card" data-answer={round?.answerId ?? ''}>
      <Burst tick={burst} />
      <div className="play-toolbar">
        <div>
          <h2>听辨</h2>
          <p>听完再选。连对会亮起星星。</p>
        </div>
        <div className="play-score">
          <Stars count={stars} />
          <strong>{run.points}</strong>
          <span>连击 {run.combo}</span>
        </div>
      </div>
      <div className="mode-switch" role="group" aria-label="听辨类型">
        {KINDS.map((item) => (
          <button key={item.id} type="button" aria-pressed={kind === item.id} onClick={() => deal(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {!round ? (
        <button type="button" className="primary play-start" onClick={() => deal(kind)}>
          开始听辨
        </button>
      ) : (
        <>
          <div className="play-actions">
            <button type="button" className="ghost" onClick={() => playRound(round)} disabled={picked !== null}>
              再听一次
            </button>
            {picked && (
              <button type="button" className="primary" onClick={() => deal(kind)}>
                下一题
              </button>
            )}
          </div>
          <div className="choices">
            {round.choices.map((choice) => {
              const correct = picked !== null && choice.id === round.answerId
              const wrong = picked === choice.id && choice.id !== round.answerId
              return (
                <button
                  key={choice.id}
                  type="button"
                  data-choice={choice.id}
                  className={['choice', correct ? 'is-correct' : '', wrong ? 'is-wrong' : ''].filter(Boolean).join(' ')}
                  disabled={picked !== null}
                  onClick={() => choose(choice.id)}
                >
                  {choice.label}
                </button>
              )
            })}
          </div>
          {picked && (
            <p className={picked === round.answerId ? 'feedback is-good' : 'feedback is-bad'}>
              {picked === round.answerId ? '好听！' : '差一点点'}
            </p>
          )}
        </>
      )}
    </section>
  )
}
