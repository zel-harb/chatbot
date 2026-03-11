const IconBot = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
)

export default function TypingIndicator() {
  return (
    <div className="msg-group" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="msg-avatar ai"><IconBot /></div>
      <div>
        <div className="msg-label ai-label">ARIA</div>
        <div className="typing-indicator">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  )
}