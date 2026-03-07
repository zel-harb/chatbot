import { useState, useRef } from 'react'

export default function MessageInput({ onSendMessage, isLoading }) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInput = (e) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border-t border-primary-200 shadow-lg">
      <form onSubmit={handleSubmit} className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows="1"
              disabled={isLoading}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-primary-300 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-400/30 resize-none transition-colors disabled:opacity-50 text-sm sm:text-base placeholder-gray-400"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="flex-shrink-0 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 active:from-primary-900 active:to-primary-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            style={{ minHeight: '44px' }}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent border-r-transparent rounded-full animate-spin"></span>
                <span className="hidden sm:inline">Sending</span>
              </>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
