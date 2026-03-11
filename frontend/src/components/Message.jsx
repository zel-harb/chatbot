import ReactMarkdown from 'react-markdown'

export default function Message({ message, userInitials }) {
  const isBot = message.sender === 'bot'
  const isError = message.isError || (isBot && message.text?.startsWith('Error:'))

  const formatTime = (timestamp) => {
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // ── Fix 2: Error bubble ──
  if (isError) {
    return (
      <div className="msg-group flex justify-start gap-3 animate-fadeIn" style={{ animation: 'fadeUp .35s ease' }}>
        {/* Bot avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #FF7E5F, #FE5196)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, marginTop: 2
        }}>⚠️</div>
        <div style={{
          maxWidth: '70%',
          background: 'rgba(255,126,95,0.12)',
          border: '1px solid rgba(255,126,95,0.3)',
          borderRadius: '16px 16px 16px 4px',
          padding: '12px 16px',
          color: '#FFB09C',
          fontSize: 14
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#FF7E5F', fontSize: 12 }}>
            Connection Error
          </div>
          <div style={{ lineHeight: 1.5 }}>{message.text}</div>
          <span className="msg-time" style={{ fontSize: 11, color: 'rgba(255,176,156,0.5)', marginTop: 6, display: 'block' }}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    )
  }

  // ── Fix 3: Normal chat bubbles with avatars ──
  return (
    <div
      className="msg-group"
      style={{
        display: 'flex',
        justifyContent: isBot ? 'flex-start' : 'flex-end',
        gap: 10,
        animation: 'fadeUp .35s ease'
      }}
    >
      {/* Bot avatar (left) */}
      {isBot && (
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, marginTop: 2,
          boxShadow: '0 0 12px rgba(82,183,255,0.25)'
        }}>🤖</div>
      )}

      {/* Bubble */}
      <div
        className={isBot ? 'message-bubble' : 'message-bubble user-bubble'}
        style={{
          maxWidth: '70%',
          padding: '12px 16px',
          borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
          background: isBot
            ? 'rgba(255,255,255,0.05)'
            : 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
          border: isBot ? '1px solid rgba(255,255,255,0.08)' : 'none',
          color: isBot ? '#C8CEE0' : '#fff',
          fontSize: 14,
          lineHeight: 1.6,
          wordBreak: 'break-word'
        }}
      >
        <div className="markdown-content">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 {...props} />,
              h2: ({ node, ...props }) => <h2 {...props} />,
              h3: ({ node, ...props }) => <h3 {...props} />,
              p: ({ node, ...props }) => <p {...props} />,
              ul: ({ node, ...props }) => <ul {...props} />,
              ol: ({ node, ...props }) => <ol {...props} />,
              li: ({ node, ...props }) => <li {...props} />,
              code: ({ node, inline, ...props }) =>
                inline ? <code {...props} /> : <code {...props} />,
              pre: ({ node, ...props }) => <pre {...props} />,
              strong: ({ node, ...props }) => <strong {...props} />,
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        {/* Fix 7: Timestamp visible on hover only */}
        <span className="msg-time" style={{
          fontSize: 11,
          color: isBot ? 'rgba(200,206,224,0.4)' : 'rgba(255,255,255,0.5)',
          marginTop: 6,
          display: 'block'
        }}>
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* User avatar (right) */}
      {!isBot && (
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', marginTop: 2,
          fontFamily: 'inherit'
        }}>{userInitials || 'U'}</div>
      )}
    </div>
  )
}
