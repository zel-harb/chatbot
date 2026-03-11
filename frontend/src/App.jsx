import { useState, useRef, useEffect } from 'react'
import ChatContainer from './components/ChatContainer'
import MessageInput from './components/MessageInput'
import HistorySidebar from './components/HistorySidebar'
import Login from './components/Login'
import QuizPanel from './components/QuizPanel'
import RoadmapPanel from './components/RoadmapPanel'

/* ── SVG Icons ── */
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)
const IconMap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
)
const IconBrain = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 2 2.83V11a4 4 0 0 1-1.17 2.83A4 4 0 0 1 18 16v1a3 3 0 0 1-3 3h-1a4 4 0 0 1-4-4h0a4 4 0 0 1-4 4H5a3 3 0 0 1-3-3v-1a4 4 0 0 1 1.17-2.17A4 4 0 0 1 2 11V9.83A3 3 0 0 1 4 7V6a4 4 0 0 1 4-4h0"/><path d="M12 2v20"/></svg>
)
const IconLogOut = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setAuthToken(savedToken)
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const savedConversations = localStorage.getItem(`chatbot_conversations_${user?.id}`)
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations)
        setConversations(parsed)
        if (parsed.length > 0) {
          setCurrentConversationId(parsed[0].id)
          setMessages(parsed[0].messages)
        } else {
          startNewConversation()
        }
      } catch {
        startNewConversation()
      }
    } else {
      startNewConversation()
    }
  }, [isAuthenticated, user])

  useEffect(() => { scrollToBottom() }, [messages])

  const startNewConversation = () => {
    setMessages([])
    setCurrentConversationId(Date.now().toString())
  }

  const saveConversation = (updatedMessages) => {
    const updatedConversations = [...conversations]
    const existingIndex = updatedConversations.findIndex(c => c.id === currentConversationId)
    const messagePreview = updatedConversations[existingIndex]?.preview ||
      updatedMessages.filter(m => m.sender === 'user').map(m => m.text).join(' ').substring(0, 50) ||
      'New conversation'
    if (existingIndex >= 0) {
      updatedConversations[existingIndex] = {
        ...updatedConversations[existingIndex],
        messages: updatedMessages,
        lastUpdated: new Date().toISOString()
      }
      updatedConversations.splice(0, 0, updatedConversations.splice(existingIndex, 1)[0])
    } else {
      updatedConversations.unshift({
        id: currentConversationId,
        messages: updatedMessages,
        preview: messagePreview,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      })
    }
    setConversations(updatedConversations)
    localStorage.setItem(`chatbot_conversations_${user?.id}`, JSON.stringify(updatedConversations))
  }

  const handleLoginSuccess = (userData, token) => {
    setUser(userData)
    setAuthToken(token)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
    setAuthToken(null)
    setMessages([])
    setConversations([])
  }

  const handleSendMessage = async (text) => {
    if (!text.trim()) return
    const userMessage = {
      id: messages.length + 1,
      text,
      sender: 'user',
      timestamp: new Date().toISOString()
    }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    const botMessage = {
      id: updatedMessages.length + 1,
      text: '',
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
    const messagesWithBot = [...updatedMessages, botMessage]
    setMessages(messagesWithBot)

    try {
      const response = await fetch('http://localhost:5000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ message: text, session_id: currentConversationId })
      })

      if (!response.ok) {
        if (response.status === 422) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
          setUser(null)
          setAuthToken(null)
          throw new Error('Session expired. Please log in again.')
        }
        let serverMsg = `Backend error: ${response.status}`
        try {
          const errData = await response.json()
          if (errData.msg) serverMsg = errData.msg
          if (errData.error) serverMsg = errData.error
        } catch {}
        throw new Error(serverMsg)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let botText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') { setIsLoading(false); break }
            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                const errType = parsed.error_type || 'general'
                botText = errType === 'api_key'
                  ? `API Key Error: ${parsed.error}`
                  : `Error: ${parsed.error}`
              } else if (parsed.title) {
                setConversations(prev => {
                  const updated = [...prev]
                  const idx = updated.findIndex(c => c.id === currentConversationId)
                  if (idx >= 0) {
                    updated[idx] = { ...updated[idx], preview: parsed.title }
                  } else {
                    updated.unshift({
                      id: currentConversationId,
                      preview: parsed.title,
                      createdAt: new Date().toISOString(),
                      lastUpdated: new Date().toISOString(),
                      messages: []
                    })
                  }
                  localStorage.setItem(`chatbot_conversations_${user?.id}`, JSON.stringify(updated))
                  return updated
                })
                continue
              } else if (parsed.token) {
                botText += parsed.token
              }
              setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { ...next[next.length - 1], text: botText }
                return next
              })
            } catch (e) {
              if (data.trim()) console.error('SSE parse error:', e)
            }
          }
        }
      }
      setMessages(prev => { saveConversation(prev); return prev })
    } catch (error) {
      const errorMessage = {
        id: messagesWithBot.length,
        text: error.message,
        sender: 'bot',
        isError: true,
        timestamp: new Date().toISOString()
      }
      const finalMessages = [...messagesWithBot.slice(0, -1), errorMessage]
      setMessages(finalMessages)
      saveConversation(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'txt'].includes(ext)) { alert('Only PDF and TXT files are allowed.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return }
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('session_id', currentConversationId)
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')
      setUploadedFile(data.filename)
      const fileMessage = {
        id: messages.length + 1,
        text: `**File uploaded:** ${data.filename}\n\n_${data.message}_`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      const updatedMessages = [...messages, fileMessage]
      setMessages(updatedMessages)
      saveConversation(updatedMessages)
    } catch (error) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleNewChat = () => {
    saveConversation(messages)
    startNewConversation()
    setUploadedFile(null)
  }

  const handleLoadConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages)
    }
  }

  const handleClearHistory = () => {
    localStorage.removeItem(`chatbot_conversations_${user?.id}`)
    setConversations([])
    startNewConversation()
  }

  const handleDeleteConversation = (conversationId) => {
    const updated = conversations.filter(c => c.id !== conversationId)
    setConversations(updated)
    localStorage.setItem(`chatbot_conversations_${user?.id}`, JSON.stringify(updated))
    if (conversationId === currentConversationId) {
      if (updated.length > 0) handleLoadConversation(updated[0].id)
      else startNewConversation()
    }
  }

  const userInitials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'
  const currentTitle = conversations.find(c => c.id === currentConversationId)?.preview || 'New conversation'

  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <HistorySidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearHistory={handleClearHistory}
        onNewChat={handleNewChat}
        userInitials={userInitials}
        username={user?.username}
      />

      {/* ── Main panel ── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div className="topbar">
          <div className="status-indicator">
            <span className="status-dot" />
            <span>Online</span>
          </div>
          <span className="topbar-title">{currentTitle}</span>
          <button className="topbar-btn primary" onClick={() => setShowRoadmap(true)}>
            <IconMap /> Roadmap
          </button>
          <button className="topbar-btn" onClick={() => setShowQuiz(true)}>
            <IconBrain /> Quiz
          </button>
          <button className="topbar-btn danger" onClick={handleLogout}>
            <IconLogOut /> Sign out
          </button>
        </div>

        {/* Chat area */}
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          userInitials={userInitials}
          onSendMessage={handleSendMessage}
        />

        {/* Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          isUploading={isUploading}
        />
      </div>

      {/* Modals */}
      {showQuiz && <QuizPanel authToken={authToken} onClose={() => setShowQuiz(false)} />}
      {showRoadmap && <RoadmapPanel authToken={authToken} onClose={() => setShowRoadmap(false)} />}
    </div>
  )
}

export default App
