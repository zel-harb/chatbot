import ReactMarkdown from 'react-markdown'

const IconBot = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
)

const IconCopy = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

export default function Message({ message, userInitials }) {
  const isBot = message.sender === 'bot'
  const isError = message.isError

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.text)
  }

  if (isError) {
    return (
      <div className="msg-group" style={{ animation: 'msgIn 0.25s ease both' }}>
        <div className="msg-avatar ai" style={{ color: 'var(--error)' }}>
          <IconAlert />
        </div>
        <div>
          <div className="bubble error">
            <div className="error-label">Error</div>
            <div>{message.text}</div>
          </div>
          <div className="msg-time">{formatTime(message.timestamp)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`msg-group${isBot ? '' : ' user'}`}>
      {isBot ? (
        <div className="msg-avatar ai"><IconBot /></div>
      ) : (
        <div className="msg-avatar human">{userInitials}</div>
      )}
      <div>
        {isBot && <div className="msg-label ai-label">ARIA</div>}
        <div className={`bubble${isBot ? ' ai' : ' human'}`}>
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="msg-time">{formatTime(message.timestamp)}</div>
          {isBot && message.text && (
            <div className="bubble-actions">
              <button className="bubble-action" onClick={handleCopy}>
                <IconCopy /> Copy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
