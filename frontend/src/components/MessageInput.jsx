import { useState, useRef, useEffect } from 'react'

/* ── SVG Icons ── */
const IconPaperclip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
)
const IconMic = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const IconSend = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IconFile = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
)

export default function MessageInput({ onSendMessage, isLoading, onFileUpload, uploadedFile, isUploading }) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px'
    }
  }, [text])

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return
    onSendMessage(text.trim())
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileClick = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileUpload(file)
    e.target.value = ''
  }

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert('Speech recognition not supported in this browser.')

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setText(prev => prev + transcript)
      setIsRecording(false)
    }
    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <div className={`input-container${focused ? ' focused' : ''}`}>
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="input-field"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ask ARIA anything..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className="input-action-btn"
              onClick={handleFileClick}
              title="Attach file"
              disabled={isUploading}
            >
              <IconPaperclip />
            </button>
            <button
              className={`input-action-btn${isRecording ? ' recording' : ''}`}
              onClick={toggleVoice}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              <IconMic />
            </button>
            <button
              className="input-send-btn"
              onClick={handleSubmit}
              disabled={!text.trim() || isLoading}
            >
              {isLoading ? <span className="spinner" /> : <IconSend />}
            </button>
          </div>
          {(uploadedFile || isUploading) && (
            <div className="input-footer">
              {isUploading ? (
                <span className="input-tag"><span className="spinner" /> Uploading...</span>
              ) : uploadedFile ? (
                <span className="input-tag active"><IconFile /> {uploadedFile}</span>
              ) : null}
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.txt" hidden onChange={handleFileChange} />
        <div className="input-footer" style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 6 }}>
          <span className="input-shortcut">Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  )
}