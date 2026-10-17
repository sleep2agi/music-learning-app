import { midiToName } from '../theory/notes.ts'

const NOTES = [
  { midi: 60, step: -2, ledger: true },
  { midi: 62, step: -1, ledger: false },
  { midi: 64, step: 0, ledger: false },
  { midi: 65, step: 1, ledger: false },
  { midi: 67, step: 2, ledger: false },
  { midi: 69, step: 3, ledger: false },
  { midi: 71, step: 4, ledger: false },
  { midi: 72, step: 5, ledger: false },
] as const

const BOTTOM_LINE = 132
const STEP = 8

function staffY(step: number): number {
  return BOTTOM_LINE - step * STEP
}

export function Staff({ sounding, onPlay }: { sounding: readonly number[]; onPlay: (midi: number) => void }) {
  const lines = [0, 2, 4, 6, 8].map((step) => staffY(step))
  return (
    <svg className="staff" viewBox="0 0 680 200" role="group" aria-label="高音谱表，从 C4 到 C5">
      <text className="clef" x="8" y="146">
        𝄞
      </text>
      {lines.map((y) => (
        <line key={y} x1="78" x2="650" y1={y} y2={y} className="staff-line" />
      ))}
      {NOTES.map((note, index) => {
        const x = 130 + index * 64
        const y = staffY(note.step)
        const active = sounding.includes(note.midi)
        const name = midiToName(note.midi)
        return (
          <g
            key={note.midi}
            className={active ? 'staff-note is-on' : 'staff-note'}
            role="button"
            tabIndex={0}
            aria-label={`播放 ${name}`}
            onClick={() => onPlay(note.midi)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onPlay(note.midi)
              }
            }}
          >
            {note.ledger && <line x1={x - 16} x2={x + 16} y1={y} y2={y} className="staff-line" />}
            <ellipse cx={x} cy={y} rx="8" ry="5.5" transform={`rotate(-18 ${x} ${y})`} />
            <text className="staff-label" x={x} y="186" textAnchor="middle">
              {name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
