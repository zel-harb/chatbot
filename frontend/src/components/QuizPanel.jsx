import { useState } from 'react'

export default function QuizPanel({ authToken, onClose }) {
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [questions, setQuestions] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:5000/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ topic: topic.trim(), num_questions: numQuestions })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz')

      setQuestions(data.questions)
      setCurrentIndex(0)
      setScore(0)
      setFinished(false)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setAnswered(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (letter) => {
    if (answered) return
    setSelectedAnswer(letter)
    setAnswered(true)
    setShowExplanation(true)
    if (letter === questions[currentIndex].correct) {
      setScore(s => s + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setAnswered(false)
    }
  }

  const handleRestart = () => {
    setQuestions(null)
    setTopic('')
    setFinished(false)
    setScore(0)
    setCurrentIndex(0)
  }

  const q = questions?.[currentIndex]

  /* ── Score screen ── */
  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="quiz-overlay">
        <div className="quiz-modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '📚'}
          </div>
          <h2 className="font-brand" style={{ fontSize: 20, fontWeight: 800, color: '#E4E8F5', marginBottom: 4 }}>
            Quiz Complete!
          </h2>
          <p style={{ fontSize: 13, color: '#7A82A0', marginBottom: 16 }}>
            Topic: <span style={{ fontWeight: 600, color: '#9AA3BF' }}>{topic}</span>
          </p>
          <div className="quiz-final-score">{pct}%</div>
          <p className="quiz-final-label">
            You got <span style={{ fontWeight: 700, color: '#52B7FF' }}>{score}</span> out of <span style={{ fontWeight: 700, color: '#E4E8F5' }}>{questions.length}</span> correct
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="quiz-next-btn" onClick={handleRestart}>New Quiz</button>
            <button className="quiz-quit-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Question screen ── */
  if (questions && q) {
    const isCorrectAnswer = selectedAnswer === q.correct
    return (
      <div className="quiz-overlay">
        <div className="quiz-modal">
          {/* Top badges */}
          <div className="quiz-top">
            <span className="quiz-counter">
              Question {currentIndex + 1} / {questions.length}
            </span>
            <span className="quiz-score">Score: {score}</span>
          </div>

          {/* Progress bar */}
          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <h3 className="quiz-question">{q.question}</h3>

          {/* Options */}
          <div>
            {q.options.map((opt, i) => {
              const letter = ['A', 'B', 'C', 'D'][i]
              const isCorrect = letter === q.correct
              const isSelected = letter === selectedAnswer

              let cls = 'quiz-option'
              if (answered) {
                if (isCorrect) cls += ' correct'
                else if (isSelected && !isCorrect) cls += ' wrong'
                else cls += ' dimmed'
              }

              return (
                <button
                  key={letter}
                  onClick={() => handleSelect(letter)}
                  disabled={answered}
                  className={cls}
                >
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{letter})</span>
                  {opt.replace(/^[A-D]\)\s*/, '')}
                  {answered && isCorrect && <span style={{ float: 'right' }}>✓</span>}
                  {answered && isSelected && !isCorrect && <span style={{ float: 'right' }}>✗</span>}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`quiz-explanation ${isCorrectAnswer ? 'correct-exp' : 'wrong-exp'}`}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                {isCorrectAnswer ? '✓ Correct!' : `✗ Incorrect — answer is ${q.correct}`}
              </p>
              <p>{q.explanation}</p>
            </div>
          )}

          {/* Bottom row */}
          <div className="quiz-bottom">
            <button className="quiz-quit-btn" onClick={onClose}>Quit</button>
            {answered && (
              <button className="quiz-next-btn" onClick={handleNext}>
                {currentIndex + 1 >= questions.length ? 'See Results' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Setup screen ── */
  return (
    <div className="quiz-overlay">
      <div className="quiz-modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="font-brand" style={{ fontSize: 20, fontWeight: 800, color: '#E4E8F5' }}>
            📝 Quiz Mode
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#525C78', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        <label className="quiz-label">Topic</label>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. Python basics, React hooks, Machine Learning..."
          className="quiz-input"
          style={{ marginBottom: 14 }}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
        />

        <label className="quiz-label">Number of questions</label>
        <select
          value={numQuestions}
          onChange={e => setNumQuestions(Number(e.target.value))}
          className="quiz-input"
          style={{ marginBottom: 18 }}
        >
          {[3, 5, 10, 15, 20].map(n => (
            <option key={n} value={n}>{n} questions</option>
          ))}
        </select>

        {error && <div className="quiz-error">{error}</div>}

        <button
          onClick={handleStart}
          disabled={loading || !topic.trim()}
          className="quiz-start-btn"
        >
          {loading ? (
            <>
              <span style={{
                width: 16, height: 16,
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.6s linear infinite'
              }} />
              Generating Quiz...
            </>
          ) : (
            'Start Quiz'
          )}
        </button>
      </div>
    </div>
  )
}
