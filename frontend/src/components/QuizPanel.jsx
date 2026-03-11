import { useState } from 'react'

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

export default function QuizPanel({ authToken, onClose }) {
  const [phase, setPhase] = useState('setup') // setup | quiz | results
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])

  const letters = ['A', 'B', 'C', 'D', 'E', 'F']

  const generateQuiz = async () => {
    if (!topic.trim()) { setError('Please enter a topic.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          topic: topic.trim(),
          num_questions: numQuestions,
          difficulty
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz')
      if (!data.questions?.length) throw new Error('No questions returned')
      setQuestions(data.questions)
      setPhase('quiz')
      setCurrentIndex(0)
      setScore(0)
      setAnswers([])
      setSelectedAnswer(null)
      setShowExplanation(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (choiceIdx) => {
    if (selectedAnswer !== null) return
    const q = questions[currentIndex]
    const isCorrect = choiceIdx === q.correct_answer
    setSelectedAnswer(choiceIdx)
    setShowExplanation(true)
    if (isCorrect) setScore(prev => prev + 1)
    setAnswers(prev => [...prev, { question: currentIndex, selected: choiceIdx, correct: isCorrect }])
  }

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('results')
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  const restart = () => {
    setPhase('setup')
    setTopic('')
    setQuestions([])
    setScore(0)
    setAnswers([])
    setError('')
  }

  const q = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100 : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {phase === 'setup' ? 'Generate Quiz' : phase === 'quiz' ? 'Quiz' : 'Results'}
          </span>
          {phase === 'quiz' && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', marginRight: 12 }}>
              <span className="pill counter">{currentIndex + 1}/{questions.length}</span>
              <span className="pill score">{score} correct</span>
            </div>
          )}
          <button className="modal-close" onClick={onClose}><IconX /></button>
        </div>

        {/* ── Setup ── */}
        {phase === 'setup' && (
          <div>
            {error && <div className="alert-error">{error}</div>}
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Topic</label>
              <input
                className="field-input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Machine Learning, React Hooks"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Questions</label>
                <select
                  className="field-input"
                  value={numQuestions}
                  onChange={e => setNumQuestions(Number(e.target.value))}
                >
                  {[3, 5, 10, 15].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Difficulty</label>
                <select
                  className="field-input"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <button className="btn-primary full" onClick={generateQuiz} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>
        )}

        {/* ── Quiz ── */}
        {phase === 'quiz' && q && (
          <div>
            <div className="quiz-progress">
              <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="quiz-q">{q.question}</div>
            {q.choices?.map((choice, i) => {
              let cls = 'quiz-choice'
              if (selectedAnswer !== null) {
                if (i === q.correct_answer) cls += ' correct'
                else if (i === selectedAnswer) cls += ' wrong'
                else cls += ' dimmed'
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="choice-letter">{letters[i]}</span>
                  <span>{choice}</span>
                </button>
              )
            })}
            {showExplanation && q.explanation && (
              <div className={`explanation-box ${selectedAnswer === q.correct_answer ? 'correct' : 'wrong'}`}>
                {selectedAnswer === q.correct_answer ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontWeight: 700 }}>
                    <IconCheck /> Correct
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontWeight: 700 }}>
                    <IconX /> Incorrect
                  </span>
                )}
                {q.explanation}
              </div>
            )}
            {selectedAnswer !== null && (
              <div className="modal-footer">
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {currentIndex + 1} of {questions.length}
                </span>
                <button className="btn-primary" onClick={nextQuestion}>
                  {currentIndex + 1 >= questions.length ? 'See Results' : 'Next'} <IconArrowRight />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {phase === 'results' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="score-display">{score}/{questions.length}</div>
            <div className="score-subtext">
              {score === questions.length ? 'Perfect score!' :
               score >= questions.length * 0.7 ? 'Great job!' :
               score >= questions.length * 0.5 ? 'Not bad!' : 'Keep practicing!'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
              <button className="btn-ghost" onClick={restart}>New Quiz</button>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}