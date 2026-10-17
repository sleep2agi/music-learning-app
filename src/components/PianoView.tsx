import { useState } from 'react'
import { useSound } from '../audio/useSound.ts'
import { PianoKeyboard } from './PianoKeyboard.tsx'
import { NoteReadout } from './NoteReadout.tsx'
import {
  CHORD_QUALITIES,
  CHORD_QUALITY_LABEL,
  chordMidis,
  chordPitchClasses,
  spellChord,
  type ChordQuality,
} from '../theory/chords.ts'
import { parseNoteName } from '../theory/notes.ts'
import {
  ROOT_OPTIONS,
  SCALE_LABEL,
  scaleMidis,
  scalePitchClasses,
  spellScale,
  type ScaleType,
} from '../theory/scales.ts'

type Kind = 'scale' | 'chord'

export function PianoView() {
  const sound = useSound()
  const [kind, setKind] = useState<Kind>('scale')
  const [root, setRoot] = useState('C')
  const [scaleType, setScaleType] = useState<ScaleType>('major')
  const [quality, setQuality] = useState<ChordQuality>('major')
  const rootPc = parseNoteName(root).pitchClass
  const highlighted = kind === 'scale' ? scalePitchClasses(rootPc, scaleType) : chordPitchClasses(rootPc, quality)
  const spelled = kind === 'scale' ? spellScale(root, scaleType) : spellChord(root, quality)
  const title = kind === 'scale' ? `${root} ${SCALE_LABEL[scaleType]}` : `${root} ${CHORD_QUALITY_LABEL[quality]}`

  function playSelection() {
    if (kind === 'scale') void sound.sequence(scaleMidis(root, scaleType, 4), 'piano', 0.24)
    else void sound.chord(chordMidis(root, quality, 4), 'piano')
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="section-head">
          <h2>键盘</h2>
          <p>两个八度，从 C3 到 C5。金色琴键属于当前音阶或和弦，描边更深的是根音。</p>
        </div>
        <div className="controls">
          <label className="field">
            <span>显示</span>
            <select value={kind} onChange={(event) => setKind(event.target.value as Kind)}>
              <option value="scale">音阶</option>
              <option value="chord">和弦</option>
            </select>
          </label>
          <label className="field">
            <span>根音</span>
            <select value={root} onChange={(event) => setRoot(event.target.value)}>
              {ROOT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {kind === 'scale' ? (
            <label className="field">
              <span>音阶</span>
              <select value={scaleType} onChange={(event) => setScaleType(event.target.value as ScaleType)}>
                <option value="major">大调</option>
                <option value="naturalMinor">自然小调</option>
              </select>
            </label>
          ) : (
            <label className="field">
              <span>和弦</span>
              <select value={quality} onChange={(event) => setQuality(event.target.value as ChordQuality)}>
                {CHORD_QUALITIES.map((option) => (
                  <option key={option} value={option}>
                    {CHORD_QUALITY_LABEL[option]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="button" className="primary" onClick={playSelection}>
            {kind === 'scale' ? '播放音阶' : '播放和弦'}
          </button>
        </div>
        <p className="formula">
          {title} · {spelled.join('  ')}
          {kind === 'scale' ? '  ' + root : ''}
        </p>
        <NoteReadout midis={sound.last} idle="点按琴键发声，或播放整条音阶与和弦。" />
        <p className="scroll-hint">窄屏时可以左右滑动键盘。</p>
        <PianoKeyboard
          startMidi={48}
          endMidi={72}
          highlighted={highlighted}
          rootPc={rootPc}
          sounding={sound.sounding}
          onPlay={(midi) => void sound.tone(midi, 'piano')}
        />
      </section>
    </div>
  )
}
