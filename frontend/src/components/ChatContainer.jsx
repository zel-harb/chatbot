import Message from './Message'
import TypingIndicator from './TypingIndicator'

export default function ChatContainer({ messages, isLoading, messagesEndRef }) {
  return (
    <div className="flex-1 overflow-y-auto message-container bg-gradient-to-br from-primary-50/60 via-primary-100/40 to-primary-200/30 backdrop-blur-sm">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-primary-900">Start a conversation</h2>
                <p className="text-primary-700">Ask me anything and I'll help you out!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
