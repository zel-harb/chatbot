const IconHash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
)
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
)
const IconX = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)

export default function HistorySidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onClearHistory,
  onNewChat,
  userInitials,
  username
}) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diff = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24))
      if (diff === 0) return 'Today'
      if (diff === 1) return 'Yesterday'
      if (diff < 7) return `${diff}d ago`
      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    } catch { return '' }
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="brand-name">ARIA</span>
      </div>

      {/* New chat */}
      <button className="new-chat-btn" onClick={onNewChat}>
        <IconPlus /> New conversation
      </button>

      {/* History list */}
      <div className="sidebar-section">History</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: '20px 16px', color: 'var(--text-disabled)', fontSize: 12, textAlign: 'center' }}>
            No conversations yet
          </div>
        ) : (
          conversations.map(c => (
            <div
              key={c.id}
              className={`history-item${c.id === currentConversationId ? ' active' : ''}`}
              onClick={() => onSelectConversation(c.id)}
            >
              <IconHash />
              <span className="line-clamp-1" style={{ flex: 1 }}>
                {c.preview || 'New conversation'}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onDeleteConversation(c.id) }}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-disabled)',
                  cursor: 'pointer', padding: 2,
                  display: 'flex', alignItems: 'center',
                  opacity: 0, transition: 'opacity 0.12s'
                }}
                className="del-btn"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}
              >
                <IconX />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">{userInitials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{username}</div>
          <div className="user-role">Free plan</div>
        </div>
        {conversations.length > 0 && (
          <button
            onClick={onClearHistory}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-disabled)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', padding: 4
            }}
            title="Clear all history"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}
          >
            <IconTrash />
          </button>
        )}
      </div>

      {/* Make delete buttons visible on hover via CSS-in-JS */}
      <style>{`
        .history-item:hover .del-btn { opacity: 1 !important; }
      `}</style>
    </aside>
  )
}
