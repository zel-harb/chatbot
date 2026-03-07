export default function HistorySidebar({
  isOpen,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onClearHistory
}) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return date.toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 lg:hidden z-20"
          onClick={() => {}}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-56 sm:w-64 bg-white border-r border-primary-200 flex flex-col transition-transform lg:translate-x-0 z-30 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="sticky top-0 p-3 sm:p-4 border-b border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <h2 className="text-base sm:text-lg font-bold text-primary-900">Chat History</h2>
          <p className="text-xs text-gray-600 mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-2">Start chatting to build history</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                    conversation.id === currentConversationId
                      ? 'bg-primary-100 border-l-4 border-primary-600'
                      : 'hover:bg-primary-50'
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <p className="text-sm font-medium text-primary-900 truncate line-clamp-2">
                    {conversation.preview || 'New conversation'}
                  </p>
                  <p className="text-xs text-primary-600 mt-1">
                    {formatDate(conversation.lastUpdated || conversation.createdAt)}
                  </p>

                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConversation(conversation.id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary-200 rounded text-primary-800 text-sm"
                    title="Delete conversation"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        {conversations.length > 0 && (
          <div className="p-4 border-t border-primary-200 space-y-2">
            <button
              onClick={onClearHistory}
              className="w-full px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
            >
              Clear All History
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
