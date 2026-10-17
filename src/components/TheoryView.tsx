import { useState } from 'react'
import { useSound } from '../audio/useSound.ts'
import { LESSONS } from '../data/lessons.ts'
import { useProgress } from '../storage/useProgress.ts'
import {
  CHORD_INTERVALS,
  CHORD_QUALITIES,
  CHORD_QUALITY_LABEL,
  chordMidis,
  spellChord,
  type ChordQuality,
} from '../theory/chords.ts'
import { describeSemitones, INTERVALS } from '../theory/intervals.ts'
import { midiLabel } from '../theory/notes.ts'
import {
  DEGREE_NAMES,
  ROOT_OPTIONS,
  SCALE_FORMULA,
  scaleMidis,
  scaleTitle,
  spellScale,
  type ScaleType,
} from '../theory/scales.ts'
import { QuizPanel } from './QuizPanel.tsx'
import { Staff } from './Staff.tsx'

const INTERVAL_NOTES = Array.from({ length: 13 }, (_, index) => 60 + index)

export function TheoryView() {
  const { progress, toggleLesson, recordAnswer, reset } = useProgress()
  const [lessonId, setLessonId] = useState(LESSONS[0]?.id ?? 'notes')
  const lesson = LESSONS.find((item) => item.id === lessonId) ?? LESSONS[0]
  const doneCount = LESSONS.filter((item) => progress.completedLessonIds.includes(item.id)).length
  if (!lesson) return null
  const done = progress.completedLessonIds.includes(lesson.id)
  const ratio = progress.quizAnswered === 0 ? null : Math.round((progress.quizCorrect / progress.quizAnswered) * 100)

  return (
    <div className="stack">
      <section className="card progress-card">
        <div>
          <h2>闯关进度</h2>
          <p>
            已完成 {doneCount} / {LESSONS.length}
            {ratio === null ? ' · 还没有答题' : ` · 答题正确率 ${ratio}%（${progress.quizCorrect}/${progress.quizAnswered}）`}
          </p>
        </div>
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${(doneCount / LESSONS.length) * 100}%` }} />
        </div>
        <button type="button" className="text-button" onClick={reset}>
          清除本机进度
        </button>
      </section>

      <div className="theory-layout">
        <ol className="lesson-list">
          {LESSONS.map((item, index) => {
            const complete = progress.completedLessonIds.includes(item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={item.id === lesson.id ? 'true' : undefined}
                  onClick={() => setLessonId(item.id)}
                >
                  <span className={complete ? 'index is-done' : 'index'}>{complete ? '✓' : index + 1}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.summary}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <article className="card lesson">
          <header>
            <h2>{lesson.title}</h2>
            <p className="lede">{lesson.summary}</p>
          </header>
          <div className="prose">
            {lesson.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {lesson.id === 'notes' && <NotesLab />}
          {lesson.id === 'intervals' && <IntervalLab />}
          {lesson.id === 'scales' && <ScaleLab />}
          {lesson.id === 'chords' && <ChordLab />}
          <button type="button" className="ghost" onClick={() => toggleLesson(lesson.id)}>
            {done ? '取消完成标记' : '标记为已学完'}
          </button>
        </article>
      </div>

      <QuizPanel onAnswer={recordAnswer} />
    </div>
  )
}

function NotesLab() {
  const sound = useSound()
  return (
    <div className="lab">
      <Staff sounding={sound.sounding} onPlay={(midi) => void sound.tone(midi, 'pure')} />
    </div>
  )
}

function IntervalLab() {
  const sound = useSound()
  const [from, setFrom] = useState(60)
  const [to, setTo] = useState(64)
  const interval = describeSemitones(Math.abs(to - from))

  return (
    <div className="lab">
      <div className="interval-table">
        {INTERVALS.filter((item) => item.semitones > 0).map((item) => (
          <span key={item.id}>
            <strong>{item.name}</strong>
            {item.semitones}
          </span>
        ))}
      </div>
      <div className="controls">
        <label className="field">
          <span>低音或起点</span>
          <select value={from} onChange={(event) => setFrom(Number(event.target.value))}>
            {INTERVAL_NOTES.map((midi) => (
              <option key={midi} value={midi}>
                {midiLabel(midi)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>高音或终点</span>
          <select value={to} onChange={(event) => setTo(Number(event.target.value))}>
            {INTERVAL_NOTES.map((midi) => (
              <option key={midi} value={midi}>
                {midiLabel(midi)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="primary"
          onClick={() => void sound.sequence(from === to ? [from] : [Math.min(from, to), Math.max(from, to)], 'pure', 0.42)}
        >
          播放
        </button>
      </div>
      <p className="result">
        <strong>{interval.name}</strong>
        <span>{interval.semitones} 个半音</span>
      </p>
    </div>
  )
}

function ScaleLab() {
  const sound = useSound()
  const [root, setRoot] = useState<string>('C')
  const [type, setType] = useState<ScaleType>('major')
  const notes = spellScale(root, type)
  const degrees = DEGREE_NAMES[type]

  return (
    <div className="lab">
      <div className="controls">
        <label className="field">
          <span>主音</span>
          <select value={root} onChange={(event) => setRoot(event.target.value)}>
            {ROOT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>类型</span>
          <select value={type} onChange={(event) => setType(event.target.value as ScaleType)}>
            <option value="major">大调</option>
            <option value="naturalMinor">自然小调</option>
          </select>
        </label>
        <button type="button" className="primary" onClick={() => void sound.sequence(scaleMidis(root, type), 'piano', 0.28)}>
          播放音阶
        </button>
      </div>
      <p className="formula">
        {scaleTitle(root, type)} · {SCALE_FORMULA[type]}
      </p>
      <ol className="degree-row">
        {notes.map((note, index) => (
          <li key={`${note}-${degrees[index] ?? index}`}>
            <strong>{note}</strong>
            <span>{degrees[index]}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ChordLab() {
  const sound = useSound()
  const [root, setRoot] = useState('C')
  const [quality, setQuality] = useState<ChordQuality>('major')
  const notes = spellChord(root, quality)

  return (
    <div className="lab">
      <div className="controls">
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
        <label className="field">
          <span>类型</span>
          <select value={quality} onChange={(event) => setQuality(event.target.value as ChordQuality)}>
            {CHORD_QUALITIES.map((option) => (
              <option key={option} value={option}>
                {CHORD_QUALITY_LABEL[option]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="primary" onClick={() => void sound.chord(chordMidis(root, quality), 'piano')}>
          播放和弦
        </button>
      </div>
      <p className="formula">半音：{CHORD_INTERVALS[quality].join(' · ')}</p>
      <ol className="degree-row">
        {notes.map((note) => (
          <li key={note}>
            <strong>{note}</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}
