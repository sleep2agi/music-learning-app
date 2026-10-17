import { useState } from 'react'
import { useSound } from '../audio/useSound.ts'
import { buildQuiz, type QuizQuestion } from '../theory/quiz.ts'

interface Asking {
  phase: 'asking'
  questions: QuizQuestion[]
  index: number
  picked: number | null
  correctCount: number
}

interface Done {
  phase: 'done'
  correct: number
  total: number
}

type QuizState = { phase: 'idle' } | Asking | Done

export function QuizPanel({ onAnswer }: { onAnswer: (correct: boolean) => void }) {
  const sound = useSound()
  const [state, setState] = useState<QuizState>({ phase: 'idle' })

  function start() {
    setState({
      phase: 'asking',
      questions: buildQuiz(Date.now(), 6),
      index: 0,
      picked: null,
      correctCount: 0,
    })
  }

  function playQuestion(question: QuizQuestion) {
    if (question.playback === 'sequence') void sound.sequence(question.midis, 'pure', 0.42)
    else void sound.chord(question.midis, 'piano')
  }

  if (state.phase === 'idle') {
    return (
      <section className="card quiz">
        <div className="section-head">
          <h2>小测验</h2>
          <p>听一听，或直接看音符，判断音程和和弦。答对的题数会记在这台设备上。</p>
        </div>
        <button type="button" className="primary" onClick={start}>
          开始 6 题
        </button>
      </section>
    )
  }

  if (state.phase === 'done') {
    const comment =
      state.correct === state.total
        ? '这一轮全部答对。'
        : state.correct * 2 >= state.total
          ? '已经抓住大部分了，可以把容易混的音程再听一遍。'
          : '可以回到上面的课程，听几个例子再试。'
    return (
      <section className="card quiz">
        <h2>本轮结果</h2>
        <p className="score">
          {state.correct}
          <span> / {state.total}</span>
        </p>
        <p>{comment}</p>
        <button type="button" className="primary" onClick={start}>
          再练一轮
        </button>
      </section>
    )
  }

  const question = state.questions[state.index]
  if (!question) return null
  const answered = state.picked !== null
  const correct = state.picked === question.answerIndex

  function choose(choice: number) {
    if (state.phase !== 'asking' || state.picked !== null) return
    const current = state.questions[state.index]
    if (!current) return
    const ok = choice === current.answerIndex
    onAnswer(ok)
    setState({ ...state, picked: choice, correctCount: state.correctCount + (ok ? 1 : 0) })
  }

  function next() {
    if (state.phase !== 'asking' || state.picked === null) return
    if (state.index + 1 >= state.questions.length) {
      setState({ phase: 'done', correct: state.correctCount, total: state.questions.length })
      return
    }
    setState({ ...state, index: state.index + 1, picked: null })
  }

  return (
    <section className="card quiz">
      <div className="section-head">
        <h2>小测验</h2>
        <p>
          第 {state.index + 1} / {state.questions.length} 题 · {question.kind === 'interval' ? '音程' : '和弦'}
        </p>
      </div>
      <p className="quiz-prompt">{question.prompt}</p>
      <p className="quiz-hint">{question.hint}</p>
      <button type="button" className="ghost" onClick={() => playQuestion(question)}>
        播放
      </button>
      <div className="choices">
        {question.choices.map((choice, index) => {
          const isCorrect = answered && index === question.answerIndex
          const isWrong = answered && index === state.picked && !correct
          return (
            <button
              key={choice}
              type="button"
              className={isCorrect ? 'choice is-correct' : isWrong ? 'choice is-wrong' : 'choice'}
              onClick={() => choose(index)}
              disabled={answered}
            >
              {choice}
            </button>
          )
        })}
      </div>
      {answered && <p className={correct ? 'feedback is-good' : 'feedback is-bad'}>{correct ? '答对了。' : '再看一次。'} {question.explain}</p>}
      {answered && (
        <button type="button" className="primary" onClick={next}>
          {state.index + 1 === state.questions.length ? '查看结果' : '下一题'}
        </button>
      )}
    </section>
  )
}
