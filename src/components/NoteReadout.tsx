import { midiToFreq, midiToName } from '../theory/notes.ts'

export function NoteReadout({ midis, idle }: { midis: readonly number[]; idle: string }) {
  if (midis.length === 0) return <p className="readout">{idle}</p>
  return (
    <p className="readout">
      <span>刚才的音</span>
      <strong>{midis.map((midi) => midiToName(midi)).join(' · ')}</strong>
      {midis.length === 1 && midis[0] !== undefined && <span>{midiToFreq(midis[0]).toFixed(2)} Hz</span>}
    </p>
  )
}
