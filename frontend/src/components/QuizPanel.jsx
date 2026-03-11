import { useState, useEffect } from 'react'

const BACKEND = 'http://localhost:5000'
const LOCAL_KEY = 'aria_quiz_history'

export default function QuizPanel({ authToken, onClose, onSaveToChat }) {
  // ── Tabs: 'setup' | 'quiz' | 'result' | 'history' ──
  const [tab, setTab] = useState('setup')
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [questions, setQuestions] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userAnswers, setUserAnswers] = useState([])

  // History
  const [quizHistory, setQuizHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Load history on mount ──
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`${BACKEND}/quiz/history`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setQuizHistory(data)
        // Sync to localStorage as backup
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
      } else {
        throw new Error('backend')
      }
    } catch {
      // Fallback to localStorage
      try {
        const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
        setQuizHistory(local)
      } catch { /* empty */ }
    } finally {
      setHistoryLoading(false)
    }
  }

  // ── Generate quiz ──
  const handleStart = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND}/quiz`, {
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
      setSelectedAnswer(null)
      setShowExplanation(false)
      setAnswered(false)
      setUserAnswers([])
      setTab('quiz')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Select answer ──
  const handleSelect = (letter) => {
    if (answered) return
    setSelectedAnswer(letter)
    setAnswered(true)
    setShowExplanation(true)
    setUserAnswers(prev => [...prev, letter])
    if (letter === questions[currentIndex].correct) {
      setScore(s => s + 1)
    }
  }

  // ── Next / Finish ──
  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      // Calculate final score (current score + this question if correct)
      const finalScore = score
      const pct = Math.round((finalScore / questions.length) * 100)

      // Save to backend
      const result = {
        topic,
        score: finalScore,
        total: questions.length,
        percentage: pct,
        questions: questions.map((q, i) => ({
          question: q.question,
          correct: q.correct,
          user_answer: userAnswers[i] || null,
          was_correct: (userAnswers[i] || null) === q.correct
        }))
      }
      saveQuizResult(result)

      // Save to chat
      if (onSaveToChat) {
        let summary = `**Quiz Results: ${topic}**\n`
        summary += `Score: **${finalScore}/${questions.length}** (${pct}%)\n\n`
        questions.forEach((q, i) => {
          summary += `**Q${i + 1}.** ${q.question}\n`
          summary += `Answer: **${q.correct}** — ${q.explanation}\n\n`
        })
        onSaveToChat(summary)
      }

      setTab('result')
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setAnswered(false)
    }
  }

  // ── Save quiz to backend + localStorage ──
  const saveQuizResult = async (result) => {
    // Backend
    try {
      await fetch(`${BACKEND}/quiz/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(result)
      })
    } catch (e) { console.error('Quiz save failed:', e) }

    // localStorage backup
    try {
      const history = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
      history.unshift({ ...result, taken_at: new Date().toISOString() })
      localStorage.setItem(LOCAL_KEY, JSON.stringify(history.slice(0, 20)))
    } catch { /* ignore */ }

    // Refresh history
    loadHistory()
  }

  // ── Restart ──
  const handleRestart = () => {
    setQuestions(null)
    setTopic('')
    setScore(0)
    setCurrentIndex(0)
    setUserAnswers([])
    setTab('setup')
  }

  const q = questions?.[currentIndex]

  /* ═══════════════════════════════════════
     RESULT SCREEN
     ═══════════════════════════════════════ */
  if (tab === 'result' && questions) {
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
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            <button className="quiz-next-btn" onClick={handleRestart}>New Quiz</button>
            <button className="quiz-quit-btn" onClick={() => setTab('history')}>History</button>
            <button className="quiz-quit-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════
     QUESTION SCREEN
     ═══════════════════════════════════════ */
  if (tab === 'quiz' && questions && q) {
    const isCorrectAnswer = selectedAnswer === q.correct
    return (
      <div className="quiz-overlay">
        <div className="quiz-modal">
          <div className="quiz-top">
            <span className="quiz-counter">
              Question {currentIndex + 1} / {questions.length}
            </span>
            <span className="quiz-score">Score: {score}</span>
          </div>

          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>

          <h3 className="quiz-question">{q.question}</h3>

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
                <button key={letter} onClick={() => handleSelect(letter)} disabled={answered} className={cls}>
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{letter})</span>
                  {opt.replace(/^[A-D]\)\s*/, '')}
                  {answered && isCorrect && <span style={{ float: 'right' }}>✓</span>}
                  {answered && isSelected && !isCorrect && <span style={{ float: 'right' }}>✗</span>}
                </button>
              )
            })}
          </div>

          {showExplanation && (
            <div className={`quiz-explanation ${isCorrectAnswer ? 'correct-exp' : 'wrong-exp'}`}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                {isCorrectAnswer ? '✓ Correct!' : `✗ Incorrect — answer is ${q.correct}`}
              </p>
              <p>{q.explanation}</p>
            </div>
          )}

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

  /* ═══════════════════════════════════════
     HISTORY SCREEN
     ═══════════════════════════════════════ */
  if (tab === 'history') {
    return (
      <div className="quiz-overlay">
        <div className="quiz-modal">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 className="font-brand" style={{ fontSize: 20, fontWeight: 800, color: '#E4E8F5' }}>
              Quiz History
            </h2>
            <button
              onClick={() => setTab('setup')}
              style={{ background: 'none', border: 'none', color: '#525C78', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#7A82A0', fontSize: 13 }}>
              Loading history...
            </div>
          ) : quizHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#525C78', fontSize: 13 }}>
              No quizzes taken yet
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {quizHistory.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', marginBottom: 6,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E4E8F5' }}>{h.topic}</div>
                    <div style={{ fontSize: 11, color: '#525C78' }}>
                      {h.score}/{h.total} · {h.taken_at ? new Date(h.taken_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display, Syne, sans-serif)',
                    color: (h.percentage ?? 0) >= 80 ? '#23C55E' : (h.percentage ?? 0) >= 50 ? '#F59E0B' : '#EF4444'
                  }}>
                    {h.percentage ?? Math.round((h.score / h.total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            <button className="quiz-next-btn" onClick={() => setTab('setup')}>New Quiz</button>
            <button className="quiz-quit-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════
     SETUP SCREEN
     ═══════════════════════════════════════ */
  return (
    <div className="quiz-overlay">
      <div className="quiz-modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="font-brand" style={{ fontSize: 20, fontWeight: 800, color: '#E4E8F5' }}>
            📝 Quiz Mode
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {quizHistory.length > 0 && (
              <button
                onClick={() => setTab('history')}
                style={{
                  background: 'rgba(82,183,255,0.08)', border: '1px solid rgba(82,183,255,0.2)',
                  color: '#52B7FF', padding: '5px 10px', borderRadius: 6,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                History ({quizHistory.length})
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#525C78', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
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
