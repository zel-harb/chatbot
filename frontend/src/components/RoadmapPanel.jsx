import { useState, useEffect } from 'react'

const BACKEND = 'http://localhost:5000'
const LOCAL_KEY = 'aria_roadmap_saved'

export default function RoadmapPanel({ authToken, onClose, onSaveToChat }) {
  // ── Tabs: 'setup' | 'view' ──
  const [tab, setTab] = useState('setup')
  const [technology, setTechnology] = useState('')
  const [level, setLevel] = useState('beginner')
  const [weeks, setWeeks] = useState(null)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState({})
  const [roadmapId, setRoadmapId] = useState(null)

  // Saved roadmaps list
  const [savedRoadmaps, setSavedRoadmaps] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)

  // ── Load saved roadmaps on mount ──
  useEffect(() => {
    loadSavedRoadmaps()
  }, [])

  const loadSavedRoadmaps = async () => {
    setSavedLoading(true)
    try {
      const res = await fetch(`${BACKEND}/roadmap/list`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSavedRoadmaps(data)
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
      } else {
        throw new Error('backend')
      }
    } catch {
      try {
        const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
        setSavedRoadmaps(local)
      } catch { /* empty */ }
    } finally {
      setSavedLoading(false)
    }
  }

  // ── Save roadmap to backend ──
  const saveToBackend = async (id, roadmapData, completedItems) => {
    try {
      await fetch(`${BACKEND}/roadmap/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          roadmap_id: id,
          roadmap_data: roadmapData,
          completed_items: Object.keys(completedItems).filter(k => completedItems[k])
        })
      })
    } catch (e) { console.error('Roadmap save failed:', e) }

    // localStorage backup
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
      const idx = local.findIndex(r => r.roadmap_id === id)
      const entry = {
        roadmap_id: id,
        roadmap_data: roadmapData,
        completed_items: Object.keys(completedItems).filter(k => completedItems[k]),
        updated_at: new Date().toISOString()
      }
      if (idx >= 0) local[idx] = entry
      else local.unshift(entry)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
    } catch { /* ignore */ }
  }

  // ── Generate roadmap ──
  const handleGenerate = async () => {
    if (!technology.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND}/roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ technology: technology.trim(), level })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap')

      const id = `roadmap_${technology.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
      const roadmapData = {
        technology: data.technology,
        level: data.level,
        weeks: data.weeks,
        total_items: data.weeks.reduce((s, w) => s + w.goals.length, 0)
      }

      setWeeks(data.weeks)
      setMeta({ technology: data.technology, level: data.level })
      setChecked({})
      setRoadmapId(id)

      // Save to backend immediately
      await saveToBackend(id, roadmapData, {})
      loadSavedRoadmaps()

      // Save to chat
      if (onSaveToChat) {
        let summary = `**Learning Roadmap: ${data.technology}**\n`
        summary += `Level: ${data.level.charAt(0).toUpperCase() + data.level.slice(1)} · ${data.weeks.length} weeks\n\n`
        data.weeks.forEach(week => {
          summary += `**Week ${week.week}: ${week.title}**\n`
          week.goals.forEach(goal => { summary += `- ${goal}\n` })
          if (week.resources?.length) summary += `Resources: ${week.resources.join(', ')}\n`
          summary += '\n'
        })
        onSaveToChat(summary)
      }

      setTab('view')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Load a saved roadmap ──
  const loadRoadmap = (saved) => {
    const rd = saved.roadmap_data
    setWeeks(rd.weeks)
    setMeta({ technology: rd.technology, level: rd.level })
    setTechnology(rd.technology)
    setRoadmapId(saved.roadmap_id)

    // Restore checked state from completed_items array
    const checkedMap = {}
    ;(saved.completed_items || []).forEach(id => { checkedMap[id] = true })
    setChecked(checkedMap)
    setTab('view')
  }

  // ── Delete a saved roadmap ──
  const deleteRoadmap = async (id) => {
    try {
      await fetch(`${BACKEND}/roadmap/delete/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
    } catch { /* ignore */ }

    // Remove from localStorage too
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
      localStorage.setItem(LOCAL_KEY, JSON.stringify(local.filter(r => r.roadmap_id !== id)))
    } catch { /* ignore */ }

    setSavedRoadmaps(prev => prev.filter(r => r.roadmap_id !== id))
  }

  // ── Toggle goal checkbox ──
  const toggleGoal = (weekIdx, goalIdx) => {
    const id = `w${weekIdx}-g${goalIdx}`
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      // Save to backend
      if (roadmapId && meta) {
        const roadmapData = {
          technology: meta.technology,
          level: meta.level,
          weeks,
          total_items: weeks.reduce((s, w) => s + w.goals.length, 0)
        }
        saveToBackend(roadmapId, roadmapData, next)
      }
      return next
    })
  }

  // ── Progress ──
  const totalGoals = weeks ? weeks.reduce((s, w) => s + w.goals.length, 0) : 0
  const completedGoals = Object.values(checked).filter(Boolean).length
  const progressPct = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0

  /* ═══════════════════════════════════════
     ROADMAP VIEW
     ═══════════════════════════════════════ */
  if (tab === 'view' && weeks && weeks.length > 0) {
    return (
      <div className="roadmap-overlay">
        <div className="roadmap-modal">
          {/* Header */}
          <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 className="roadmap-title">🗺️ {meta.technology} Roadmap</h2>
                <p className="roadmap-subtitle">
                  {meta.level.charAt(0).toUpperCase() + meta.level.slice(1)} · {weeks.length} weeks
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
                  <div className="roadmap-badge">{week.week}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="roadmap-step-title">Week {week.week}: {week.title}</span>
                      {weekDone && <span style={{ fontSize: 10, color: '#00E5C3', fontWeight: 600 }}>✓ Complete</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {week.goals.map((goal, gi) => {
                        const id = `w${week.week}-g${gi}`
                        return (
                          <div key={gi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }} onClick={() => toggleGoal(week.week, gi)}>
                            <div className={`roadmap-checkbox${checked[id] ? ' checked' : ''}`}>
                              {checked[id] && '✓'}
                            </div>
                            <span style={{
                              fontSize: 12.5, lineHeight: 1.5,
                              color: checked[id] ? '#525C78' : '#9AA3BF',
                              textDecoration: checked[id] ? 'line-through' : 'none'
                            }}>{goal}</span>
                          </div>
                        )
                      })}
                    </div>
                    {week.resources?.length > 0 && (
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
          <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
            <button className="quiz-quit-btn" onClick={() => { setTab('setup'); setWeeks(null); setMeta(null); setChecked({}); loadSavedRoadmaps() }}>
              Back
            </button>
            <button className="quiz-next-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════
     SETUP SCREEN + SAVED ROADMAPS
     ═══════════════════════════════════════ */
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

        {/* ── Saved Roadmaps ── */}
        {savedRoadmaps.length > 0 && (
          <div style={{
            marginBottom: 18, padding: '14px 16px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '1px',
              textTransform: 'uppercase', color: '#525C78', marginBottom: 10
            }}>
              Saved Roadmaps
            </div>
            {savedRoadmaps.map(r => {
              const rd = r.roadmap_data || {}
              const total = rd.total_items || rd.weeks?.reduce((s, w) => s + (w.goals?.length || 0), 0) || 1
              const done = (r.completed_items || []).length
              const pct = Math.round((done / total) * 100)
              return (
                <div key={r.roadmap_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  transition: 'background 0.12s', marginBottom: 4
                }}
                  onClick={() => loadRoadmap(r)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E4E8F5' }}>
                      {rd.technology || 'Untitled'}
                    </div>
                    <div style={{ fontSize: 11, color: '#525C78' }}>
                      {done}/{total} completed · {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#52B7FF' }}>{pct}%</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRoadmap(r.roadmap_id) }}
                      style={{
                        background: 'none', border: 'none', color: '#525C78',
                        fontSize: 14, cursor: 'pointer', padding: '2px 4px', lineHeight: 1
                      }}
                      title="Delete roadmap"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

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
