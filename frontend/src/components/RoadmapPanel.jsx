import { useState, useEffect } from 'react'

const STORAGE_KEY = 'aria_roadmap_progress'

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconCheck = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function RoadmapPanel({ authToken, onClose }) {
  const [phase, setPhase] = useState('setup') // setup | view
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('beginner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const [checkedGoals, setCheckedGoals] = useState({})

  // Load saved progress
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setCheckedGoals(saved)
    } catch {}
  }, [])

  const saveProgress = (updated) => {
    setCheckedGoals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const toggleGoal = (stepIdx, goalIdx) => {
    const key = `${topic}_${stepIdx}_${goalIdx}`
    const updated = { ...checkedGoals, [key]: !checkedGoals[key] }
    saveProgress(updated)
  }

  const isChecked = (stepIdx, goalIdx) => {
    return !!checkedGoals[`${topic}_${stepIdx}_${goalIdx}`]
  }

  const generateRoadmap = async () => {
    if (!topic.trim()) { setError('Please enter a topic.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ topic: topic.trim(), level })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap')
      if (!data.steps?.length) throw new Error('No steps returned')
      setRoadmap(data)
      setPhase('view')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate progress
  const totalGoals = roadmap?.steps?.reduce((sum, s) => sum + (s.goals?.length || 0), 0) || 0
  const completedGoals = roadmap?.steps?.reduce((sum, s, si) =>
    sum + (s.goals?.filter((_, gi) => isChecked(si, gi)).length || 0), 0) || 0
  const pct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  const isStepDone = (stepIdx) => {
    const step = roadmap?.steps?.[stepIdx]
    if (!step?.goals?.length) return false
    return step.goals.every((_, gi) => isChecked(stepIdx, gi))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box${phase === 'view' ? ' wide flex-col' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {phase === 'setup' ? 'Generate Roadmap' : roadmap?.title || 'Learning Roadmap'}
          </span>
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
                placeholder="e.g. Python, System Design, DevOps"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Level</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['beginner', 'intermediate', 'advanced'].map(l => (
                  <button
                    key={l}
                    className={`level-btn${level === l ? ' active' : ''}`}
                    onClick={() => setLevel(l)}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary full" onClick={generateRoadmap} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Generating...' : 'Generate Roadmap'}
            </button>
          </div>
        )}

        {/* ── Roadmap View ── */}
        {phase === 'view' && roadmap && (
          <>
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div className="roadmap-progress">
                <div className="roadmap-progress-bar" style={{ width: `${pct}%` }} />
              </div>
              <span className="roadmap-pct">{pct}%</span>
            </div>

            {/* Steps */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
              {roadmap.steps.map((step, si) => (
                <div key={si} className={`roadmap-step${isStepDone(si) ? ' done' : ''}`}>
                  <div className="step-badge">{si + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div className="step-title">{step.title}</div>
                    {step.goals?.map((goal, gi) => (
                      <div key={gi} className="step-goal" onClick={() => toggleGoal(si, gi)}>
                        <div className={`step-check${isChecked(si, gi) ? ' checked' : ''}`}>
                          {isChecked(si, gi) && <IconCheck />}
                        </div>
                        <span className={`step-goal-text${isChecked(si, gi) ? ' done' : ''}`}>
                          {goal}
                        </span>
                      </div>
                    ))}
                    {step.resources?.length > 0 && (
                      <div className="step-resources">
                        <div className="step-resources-label">Resources</div>
                        {step.resources.map((r, ri) => (
                          <div key={ri} className="step-resource-item">{r}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-dim)' }}>
              <button className="btn-ghost" onClick={() => setPhase('setup')}>New Roadmap</button>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}