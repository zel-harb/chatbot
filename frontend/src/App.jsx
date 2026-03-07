import { useState, useRef, useEffect } from 'react'
import ChatContainer from './components/ChatContainer'
import MessageInput from './components/MessageInput'
import HistorySidebar from './components/HistorySidebar'

function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('chatbot_conversations')
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations)
        setConversations(parsed)
        
        // Load the most recent conversation if it exists
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
  }, [])

  // Auto-scroll when messages change
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
    localStorage.setItem('chatbot_conversations', JSON.stringify(updatedConversations))
  }

  const handleSendMessage = async (text) => {
    if (!text.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: text,
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          session_id: currentConversationId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }
      
      const data = await response.json()
      const botMessage = {
        id: updatedMessages.length + 1,
        text: data.reply || "Sorry, I couldn't process that request.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      const finalMessages = [...updatedMessages, botMessage]
      setMessages(finalMessages)
      saveConversation(finalMessages)
    } catch (error) {
      console.error('API Error:', error)
      const errorMessage = {
        id: updatedMessages.length + 1,
        text: `Error: ${error.message}. Make sure the backend is running at http://localhost:5000`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      const finalMessages = [...updatedMessages, errorMessage]
      setMessages(finalMessages)
      saveConversation(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    saveConversation(messages)
    startNewConversation()
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
    localStorage.removeItem('chatbot_conversations')
    setConversations([])
    startNewConversation()
  }

  const handleDeleteConversation = (conversationId) => {
    const updated = conversations.filter(c => c.id !== conversationId)
    setConversations(updated)
    localStorage.setItem('chatbot_conversations', JSON.stringify(updated))
    
    if (conversationId === currentConversationId) {
      if (updated.length > 0) {
        handleLoadConversation(updated[0].id)
      } else {
        startNewConversation()
      }
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex">
      {/* History Sidebar */}
      <HistorySidebar
        isOpen={showHistory}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearHistory={handleClearHistory}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-900 to-primary-800 text-white shadow-lg z-10">
          <div className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors lg:hidden"
                title="Toggle history"
              >
                <span className="text-lg">☰</span>
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                  <span className="text-base sm:text-xl font-bold">C</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold">ChatBot</h1>
                  <p className="text-primary-100 text-xs">Assistant</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-primary-700 hover:bg-primary-600 rounded-lg transition-colors font-medium text-sm"
              title="Start new conversation"
            >
              <span>+</span>
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatContainer messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />
        </div>

        {/* Input Area */}
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default App
