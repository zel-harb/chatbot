export default function HistorySidebar({
  isOpen,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onClearHistory,
  onClose
}) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return date.toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 20, backdropFilter: 'blur(4px)'
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh',
        width: 260,
        background: '#111828',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        zIndex: 30,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1.5, color: '#5A6280', marginBottom: 4
          }}>
            CONVERSATIONS
          </div>
          <span style={{ fontSize: 12, color: '#4A5270' }}>
            {conversations.length} chat{conversations.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#4A5270', fontSize: 13 }}>
              <p>No conversations yet</p>
              <p style={{ fontSize: 11, marginTop: 6 }}>Start chatting to build history</p>
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  marginBottom: 2,
                  background: c.id === currentConversationId
                    ? 'rgba(82,183,255,0.1)'
                    : 'transparent',
                  borderLeft: c.id === currentConversationId
                    ? '3px solid #52B7FF'
                    : '3px solid transparent',
                  transition: 'all 0.15s',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (c.id !== currentConversationId)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.querySelector('.del-btn').style.opacity = 1
                }}
                onMouseLeave={e => {
                  if (c.id !== currentConversationId)
                    e.currentTarget.style.background = 'transparent'
                  e.currentTarget.querySelector('.del-btn').style.opacity = 0
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>💬</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: '#C8CEE0',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {c.preview || 'New conversation'}
                  </div>
                  <div style={{ fontSize: 11, color: '#4A5270', marginTop: 2 }}>
                    {formatDate(c.lastUpdated || c.createdAt)}
                  </div>
                </div>

                {/* Delete */}
                <button
                  className="del-btn"
                  onClick={(e) => { e.stopPropagation(); onDeleteConversation(c.id) }}
                  style={{
                    background: 'none', border: 'none',
                    color: '#FF7E5F', fontSize: 14, cursor: 'pointer',
                    opacity: 0, transition: 'opacity 0.15s',
                    padding: 2
                  }}
                  title="Delete"
                >×</button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {conversations.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              onClick={onClearHistory}
              style={{
                width: '100%', padding: '8px 0',
                background: 'rgba(255,126,95,0.08)',
                border: '1px solid rgba(255,126,95,0.15)',
                borderRadius: 8,
                color: '#FF7E5F',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,126,95,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,126,95,0.08)'
              }}
            >
              Clear All History
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
