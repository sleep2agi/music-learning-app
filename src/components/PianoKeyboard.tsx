import type { CSSProperties } from 'react'
import { isBlackKey, midiToName, mod12 } from '../theory/notes.ts'

export function PianoKeyboard({
  startMidi,
  endMidi,
  highlighted,
  rootPc,
  sounding,
  onPlay,
}: {
  startMidi: number
  endMidi: number
  highlighted: readonly number[]
  rootPc: number
  sounding: readonly number[]
  onPlay: (midi: number) => void
}) {
  const midis: number[] = []
  for (let midi = startMidi; midi <= endMidi; midi += 1) midis.push(midi)
  const whites = midis.filter((midi) => !isBlackKey(midi))
  const blacks = midis.filter((midi) => isBlackKey(midi))
  const highlight = new Set(highlighted.map((pc) => mod12(pc)))
  const soundingSet = new Set(sounding)

  function whitesBefore(midi: number): number {
    return whites.filter((white) => white < midi).length
  }

  return (
    <div className="keyboard-scroll">
      <div className="keyboard" style={{ '--whites': String(whites.length) } as CSSProperties}>
        {whites.map((midi) => (
          <Key
            key={midi}
            midi={midi}
            white
            lit={highlight.has(mod12(midi))}
            root={mod12(midi) === mod12(rootPc)}
            sounding={soundingSet.has(midi)}
            onPlay={onPlay}
          />
        ))}
        {blacks.map((midi) => (
          <Key
            key={midi}
            midi={midi}
            white={false}
            lit={highlight.has(mod12(midi))}
            root={mod12(midi) === mod12(rootPc)}
            sounding={soundingSet.has(midi)}
            onPlay={onPlay}
            style={{ left: `calc(${whitesBefore(midi)} / ${whites.length} * 100%)` }}
          />
        ))}
      </div>
    </div>
  )
}

function Key({
  midi,
  white,
  lit,
  root,
  sounding,
  onPlay,
  style,
}: {
  midi: number
  white: boolean
  lit: boolean
  root: boolean
  sounding: boolean
  onPlay: (midi: number) => void
  style?: CSSProperties
}) {
  const name = midiToName(midi)
  const className = [
    white ? 'white-key' : 'black-key',
    lit ? 'is-lit' : '',
    root ? 'is-root' : '',
    sounding ? 'is-sounding' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" className={className} style={style} aria-label={name} aria-pressed={lit} onClick={() => onPlay(midi)}>
      <span>{white ? name : name.replace(/\d+$/, '')}</span>
    </button>
  )
}
