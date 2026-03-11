import { useState, useRef, useEffect } from 'react'
import ChatContainer from './components/ChatContainer'
import MessageInput from './components/MessageInput'
import HistorySidebar from './components/HistorySidebar'
import Login from './components/Login'
import QuizPanel from './components/QuizPanel'
import RoadmapPanel from './components/RoadmapPanel'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
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
          const mostRecent = parsed[0]
          setCurrentConversationId(mostRecent.id)
          setMessages(mostRecent.messages)
        } else {
          startNewConversation()
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
        startNewConversation()
      }
    } else {
      startNewConversation()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startNewConversation = () => {
    const initialMessage = {
      id: 1,
      text: "Hello! 👋 How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
    setMessages([initialMessage])
    const newConversationId = Date.now().toString()
    setCurrentConversationId(newConversationId)
  }

  const saveConversation = (updatedMessages) => {
    const updatedConversations = [...conversations]
    const existingIndex = updatedConversations.findIndex(c => c.id === currentConversationId)
    const messagePreview = updatedMessages
      .filter(m => m.sender === 'user')
      .map(m => m.text)
      .join(' ')
      .substring(0, 50)
    if (existingIndex >= 0) {
      updatedConversations[existingIndex] = {
        ...updatedConversations[existingIndex],
        messages: updatedMessages,
        lastUpdated: new Date().toISOString()
      }
      updatedConversations.splice(0, 0, updatedConversations.splice(existingIndex, 1)[0])
    } else {
      const newConversation = {
        id: currentConversationId,
        messages: updatedMessages,
        preview: messagePreview || 'New conversation',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
      updatedConversations.unshift(newConversation)
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
      text: text,
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
    const messagesWithBotMessage = [...updatedMessages, botMessage]
    setMessages(messagesWithBotMessage)

    try {
      const response = await fetch('http://localhost:5000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: text,
          session_id: currentConversationId
        })
      })
      if (!response.ok) {
        // 422 = invalid JWT token (e.g. old token with integer subject)
        if (response.status === 422) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
          setUser(null)
          setAuthToken(null)
          throw new Error('Session expired. Please log in again.')
        }
        // Try to extract server error message
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
            if (data === '[DONE]') {
              setIsLoading(false)
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                const errType = parsed.error_type || 'general'
                if (errType === 'api_key') {
                  botText = `🔑 API Key Error: ${parsed.error}`
                } else {
                  botText = `Error: ${parsed.error}`
                }
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
              setMessages(prevMessages => {
                const newMessages = [...prevMessages]
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  text: botText
                }
                return newMessages
              })
            } catch (e) {
              if (data.trim()) console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

      setMessages(prevMessages => {
        saveConversation(prevMessages)
        return prevMessages
      })

    } catch (error) {
      console.error('Stream Error:', error)
      // Fix 2: mark errors with isError flag
      const isApiKeyErr = error.message?.toLowerCase().includes('api key') ||
                          error.message?.toLowerCase().includes('api_key')
      const errorMessage = {
        id: messagesWithBotMessage.length,
        text: isApiKeyErr
          ? `🔑 ${error.message}`
          : `${error.message}. Make sure the backend is running at http://localhost:5000`,
        sender: 'bot',
        isError: true,
        timestamp: new Date().toISOString()
      }
      const finalMessages = [
        ...messagesWithBotMessage.slice(0, -1),
        errorMessage
      ]
      setMessages(finalMessages)
      saveConversation(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'txt'].includes(ext)) {
      alert('Only PDF and TXT files are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.')
      return
    }
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
      setUploadedFile({ name: data.filename, size: file.size })
      const fileMessage = {
        id: messages.length + 1,
        text: `📎 **File uploaded:** ${data.filename}\n\n_${data.message}_`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isFileNotification: true
      }
      const updatedMessages = [...messages, fileMessage]
      setMessages(updatedMessages)
      saveConversation(updatedMessages)
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    // Clear backend file context
    fetch(`http://localhost:5000/session/${currentConversationId}/file`, {
      method: 'DELETE'
    }).catch(() => console.log('Backend file clear failed, clearing locally'))

    // Clear frontend state
    setUploadedFile(null)

    // Add confirmation message
    const msg = {
      id: messages.length + 1,
      text: '📎 File removed. You can upload a new file anytime.',
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
    const updated = [...messages, msg]
    setMessages(updated)
    saveConversation(updated)
  }

  const handleNewChat = () => {
    saveConversation(messages)
    // Clear backend file context for old session
    if (uploadedFile) {
      fetch(`http://localhost:5000/session/${currentConversationId}/file`, {
        method: 'DELETE'
      }).catch(() => {})
    }
    startNewConversation()
    setUploadedFile(null)
    setShowHistory(false)
  }

  const handleLoadConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages)
      setShowHistory(false)
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
      if (updated.length > 0) {
        handleLoadConversation(updated[0].id)
      } else {
        startNewConversation()
      }
    }
  }

  // Save quiz/roadmap results as a bot message in the current conversation
  const addMessageToChat = (text) => {
    const botMsg = {
      id: messages.length + 1,
      text,
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
    const updated = [...messages, botMsg]
    setMessages(updated)
    saveConversation(updated)
  }

  // Get user initials for avatar
  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U'

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  // Nav button config
  const navButtons = [
    { label: '🗺 Roadmap', action: () => setShowRoadmap(true) },
    { label: '📝 Quiz', action: () => setShowQuiz(true) },
    { label: '➕ New', action: handleNewChat },
  ]

  return (
    <div style={{ height: '100vh', display: 'flex', position: 'relative' }}>
      {/* Animated background orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Sidebar */}
      <HistorySidebar
        isOpen={showHistory}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearHistory={handleClearHistory}
        onClose={() => setShowHistory(false)}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

        {/* ═══ FIX 1: TOP NAVIGATION BAR ═══ */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'rgba(13, 17, 32, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          {/* Left — Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: 'none', border: 'none', color: '#9AA3BF',
                fontSize: 18, cursor: 'pointer', padding: 4, display: 'flex',
                alignItems: 'center'
              }}
              title="Toggle history"
            >☰</button>
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 0 20px rgba(82,183,255,0.3)'
            }}></div>
            <span className="font-brand" style={{
              fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: '#E4E8F5'
            }}>
              ARI<span style={{ color: '#52B7FF' }}>A</span>
            </span>
          </div>

          {/* Center — Nav buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {navButtons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9AA3BF',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'inherit'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(82,183,255,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(82,183,255,0.3)'
                  e.currentTarget.style.color = '#52B7FF'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = '#9AA3BF'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Right — Sign out */}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,126,95,0.1)',
              border: '1px solid rgba(255,126,95,0.2)',
              color: '#FF7E5F',
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,126,95,0.2)'
              e.currentTarget.style.borderColor = 'rgba(255,126,95,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,126,95,0.1)'
              e.currentTarget.style.borderColor = 'rgba(255,126,95,0.2)'
            }}
          >
            Sign Out
          </button>
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            userInitials={userInitials}
            onRemoveFile={handleRemoveFile}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Input Area */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          isUploading={isUploading}
          onRemoveFile={handleRemoveFile}
        />
      </div>

      {/* Modals */}
      {showQuiz && (
        <QuizPanel authToken={authToken} onClose={() => setShowQuiz(false)} onSaveToChat={addMessageToChat} />
      )}
      {showRoadmap && (
        <RoadmapPanel authToken={authToken} onClose={() => setShowRoadmap(false)} onSaveToChat={addMessageToChat} />
      )}
    </div>
  )
}

export default App
