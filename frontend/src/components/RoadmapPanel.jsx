import { useState, useEffect } from 'react'

const STORAGE_KEY = 'roadmap_progress'

export default function RoadmapPanel({ authToken, onClose }) {
  const [technology, setTechnology] = useState('')
  const [level, setLevel] = useState('beginner')
  const [weeks, setWeeks] = useState(null)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState({})

  // Load saved progress from localStorage when roadmap is generated
  useEffect(() => {
    if (meta) {
      const key = `${STORAGE_KEY}_${meta.technology}_${meta.level}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try { setChecked(JSON.parse(saved)) } catch { /* ignore */ }
      }
    }
  }, [meta])

  // Persist checked state
  const toggleGoal = (weekIdx, goalIdx) => {
    const id = `w${weekIdx}-g${goalIdx}`
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (meta) {
        localStorage.setItem(`${STORAGE_KEY}_${meta.technology}_${meta.level}`, JSON.stringify(next))
      }
      return next
    })
  }

  const handleGenerate = async () => {
    if (!technology.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:5000/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ technology: technology.trim(), level })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap')

      setWeeks(data.weeks)
      setMeta({ technology: data.technology, level: data.level })
      setChecked({})
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate overall progress
  const totalGoals = weeks ? weeks.reduce((s, w) => s + w.goals.length, 0) : 0
  const completedGoals = Object.values(checked).filter(Boolean).length
  const progressPct = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0

  /* ── Roadmap view ── */
  if (weeks && weeks.length > 0) {
    return (
      <div className="roadmap-overlay">
        <div className="roadmap-modal">
          {/* Header */}
          <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 className="roadmap-title">🗺️ {meta.technology} Roadmap</h2>
                <p className="roadmap-subtitle">
                  {meta.level.charAt(0).toUpperCase() + meta.level.slice(1)} · 8 weeks
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: '#525C78', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="roadmap-progress-track">
                <div className="roadmap-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#52B7FF', whiteSpace: 'nowrap' }}>
                {completedGoals}/{totalGoals} ({progressPct}%)
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {weeks.map((week, wi) => {
              const weekGoals = week.goals.map((_, gi) => `w${week.week}-g${gi}`)
              const weekDone = weekGoals.every(id => checked[id])

              return (
                <div key={week.week} className={`roadmap-step${weekDone ? ' completed' : ''}`}>
                  {/* Badge */}
                  <div className="roadmap-badge">{week.week}</div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="roadmap-step-title">Week {week.week}: {week.title}</span>
                      {weekDone && <span style={{ fontSize: 10, color: '#00E5C3', fontWeight: 600 }}>✓ Complete</span>}
                    </div>

                    {/* Goals as checkboxes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {week.goals.map((goal, gi) => {
                        const id = `w${week.week}-g${gi}`
                        return (
                          <div
                            key={gi}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
                            onClick={() => toggleGoal(week.week, gi)}
                          >
                            <div className={`roadmap-checkbox${checked[id] ? ' checked' : ''}`}>
                              {checked[id] && '✓'}
                            </div>
                            <span style={{
                              fontSize: 12.5,
                              lineHeight: 1.5,
                              color: checked[id] ? '#525C78' : '#9AA3BF',
                              textDecoration: checked[id] ? 'line-through' : 'none'
                            }}>
                              {goal}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Resources */}
                    {week.resources.length > 0 && (
                      <div className="roadmap-resources">
                        <p className="roadmap-resources-label">📚 Resources</p>
                        {week.resources.map((res, ri) => (
                          <div key={ri} className="roadmap-resource-item">• {res}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            flexShrink: 0
          }}>
            <button
              className="quiz-quit-btn"
              onClick={() => { setWeeks(null); setMeta(null); setChecked({}) }}
            >
              New Roadmap
            </button>
            <button className="quiz-next-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Setup screen ── */
  return (
    <div className="roadmap-overlay">
      <div className="quiz-modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="font-brand" style={{ fontSize: 20, fontWeight: 800, color: '#E4E8F5' }}>
            🗺️ Learning Roadmap
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#525C78', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        <label className="quiz-label">Technology</label>
        <input
          type="text"
          value={technology}
          onChange={e => setTechnology(e.target.value)}
          placeholder="e.g. React, Python, Docker, Kubernetes..."
          className="quiz-input"
          style={{ marginBottom: 14 }}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />

        <label className="quiz-label">Current Level</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {['beginner', 'intermediate'].map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`roadmap-level-btn${level === l ? ' active' : ''}`}
            >
              {l === 'beginner' ? '🌱 Beginner' : '🌿 Intermediate'}
            </button>
          ))}
        </div>

        {error && <div className="quiz-error">{error}</div>}

        <button
          onClick={handleGenerate}
          disabled={loading || !technology.trim()}
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
              Generating Roadmap...
            </>
          ) : (
            'Generate 8-Week Roadmap'
          )}
        </button>
      </div>
    </div>
  )
}
