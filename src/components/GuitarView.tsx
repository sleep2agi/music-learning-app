import { useState } from 'react'
import { useSound } from '../audio/useSound.ts'
import {
  chordCellKeys,
  chordMidiNotes,
  FRET_COUNT,
  fretMidi,
  GUITAR_CHORDS,
  GUITAR_STRINGS,
  type GuitarChordShape,
} from '../data/guitar.ts'
import { writeHash } from '../nav.ts'
import { midiToFreq, midiToName, pitchClassName } from '../theory/notes.ts'
import { NoteReadout } from './NoteReadout.tsx'

const FRET_NUMBERS = Array.from({ length: FRET_COUNT + 1 }, (_, fret) => fret)
const INLAYS = new Set([3, 5, 7, 9, 12])

export function GuitarView() {
  const sound = useSound()
  const [selectedId, setSelectedId] = useState(GUITAR_CHORDS[0]?.id ?? 'C-major')
  const [cells, setCells] = useState<string[]>([])
  const selected = GUITAR_CHORDS.find((chord) => chord.id === selectedId) ?? GUITAR_CHORDS[0]
  const shape = new Set(selected ? chordCellKeys(selected) : [])
  const activeCells = sound.sounding.length === 0 ? [] : cells

  function tapFret(stringIndex: number, fret: number) {
    setCells([`${stringIndex}:${fret}`])
    void sound.tone(fretMidi(stringIndex, fret), 'guitar')
  }

  function strum(chord: GuitarChordShape) {
    setSelectedId(chord.id)
    setCells(chordCellKeys(chord))
    void sound.chord(chordMidiNotes(chord), 'guitar')
  }

  function tune(stringIndex: number) {
    const string = GUITAR_STRINGS[stringIndex]
    if (!string) return
    setCells([`${stringIndex}:0`])
    void sound.tone(string.midi, 'pure')
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="section-head row-head">
          <h2>指板</h2>
          <button type="button" className="ghost" onClick={() => writeHash('play-guitar')}>
            抢音
          </button>
        </div>
        <NoteReadout midis={sound.last} idle="" />
        <p className="scroll-hint">窄屏时可以左右滑动指板。</p>
        <div className="fretboard-scroll">
          <table className="fretboard">
            <thead>
              <tr>
                <th className="string-label">弦</th>
                {FRET_NUMBERS.map((fret) => (
                  <th key={fret}>{fret === 0 ? '空' : fret}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GUITAR_STRINGS.map((string) => (
                <tr key={string.index}>
                  <th className="string-label">
                    {string.label}
                    <small>{pitchClassName(string.midi)}</small>
                  </th>
                  {FRET_NUMBERS.map((fret) => {
                    const key = `${string.index}:${fret}`
                    const midi = fretMidi(string.index, fret)
                    const active = activeCells.includes(key)
                    const inShape = shape.has(key)
                    return (
                      <td key={key}>
                        <button
                          type="button"
                          className={[
                            'fret-cell',
                            `string-${string.index}`,
                            fret === 0 ? 'is-open' : '',
                            inShape ? 'is-shape' : '',
                            active ? 'is-sounding' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-label={`${string.title} ${fret === 0 ? '空弦' : `${fret} 品`} ${midiToName(midi)}`}
                          onClick={() => tapFret(string.index, fret)}
                        >
                          <span>{pitchClassName(midi)}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th className="string-label" />
                {FRET_NUMBERS.map((fret) => (
                  <td key={fret} className="inlay">
                    {INLAYS.has(fret) ? (fret === 12 ? '● ●' : '●') : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>和弦</h2>
        </div>
        <div className="chord-grid">
          {GUITAR_CHORDS.map((chord) => (
            <button
              key={chord.id}
              type="button"
              className={chord.id === selected?.id ? 'chord-card is-selected' : 'chord-card'}
              onClick={() => strum(chord)}
            >
              <span className="chord-symbol">{chord.symbol}</span>
              <span className="chord-name">{chord.label}</span>
              <ChordDiagram chord={chord} />
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>调弦</h2>
        </div>
        <div className="tuner-grid">
          {GUITAR_STRINGS.map((string) => {
            const on = activeCells.includes(`${string.index}:0`) && sound.sounding.includes(string.midi)
            return (
              <button
                key={string.midi}
                type="button"
                className={on ? 'tuner-key is-on' : 'tuner-key'}
                onClick={() => tune(string.index)}
              >
                <strong>{string.title}</strong>
                <span>{midiToName(string.midi)}</span>
                <span>{midiToFreq(string.midi).toFixed(2)} Hz</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function ChordDiagram({ chord }: { chord: GuitarChordShape }) {
  const stringCount = 6
  const visibleFrets = 4
  const left = 28
  const top = 28
  const stringGap = 16
  const fretGap = 26
  const width = left + (stringCount - 1) * stringGap + 18
  const height = top + visibleFrets * fretGap + 12
  const pressed = chord.frets.filter((fret) => fret > 0)
  const barreFret = chord.frets[0] > 0 && chord.frets[0] === chord.frets[5] && chord.fingers[0] === 1 ? chord.frets[0] : 0
  const minPressed = pressed.length > 0 ? Math.min(...pressed) : 1
  const maxPressed = pressed.length > 0 ? Math.max(...pressed) : 1
  const windowStart = maxPressed <= visibleFrets ? 1 : minPressed

  function stringX(index: number): number {
    return left + index * stringGap
  }
  function spaceY(fret: number): number {
    return top + (fret - windowStart + 0.5) * fretGap
  }

  return (
    <svg className="diagram" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {windowStart === 1 && <rect x={left - 2} y={top - 3} width={(stringCount - 1) * stringGap + 4} height="5" rx="1" className="nut" />}
      {windowStart > 1 && (
        <text className="diagram-fret-no" x="8" y={top + fretGap * 0.72}>
          {windowStart}
        </text>
      )}
      {Array.from({ length: stringCount }, (_, index) => (
        <line key={`s${index}`} x1={stringX(index)} x2={stringX(index)} y1={top} y2={top + visibleFrets * fretGap} className="diagram-string" />
      ))}
      {Array.from({ length: visibleFrets + 1 }, (_, index) => (
        <line
          key={`f${index}`}
          x1={left}
          x2={left + (stringCount - 1) * stringGap}
          y1={top + index * fretGap}
          y2={top + index * fretGap}
          className="diagram-fret"
        />
      ))}
      {chord.frets.map((fret, index) => {
        const x = stringX(index)
        if (fret < 0) {
          return (
            <text key={index} className="diagram-mark" x={x} y="16" textAnchor="middle">
              ×
            </text>
          )
        }
        if (fret === 0) {
          return (
            <circle key={index} cx={x} cy="12" r="5" className="diagram-open" />
          )
        }
        if (fret === barreFret) return null
        const finger = chord.fingers[index] ?? 0
        return (
          <g key={index}>
            <circle cx={x} cy={spaceY(fret)} r="7" className="diagram-dot" />
            {finger > 0 && (
              <text className="diagram-finger" x={x} y={spaceY(fret) + 3.5} textAnchor="middle">
                {finger}
              </text>
            )}
          </g>
        )
      })}
      {barreFret > 0 && (
        <rect
          x={stringX(0) - 7}
          y={spaceY(barreFret) - 6}
          width={stringX(5) - stringX(0) + 14}
          height="12"
          rx="6"
          className="diagram-dot"
        />
      )}
    </svg>
  )
}
