# Modern Chatbot Frontend

A beautiful, simple, and modern chatbot interface built with React, Vite, and Tailwind CSS.

## Features

✨ **Modern Design** - Clean gradient UI with smooth animations
🎨 **Color Scheme** - Blue & Indigo gradients for a professional look
📱 **Responsive** - Works perfectly on mobile, tablet, and desktop
⚡ **Fast** - Built with Vite for instant dev server start
🚀 **Simple** - Minimal, intuitive chat interface
💬 **Real-time** - Message timestamps and typing indicators
📋 **Chat History** - Auto-save conversations in localStorage
🔄 **Manage Conversations** - View, switch, and delete past chats
🔗 **API Ready** - Easy integration with your backend API

## Project Structure

```
frontend/
├── src/
│   ├── components/              # Reusable React components
│   │   ├── ChatContainer.jsx    # Messages display area
│   │   ├── Message.jsx          # Individual message bubble
│   │   ├── MessageInput.jsx     # Input field and send button
│   │   ├── TypingIndicator.jsx  # Bot typing animation
│   │   └── HistorySidebar.jsx   # Chat history sidebar ✨ NEW
│   ├── App.jsx                  # Main app component with history
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── index.html                   # HTML entry point
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
├── vite.config.js               # Vite configuration
└── .gitignore                   # Git ignore rules
```

## Installation & Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

3. **Build for production:**
```bash
npm run build
```

## Modern Color Scheme

The chatbot uses a beautiful modern color palette:
- **Primary**: Blue (from #0284c7 to #0ea5e9)
- **Secondary**: Indigo (#7c3aed)
- **Background**: Gradient fade from slate to blue to indigo
- **Accents**: White with subtle transparency

## Connecting to Backend API

To connect to your backend, modify the `handleSendMessage` function in [src/App.jsx](src/App.jsx#L32):

```javascript
const handleSendMessage = async (text) => {
  // ... existing code ...
  
  try {
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    const data = await response.json()
    // Handle bot response...
  } catch (error) {
    console.error('Error:', error)
  }
}
```

## Key Components

### ChatContainer
Displays all messages and typing indicator. Auto-scrolls to latest message.

### Message
Individual message bubble with timestamp. Different styling for user vs bot messages.

### MessageInput
Text input with send button. Supports multi-line messages (Shift + Enter).

### TypingIndicator
Animated three-dot indicator showing the bot is typing.

### HistorySidebar ✨ NEW
Displays saved conversations in a sidebar. Features:
- View all past conversations
- Quick switch between chats
- Delete individual conversations
- Clear all history at once
- Shows last updated timestamp
- Auto-collapses on mobile (hamburger menu)
- Message preview for each conversation

## UI Features

- ✅ Gradient backgrounds
- ✅ Smooth animations
- ✅ Auto-scrolling messages
- ✅ Typing indicators
- ✅ Loading states
- ✅ Responsive layout
- ✅ Custom scrollbar styling
- ✅ Focus states and transitions

## Chat History ✨ NEW

The chatbot automatically saves all conversations to the browser's localStorage, so your chat history persists even after closing the browser.

### How It Works
- **Auto-save**: Every message is automatically saved
- **Persistent Storage**: Uses browser's localStorage (no backend required)
- **Quick Access**: View all past conversations in the sidebar
- **Timestamps**: See when each conversation was last updated
- **Delete**: Remove individual conversations or clear all history
- **Preview**: Each conversation shows a preview of the first user message

### Storage Structure
```javascript
{
  id: "1709759234123",
  messages: [...],
  preview: "First user message...",
  createdAt: "2025-03-06T10:20:34.123Z",
  lastUpdated: "2025-03-06T10:25:50.456Z"
}
```

### Usage
1. **View History**: Click 📋 or use the sidebar on desktop
2. **Load Conversation**: Click any conversation to view it
3. **Delete Conversation**: Hover and click ✕
4. **Clear All**: Click "Clear All History" button (be careful!)
5. **New Chat**: Click ➕ to start a fresh conversation

## Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Enjoy your modern chatbot with history! 🚀
