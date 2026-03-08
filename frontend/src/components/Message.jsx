import ReactMarkdown from 'react-markdown'

export default function Message({ message }) {
  const isBot = message.sender === 'bot'
  
  const formatTime = (timestamp) => {
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-fadeIn`}>
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl shadow-sm transition-all message-bubble ${
          isBot
            ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-gray-800 rounded-bl-none'
            : 'bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-br-none'
        }`}
      >
        <div className="text-sm sm:text-base leading-relaxed break-words markdown-content">
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
        <span className={`text-xs mt-2 block ${isBot ? 'text-gray-600' : 'text-primary-100'}`}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
