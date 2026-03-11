import { useState, useRef, useEffect } from 'react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function MessageInput({ onSendMessage, isLoading, onFileUpload, uploadedFile, isUploading }) {
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setMessage(() => {
        const base = recognitionRef.current?._baseText || ''
        return base ? base + ' ' + transcript : transcript
      })
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognitionRef.current = recognition
    return () => recognition.abort()
  }, [])

  const toggleListening = () => {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Edge.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current._baseText = message
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
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

  const handleFileClick = () => fileInputRef.current?.click()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) onFileUpload(file)
    e.target.value = ''
  }

  // ── Shared icon-button style ──
  const iconBtn = {
    background: 'none',
    border: 'none',
    color: '#7A839E',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    transition: 'color 0.2s'
  }

  return (
    <div style={{
      padding: '12px 24px 16px',
      background: 'transparent',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Uploaded file pill */}
      {uploadedFile && (
        <div style={{ maxWidth: 720, margin: '0 auto 8px', paddingLeft: 4 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 8,
            background: 'rgba(82,183,255,0.1)', border: '1px solid rgba(82,183,255,0.2)',
            color: '#52B7FF', fontSize: 12
          }}>
            📎 <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile}</span> ✓
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: '#182030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '8px 12px',
          transition: 'border-color 0.25s, box-shadow 0.25s'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(82,183,255,0.35)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(82,183,255,0.08)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        >
          {/* File attach */}
          <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={handleFileClick}
            disabled={isLoading || isUploading}
            style={{ ...iconBtn, opacity: isLoading || isUploading ? 0.4 : 1 }}
            title="Upload PDF or TXT (max 5MB)"
          >
            {isUploading ? (
              <span style={{ width: 18, height: 18, border: '2px solid #52B7FF', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message ARIA…"
            rows="1"
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: '#E4E8F5',
              fontSize: 14,
              lineHeight: '22px',
              padding: '6px 4px',
              minHeight: 36,
              maxHeight: 120,
              fontFamily: 'inherit'
            }}
          />

          {/* Voice button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            style={{
              ...iconBtn,
              color: isListening ? '#FF5C5C' : '#7A839E',
              animation: isListening ? 'pulse 1.2s infinite' : 'none',
              opacity: isLoading ? 0.4 : 1
            }}
            title={isListening ? 'Stop recording' : 'Voice input'}
          >
            {isListening ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              cursor: !message.trim() || isLoading ? 'not-allowed' : 'pointer',
              background: !message.trim() || isLoading
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
              color: !message.trim() || isLoading ? '#4A5270' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s',
              flexShrink: 0,
              boxShadow: message.trim() && !isLoading
                ? '0 0 16px rgba(82,183,255,0.3)'
                : 'none'
            }}
          >
            {isLoading ? (
              <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
