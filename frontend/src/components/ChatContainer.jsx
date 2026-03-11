import Message from './Message'
import TypingIndicator from './TypingIndicator'

const suggestions = [
  { label: 'Explain a concept', desc: 'Break down complex topics simply' },
  { label: 'Write some code', desc: 'Generate code in any language' },
  { label: 'Debug my error', desc: 'Paste an error and get a fix' },
  { label: 'Plan a project', desc: 'Get a structured learning path' },
]

export default function ChatContainer({ messages, isLoading, messagesEndRef, userInitials, onSendMessage }) {
  const hasMessages = messages.length > 0

  return (
    <div className="messages-feed">
      {!hasMessages ? (
        <div className="welcome-screen">
          <div className="welcome-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="welcome-title">How can I help?</h1>
          <p className="welcome-sub">
            ARIA is your AI assistant for coding, learning, and building. Ask anything.
          </p>
          <div className="suggestions">
            {suggestions.map((s, i) => (
              <div key={i} className="suggestion-card" onClick={() => onSendMessage(s.label)}>
                <div className="suggestion-label">{s.label}</div>
                <div className="suggestion-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map(msg => (
            <Message key={msg.id} message={msg} userInitials={userInitials} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}
