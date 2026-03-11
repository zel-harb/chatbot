import Message from './Message'
import TypingIndicator from './TypingIndicator'

export default function ChatContainer({ messages, isLoading, messagesEndRef, userInitials, onRemoveFile, onSendMessage }) {
  return (
    <div
      className="message-container"
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'transparent'
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', textAlign: 'center'
          }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#C8CEE0', marginBottom: 8 }}>
                Start a conversation
              </h2>
              <p style={{ color: '#5A6280', fontSize: 14 }}>
                Ask me anything and I'll help you out!
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                userInitials={userInitials}
                onRemoveFile={onRemoveFile}
                onSendMessage={onSendMessage}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
