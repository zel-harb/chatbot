# 🏗️ Guide Complet: Construire un Chatbot IA Comme ARIA

## Table des Matières
1. [Prérequis & Connaissances Requises](#prérequis--connaissances-requises)
2. [Décisions Architecturales](#décisions-architecturales-clés)
3. [Plan de Construction Étape par Étape](#plan-de-construction-étape-par-étape)
4. [Phase 1: Fondations (Semaines 1-2)](#phase-1-fondations-semaines-1-2)
5. [Phase 2: Frontend (Semaines 3-4)](#phase-2-frontend-semaines-3-4)
6. [Phase 3: Backend (Semaines 5-7)](#phase-3-backend-semaines-5-7)
7. [Phase 4: NLP Pipeline (Semaines 8-10)](#phase-4-nlp-pipeline-semaines-8-10)
8. [Phase 5: Intégration (Semaines 11-12)](#phase-5-intégration-semaines-11-12)
9. [Dépannage Courant](#dépannage-courant)
10. [Optimisations Futures](#optimisations-futures)

---

## Prérequis & Connaissances Requises

### 1️⃣ Connaissances Techniques Obligatoires

#### Frontend
```
Niveau:  Intermédiaire
Temps:   3-6 mois apprentissage

✅ HTML/CSS/JavaScript ES6+
   - DOM manipulation
   - Event handling
   - Async/await
   - Fetch API

✅ React
   - Components (functional + hooks)
   - useState, useEffect
   - Props, Context API
   - State management

✅ CSS Framework (Tailwind)
   - Utility-first CSS
   - Responsive design
   - Component styling

✅ Build Tools
   - Vite / Webpack
   - npm / yarn
   - Dev server
```

#### Backend
```
Niveau:  Intermédiaire
Temps:   3-6 mois apprentissage

✅ Python 3.10+
   - OOP basics
   - Async/await
   - Decorators
   - Type hints

✅ Flask
   - Routes & views
   - Request/response handling
   - Middleware
   - Error handling

✅ HTTP & REST APIs
   - GET, POST, PUT, DELETE
   - Request headers
   - JSON serialization
   - CORS

✅ Environment Management
   - Virtual environments
   - .env files
   - Dependencies (pip)
```

#### NLP & ML
```
Niveau:  Avancé
Temps:   6-12 mois apprentissage

✅ Natural Language Processing
   - Tokenization
   - Intent classification
   - Named entity recognition
   - Embeddings

✅ Vector Databases
   - FAISS basics
   - Similarity search
   - Embedding creation

✅ Large Language Models
   - Prompt engineering
   - Token handling
   - API integration
   - Temperature/parameters

✅ Machine Learning Basics
   - Training/inference
   - Model evaluation
   - Confidence scoring
```

#### DevOps
```
Niveau:  Intermédiaire
Temps:   2-3 mois apprentissage

✅ Docker
   - Containerization
   - Images & containers
   - Docker Compose

✅ Git
   - Version control
   - Commits, branches
   - GitHub/GitLab

✅ CI/CD (Optionnel)
   - GitHub Actions
   - Automated testing
   - Deployment
```

---

### 2️⃣ Outils & Environnement

#### Installation Obligatoire
```bash
# 1. Python 3.10+
- Download: python.org
- Verify: python --version

# 2. Node.js 18+
- Download: nodejs.org
- Verify: node --version && npm --version

# 3. Git
- Download: git-scm.com
- Verify: git --version

# 4. Docker (Recommandé)
- Download: docker.com
- Verify: docker --version && docker-compose --version

# 5. VS Code (ou IDE préféré)
- Download: code.visualstudio.com
- Extensions: Python, ES7, Docker
```

#### Services Cloud Gratuits
```
✅ Google Gemini API
   - Signup: aistudio.google.com
   - Free tier: Quota généreux
   - No credit card needed

✅ GitHub
   - Signup: github.com
   - Free: Repos illimités
   - Free tier suffisant
```

---

## Décisions Architecturales Clés

### 1. Architecture Générale

#### Option A: Monolithe (ARIA Chatbot ✅)
```
Avantages:
✅ Simple à déployer
✅ Facile à debugger
✅ Startup rapide
✅ Parfait pour MVP

Inconvénients:
❌ Pas très scalable
❌ Couplage fort
❌ Difficile à tester

Quand utiliser:
- Prototype/MVP
- Petite équipe
- Démarrage rapide
```

#### Option B: Microservices
```
Avantages:
✅ Très scalable
✅ Tech stack flexible
✅ Équipes parallèles
✅ Déploiement indépendant

Inconvénients:
❌ Complex à configurer
❌ Overhead réseau
❌ Debugging difficile
❌ Orchestration requise

Quand utiliser:
- Large équipe
- Millions d'utilisateurs
- Standards d'entreprise
```

**Recommandation pour vous**: **Monolithe (comme ARIA)** pour commencer, migrer à microservices si besoin.

---

### 2. Stack Frontend

#### Option A: React + Vite (ARIA Chatbot ✅)
```javascript
Avantages:
✅ Vite = ultra rapide
✅ React = large communauté
✅ Excellent tooling
✅ Zero-config setup

Structure:
src/
├── App.jsx           # Root component
├── components/
│   ├── ChatContainer.jsx
│   ├── Message.jsx
│   ├── MessageInput.jsx
│   └── HistorySidebar.jsx
├── hooks/           # Custom hooks
├── styles/          # CSS
└── utils/           # Helpers
```

#### Option B: Vue + Vite
```javascript
Avantages:
✅ Syntaxe plus simple
✅ Courbe apprentissage douce
✅ Très performant

Inconvénients:
❌ Communauté plus petite
❌ Moins de libraries
```

#### Option C: Next.js
```javascript
Avantages:
✅ Full-stack (FE + BE)
✅ SSR possible
✅ API routes intégrées

Inconvénients:
❌ Overkill pour chatbot
❌ Plus complexe
```

**Recommandation**: **React + Vite** (comme ARIA) - parfait équilibre

---

### 3. Stack Backend

#### Option A: Flask + Python (ARIA Chatbot ✅)
```python
Avantages:
✅ Simple & léger
✅ Parfait apprentissage
✅ Excellent pour NLP
✅ Déploiement facile

Structure:
aria-backend/
├── app.py              # Main Flask app
├── config.py           # Configuration
├── session_manager.py  # Session storage
├── nlp_utils.py        # NLP helpers
├── langchain_module.py # LLM integration
└── requirements.txt    # Dependencies
```

#### Option B: FastAPI
```python
Avantages:
✅ Ultra rapide
✅ Async par défaut
✅ Auto-documentation

Inconvénients:
❌ Plus complexe
❌ Moins marure pour NLP
```

#### Option C: Django
```python
Avantages:
✅ Full-featured
✅ ORM intégré
✅ Admin panel

Inconvénients:
❌ Lourd pour MVP
❌ Configuration complexe
```

**Recommandation**: **Flask** (comme ARIA) - parfait démarrage

---

### 4. NLP Stack

#### Option A: Rasa + LangChain + Gemini (ARIA ✅)
```
Rasa: Intent classification locale
  ✅ Pas d'API
  ✅ Rapide
  ✅ Customizable

LangChain: RAG framework
  ✅ Standardisé
  ✅ Flexible
  ✅ Integrations

Gemini: LLM
  ✅ Gratuit
  ✅ Performant
  ✅ Multi-modal
```

#### Option B: Rasa seul
```
Avantages:
✅ Full contrôle
✅ Offline capable

Inconvénients:
❌ Pas de generation avancée
❌ Training complexe
```

#### Option C: Ollama + LangChain
```
Avantages:
✅ 100% local
✅ Offline
✅ Gratuit

Inconvénients:
❌ Qualité inférieure
❌ Lent
❌ GPU requis
```

**Recommandation**: **Rasa + LangChain + Gemini** (comme ARIA)

---

### 5. Stockage

#### MVP (Phase 1)
```
Frontend: localStorage
  - Chat history
  - User preferences

Backend: In-memory (Python dict)
  - Active sessions
  - Message history
  - Intent tracking

Documents: FAISS
  - Vector embeddings
  - Similarity search
```

#### Production (Phase 2)
```
Frontend: localStorage (inchangé)

Backend: PostgreSQL + Redis
  - Users
  - Sessions
  - Messages
  - Analytics

Cache: Redis
  - Session cache
  - Embedding cache
  - Rate limiting

Documents: FAISS + PostgreSQL
  - Persistent embeddings
  - Backup automatique
```

**Recommandation**: MVP = simple, Phase 2 = database

---

## Plan de Construction Étape par Étape

### Timeline Totale: 12 Semaines

```
Semaines 1-2:   Fondations (Setup, Architecture)
Semaines 3-4:   Frontend (UI, Components)
Semaines 5-7:   Backend (API, Sessions)
Semaines 8-10:  NLP Pipeline (Rasa, LangChain)
Semaines 11-12: Intégration (Testing, Deployment)
```

---

## Phase 1: Fondations (Semaines 1-2)

### Semaine 1: Setup & Initiation

#### Jour 1-2: Project Setup
```bash
# 1. Créer répertoire
mkdir finalchat
cd finalchat

# 2. Initialiser Git
git init
git remote add origin https://github.com/YOUR-USERNAME/finalchat.git

# 3. Créer structure base
mkdir frontend aria-backend docs

# 4. Créer fichiers principaux
touch readme.md .gitignore ARCHITECTURE.md
```

#### .gitignore
```
# Dependencies
node_modules/
__pycache__/
*.egg-info/
.venv/
venv/

# Environment
.env
.env.local

# Build
dist/
build/

# IDE
.vscode/
.idea/
*.swp

# Data
data/
*.log

# OS
.DS_Store
Thumbs.db
```

#### Jour 3-4: Documentation
```markdown
# Créer et documenter:

readme.md
├─ Vue d'ensemble
├─ Quick start
├─ Architecture high-level
└─ Repository structure

ARCHITECTURE.md
├─ Diagrams système
├─ Components
├─ Data flow
└─ Technologies

PROJECT_STRUCTURE.md
├─ Répertoires
├─ Fichiers principaux
└─ Organisation code
```

#### Jour 5: Configuration Git
```bash
# 1. Committer l'init
git add .
git commit -m "initial project setup"

# 2. Créer branches principales
git branch develop
git branch -a

# 3. GitHub
- Create repo on GitHub
- Push initial commit
git push -u origin main
```

### Semaine 2: Architecture & Planning

#### Jour 1-2: Architecture Decisions
```
Questions à répondre:

1. Frontend Framework?
   → React + Vite (choisir)

2. Backend Framework?
   → Flask (choisir)

3. NLP Stack?
   → Rasa + LangChain + Gemini (choisir)

4. Stockage?
   → localStorage (FE) + In-memory (BE) (choisir)

5. Infrastructure?
   → Docker Compose (choisir)

6. Deployment?
   → Docker Hub + Manual (choisir)
```

#### Jour 3-4: Setup Environments

**Backend Setup:**
```bash
cd aria-backend

# 1. Python virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate.bat  # Windows

# 2. Requirements file
cat > requirements.txt << EOF
flask==2.3.0
flask-cors==4.0.0
python-dotenv==1.0.0
requests==2.31.0
langchain==0.0.300
langchain-google-genai==0.0.1
faiss-cpu==1.7.4
sentence-transformers==2.2.2
spacy==3.6.0
langdetect==1.0.9
rasa==3.6.0
EOF

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download spaCy model
python -m spacy download en_core_web_sm

# 5. Create .env
cat > .env.example << EOF
GOOGLE_API_KEY=your_key_here
RASA_URL=http://localhost:5005
FLASK_SECRET_KEY=dev-key
FLASK_ENV=development
FLASK_PORT=5000
LLM_MODEL=gemini-pro
LLM_TEMPERATURE=0.3
CONFIDENCE_THRESHOLD=0.60
DOCS_PATH=./data/docs
EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2
EOF

cp .env.example .env
```

**Frontend Setup:**
```bash
cd ../frontend

# 1. Create with Vite
npm create vite@latest . -- --template react

# 2. Install dependencies
npm install

# 3. Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Configure Tailwind
# Edit tailwind.config.js pour content

# 5. Create directory structure
mkdir src/components src/utils src/hooks
```

#### Jour 5: Initial Commit
```bash
# Backend
cd aria-backend
git add .
git commit -m "backend: initial setup with Flask and dependencies"

# Frontend
cd ../frontend
git add .
git commit -m "frontend: initial React + Vite setup with Tailwind"

# Root
cd ..
git add .
git commit -m "docs: architecture and project structure"
git push origin develop
```

---

## Phase 2: Frontend (Semaines 3-4)

### Semaine 3: Components Foundation

#### Jour 1-2: Core Components
```jsx
// src/App.jsx
import React, { useState, useEffect } from 'react';
import ChatContainer from './components/ChatContainer';
import HistorySidebar from './components/HistorySidebar';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('sessionId') || uuidv4();
  });
  const [isLoading, setIsLoading] = useState(false);

  // Save sessionId to localStorage
  useEffect(() => {
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${sessionId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [sessionId]);

  const handleSendMessage = async (text) => {
    // Add user message
    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Call backend
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId })
      });

      const data = await response.json();

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      localStorage.setItem(`chat_${sessionId}`, JSON.stringify(finalMessages));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <HistorySidebar onNewChat={() => setSessionId(uuidv4())} />
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
```

#### Jour 3: UI Components
```jsx
// src/components/ChatContainer.jsx
export default function ChatContainer({ messages, isLoading, onSendMessage }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <Message key={idx} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}

// src/components/Message.jsx
export default function Message({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs px-4 py-2 rounded-lg ${
        isUser
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-900'
      }`}>
        {message.content}
      </div>
    </div>
  );
}

// src/components/MessageInput.jsx
export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </form>
  );
}
```

#### Jour 4-5: Styling & Polish
```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  @apply box-border;
}

body {
  @apply bg-gray-50 text-gray-900;
  font-family: 'Inter', sans-serif;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
```

### Semaine 4: Advanced Features

#### Jour 1-2: Typing Indicator & History
```jsx
// src/components/TypingIndicator.jsx
export default function TypingIndicator() {
  return (
    <div className="flex gap-1 p-4">
      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" />
      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}

// src/components/HistorySidebar.jsx
export default function HistorySidebar({ onNewChat }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Load sessions from localStorage
    const allKeys = Object.keys(localStorage);
    const chatSessions = allKeys
      .filter(k => k.startsWith('chat_'))
      .map(k => ({
        id: k.replace('chat_', ''),
        label: localStorage.getItem(`label_${k}`) || 'Chat ' + k.slice(0, 5)
      }));
    setSessions(chatSessions);
  }, []);

  return (
    <div className="w-64 bg-gray-900 text-white p-4">
      <button
        onClick={onNewChat}
        className="w-full mb-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        New Chat
      </button>
      <div className="space-y-2">
        {sessions.map(session => (
          <div key={session.id} className="p-2 rounded hover:bg-gray-800 cursor-pointer">
            {session.label}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Jour 3-5: Testing & Deployment

```bash
# Test locally
npm run dev
# Should open http://localhost:5173

# Build for production
npm run build

# Test production build
npm run preview
```

---

## Phase 3: Backend (Semaines 5-7)

### Semaine 5: Core API

#### Jour 1-2: Flask Setup & Routes
```python
# aria-backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
from uuid import uuid4

# Setup
app = Flask(__name__)
app.secret_key = 'dev-secret-key'
CORS(app, origins="*")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Session storage (in-memory)
sessions = {}

# 1. Health Check
@app.route("/health", methods=["GET"])
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "flask": "running",
            "sessions": len(sessions)
        }
    }

# 2. Create/Get Session
@app.route("/session/<session_id>", methods=["GET"])
def get_session(session_id):
    if session_id not in sessions:
        sessions[session_id] = {
            "id": session_id,
            "created_at": datetime.now(),
            "messages": [],
            "token_count": 0
        }
    return sessions[session_id]

# 3. Send Message (Placeholder)
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        message = data.get("message", "").strip()
        session_id = data.get("session_id")

        # Validation
        if not message or not session_id:
            return {"error": "Missing parameters"}, 400

        # Get/Create session
        if session_id not in sessions:
            sessions[session_id] = {
                "id": session_id,
                "created_at": datetime.now(),
                "messages": [],
                "token_count": 0
            }

        session = sessions[session_id]

        # Save user message
        session["messages"].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        })

        # Placeholder response (will be replaced with NLP)
        reply = f"Echo: {message}"

        # Save assistant message
        session["messages"].append({
            "role": "assistant",
            "content": reply,
            "timestamp": datetime.now().isoformat(),
            "source": "placeholder"
        })

        return {
            "success": True,
            "reply": reply,
            "session_id": session_id,
            "source": "placeholder"
        }

    except Exception as e:
        logger.error(f"Error in /chat: {str(e)}")
        return {"error": str(e)}, 500

# 4. Delete Session
@app.route("/session/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    if session_id in sessions:
        del sessions[session_id]
    return {"success": True, "message": "Session deleted"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
```

#### Jour 3-4: Config & Utilities
```python
# aria-backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Google Gemini
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    
    # Rasa
    RASA_URL = os.getenv("RASA_URL", "http://localhost:5005")
    
    # Flask
    FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-key")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
    
    # Model
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-pro")
    LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.60"))
    
    @classmethod
    def validate(cls):
        if not cls.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not configured")
    
    @classmethod
    def display(cls):
        print("\n" + "="*60)
        print("CONFIGURATION")
        print("="*60)
        config_items = [
            ("GOOGLE_API_KEY", cls._mask_key(cls.GOOGLE_API_KEY)),
            ("RASA_URL", cls.RASA_URL),
            ("FLASK_ENV", cls.FLASK_ENV),
            ("LLM_MODEL", cls.LLM_MODEL),
        ]
        for key, value in config_items:
            print(f"{key:<25} {value}")
        print("="*60 + "\n")
    
    @staticmethod
    def _mask_key(key: str, visible=4):
        if not key or len(key) <= visible:
            return "****"
        return f"****...{key[-visible:]}"

# aria-backend/session_manager.py
from datetime import datetime

class SessionManager:
    def __init__(self):
        self.sessions = {}
    
    def create_session(self, session_id):
        self.sessions[session_id] = {
            "session_id": session_id,
            "created_at": datetime.now(),
            "messages": [],
            "intent_history": [],
            "token_count": 0,
        }
    
    def add_message(self, session_id, role, content, **kwargs):
        if session_id not in self.sessions:
            self.create_session(session_id)
        
        self.sessions[session_id]["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now(),
            **kwargs
        })
    
    def get_session(self, session_id):
        return self.sessions.get(session_id)
    
    def delete_session(self, session_id):
        if session_id in self.sessions:
            del self.sessions[session_id]
```

#### Jour 5: Testing
```bash
# Test backend
cd aria-backend

# Run Flask
python app.py
# Should start on http://localhost:5000

# Test endpoints
curl http://localhost:5000/health
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hi","session_id":"test-1"}'
```

### Semaine 6: Session Management

#### Implement complete SessionManager
```python
# aria-backend/session_manager.py - Full Implementation

class SessionManager:
    def __init__(self):
        self.sessions = {}
    
    def create_session(self, session_id: str) -> dict:
        """Create new session"""
        self.sessions[session_id] = {
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "messages": [],
            "intent_history": [],
            "token_count": 0,
            "metadata": {}
        }
        return self.sessions[session_id]
    
    def add_message(self, session_id: str, role: str, content: str, **kwargs) -> None:
        """Add message to session"""
        if session_id not in self.sessions:
            self.create_session(session_id)
        
        self.sessions[session_id]["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            **kwargs
        })
        self.sessions[session_id]["last_activity"] = datetime.now().isoformat()
    
    def add_intent(self, session_id: str, intent: str) -> None:
        """Track intent"""
        if session_id not in self.sessions:
            return
        self.sessions[session_id]["intent_history"].append(intent)
    
    def increment_tokens(self, session_id: str, count: int) -> None:
        """Update token count"""
        if session_id in self.sessions:
            self.sessions[session_id]["token_count"] += count
    
    def get_session(self, session_id: str) -> dict:
        """Get session data"""
        return self.sessions.get(session_id)
    
    def delete_session(self, session_id: str) -> None:
        """Delete session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
    
    def get_all_sessions(self) -> dict:
        """Get all sessions"""
        return self.sessions
    
    def get_session_stats(self, session_id: str) -> dict:
        """Get session statistics"""
        session = self.get_session(session_id)
        if not session:
            return {}
        
        return {
            "session_id": session_id,
            "created_at": session["created_at"],
            "last_activity": session["last_activity"],
            "message_count": len(session["messages"]),
            "total_tokens": session["token_count"],
            "intent_history": session["intent_history"]
        }

# Update app.py to use SessionManager

from session_manager import SessionManager

session_manager = SessionManager()

@app.route("/session/<session_id>", methods=["GET"])
def get_session(session_id):
    session = session_manager.get_session(session_id)
    if not session:
        session = session_manager.create_session(session_id)
    return session_manager.get_session_stats(session_id)

@app.route("/session/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    session_manager.delete_session(session_id)
    return {"success": True}
```

### Semaine 7: Error Handling & Logging

```python
# aria-backend/app.py - Enhanced with Error Handling

import logging
from functools import wraps
import traceback

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('flask.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Error handler decorator
def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            logger.info(f"Processing {f.__name__}")
            result = f(*args, **kwargs)
            logger.info(f"Success: {f.__name__}")
            return result
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            return {"error": str(e)}, 400
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            return {"error": "Server error"}, 500
    return decorated_function

# Apply to routes
@app.route("/chat", methods=["POST"])
@handle_errors
def chat():
    data = request.json
    message = data.get("message", "").strip()
    session_id = data.get("session_id")
    
    if not message:
        raise ValueError("Message cannot be empty")
    if not session_id:
        raise ValueError("Session ID required")
    
    # Process...
    reply = message  # Placeholder
    
    session_manager.add_message(session_id, "user", message)
    session_manager.add_message(session_id, "assistant", reply, source="placeholder")
    
    logger.info(f"Message processed - Session: {session_id}, Tokens: 0")
    
    return {
        "success": True,
        "reply": reply,
        "session_id": session_id,
        "source": "placeholder"
    }

# Global error handlers
@app.errorhandler(404)
def not_found(error):
    logger.warning(f"404 - {request.path}")
    return {"error": "Not found"}, 404

@app.errorhandler(500)
def server_error(error):
    logger.error(f"500 - {str(error)}")
    return {"error": "Server error"}, 500
```

---

## Phase 4: NLP Pipeline (Semaines 8-10)

### Semaine 8: Rasa Setup

#### Jour 1-3: Rasa Project Creation
```bash
cd aria-backend

# 1. Create Rasa project
rasa init --no-prompt

# 2. File structure created:
# data/
#   nlu.yml       # NLU training data
#   stories.yml   # Dialog stories
# rasa/
#   config.yml    # Rasa configuration
#   domain.yml    # Intents, entities, actions
#   credentials.yml
# models/         # Trained models

# 3. Create training data
# data/nlu.yml
cat > data/nlu.yml << 'EOF'
version: "3.1"

nlu:
- intent: greet
  examples: |
    - hey
    - hello
    - hi
    - good morning
    - bonjour
    
- intent: goodbye
  examples: |
    - bye
    - goodbye
    - see you
    - au revoir

- intent: ask_hours
  examples: |
    - what are your hours?
    - when are you open?
    - quels sont vos horaires?
    - à quelle heure ouvrez-vous?

- intent: ask_product
  examples: |
    - tell me about products
    - what do you sell?
    - product information
    - vos produits?
EOF

# 4. Train model
rasa train

# 5. Run Rasa server
rasa run --port 5005 --enable-api --cors "*"
```

#### Jour 4-5: Rasa Integration
```python
# aria-backend/nlp_utils.py

import requests
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class RasaNLU:
    def __init__(self, rasa_url: str = "http://localhost:5005"):
        self.rasa_url = rasa_url
        self.webhook_url = f"{rasa_url}/webhooks/rest/webhook"
        self.parse_url = f"{rasa_url}/model/parse"
    
    def parse_message(self, message: str, sender_id: str) -> Dict[str, Any]:
        """Parse message with Rasa NLU"""
        try:
            response = requests.post(
                self.parse_url,
                json={"text": message},
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Rasa parse error: {str(e)}")
            return {"error": str(e)}
    
    def get_intent(self, message: str, sender_id: str) -> Dict[str, Any]:
        """Get intent from message"""
        result = self.parse_message(message, sender_id)
        
        if "error" in result:
            return {
                "intent": "nlu_error",
                "confidence": 0,
                "entities": []
            }
        
        intent_ranking = result.get("intent_ranking", [])
        if intent_ranking:
            top_intent = intent_ranking[0]
            return {
                "intent": top_intent.get("name"),
                "confidence": top_intent.get("confidence", 0),
                "entities": result.get("entities", [])
            }
        
        return {
            "intent": "unknown",
            "confidence": 0,
            "entities": []
        }

# aria-backend/app.py - Integrate Rasa

from nlp_utils import RasaNLU

rasa_nlp = RasaNLU()

@app.route("/chat", methods=["POST"])
@handle_errors
def chat():
    data = request.json
    message = data.get("message", "").strip()
    session_id = data.get("session_id")
    
    if not message or not session_id:
        raise ValueError("Message and session_id required")
    
    # Parse with Rasa
    intent_result = rasa_nlp.get_intent(message, session_id)
    
    # Simple response based on intent
    intent_name = intent_result.get("intent")
    confidence = intent_result.get("confidence")
    
    # Simple intent responses
    intent_responses = {
        "greet": "Hello! How can I help you?",
        "goodbye": "Goodbye! Have a great day!",
        "ask_hours": "We are open 9AM-6PM, Monday to Friday.",
        "ask_product": "We offer a wide range of products.",
    }
    
    reply = intent_responses.get(intent_name, "I didn't understand that.")
    
    # Save to session
    session_manager.add_message(session_id, "user", message, intent=intent_name, confidence=confidence)
    session_manager.add_message(session_id, "assistant", reply, source="rasa")
    session_manager.add_intent(session_id, intent_name)
    
    logger.info(f"Intent: {intent_name} (confidence: {confidence})")
    
    return {
        "success": True,
        "reply": reply,
        "session_id": session_id,
        "intent": intent_name,
        "confidence": confidence,
        "source": "rasa"
    }
```

### Semaine 9: LangChain & RAG

```python
# aria-backend/langchain_module.py

from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import TextLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class RAGPipeline:
    def __init__(self, google_api_key: str, docs_path: str = "./data/docs"):
        self.google_api_key = google_api_key
        self.docs_path = docs_path
        
        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=google_api_key,
            temperature=0.3
        )
        
        # Load vectorstore
        self.vectorstore = None
        self.load_or_build_index()
    
    def load_or_build_index(self):
        """Load existing FAISS index or build new one"""
        index_path = "./data/faiss_index"
        
        if Path(index_path).exists():
            logger.info("Loading existing FAISS index")
            self.vectorstore = FAISS.load_local(index_path, self.embeddings)
        else:
            logger.info("Building new FAISS index")
            self.build_index()
    
    def build_index(self):
        """Build FAISS index from documents"""
        try:
            # Load documents
            loader = DirectoryLoader(self.docs_path, glob="**/*.txt")
            documents = loader.load()
            
            # Split into chunks
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            docs = splitter.split_documents(documents)
            
            # Create FAISS index
            self.vectorstore = FAISS.from_documents(docs, self.embeddings)
            
            # Save index
            self.vectorstore.save_local("./data/faiss_index")
            logger.info(f"Built FAISS index with {len(docs)} chunks")
        
        except Exception as e:
            logger.error(f"Error building index: {str(e)}")
            self.vectorstore = None
    
    def generate_response(self, query: str) -> str:
        """Generate response using RAG + Gemini"""
        try:
            if not self.vectorstore:
                logger.warning("No vectorstore available, using direct Gemini")
                return self.llm.invoke(query).content
            
            # Search for relevant documents
            docs = self.vectorstore.similarity_search(query, k=3)
            context = "\n".join([doc.page_content for doc in docs])
            
            # Create prompt with context
            prompt = f"""Based on these documents:
{context}

Answer this question: {query}"""
            
            response = self.llm.invoke(prompt)
            return response.content
        
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I encountered an error generating a response."

# aria-backend/app.py - Add LangChain endpoint

from langchain_module import RAGPipeline

Config.validate()
rag_pipeline = RAGPipeline(Config.GOOGLE_API_KEY)

@app.route("/langchain", methods=["POST"])
@handle_errors
def langchain_endpoint():
    data = request.json
    message = data.get("message")
    session_id = data.get("session_id")
    
    if not message or not session_id:
        raise ValueError("Message and session_id required")
    
    # Generate response
    reply = rag_pipeline.generate_response(message)
    
    # Save to session
    session_manager.add_message(session_id, "user", message)
    session_manager.add_message(session_id, "assistant", reply, source="langchain")
    
    return {
        "success": True,
        "reply": reply,
        "session_id": session_id,
        "source": "langchain"
    }

# Update main /chat to use fallback logic

@app.route("/chat", methods=["POST"])
@handle_errors
def chat():
    data = request.json
    message = data.get("message", "").strip()
    session_id = data.get("session_id")
    
    if not message or not session_id:
        raise ValueError("Message and session_id required")
    
    # Stage 1: Rasa
    intent_result = rasa_nlp.get_intent(message, session_id)
    confidence = intent_result.get("confidence", 0)
    
    source = "rasa"
    if confidence >= Config.CONFIDENCE_THRESHOLD:
        # Use Rasa response
        intent_responses = {
            "greet": "Hello! How can I help you?",
            "goodbye": "Goodbye!",
            "ask_hours": "We are open 9AM-6PM, Monday to Friday.",
        }
        reply = intent_responses.get(intent_result.get("intent"), "Hello!")
    else:
        # Stage 2: LangChain
        logger.info("Low confidence, falling back to LangChain")
        reply = rag_pipeline.generate_response(message)
        source = "langchain"
    
    # Save to session
    session_manager.add_message(session_id, "user", message, 
                               intent=intent_result.get("intent"), 
                               confidence=confidence)
    session_manager.add_message(session_id, "assistant", reply, source=source)
    session_manager.add_intent(session_id, intent_result.get("intent"))
    
    return {
        "success": True,
        "reply": reply,
        "session_id": session_id,
        "intent": intent_result.get("intent"),
        "confidence": confidence,
        "source": source
    }
```

### Semaine 10: Testing & Optimization

```bash
# Test full pipeline
python app.py

# In another terminal
curl -X POST http://localhost:5000/chat \
 -H "Content-Type: application/json" \
  -d '{"message":"Hello!","session_id":"test-1"}'
```

---

## Phase 5: Intégration (Semaines 11-12)

### Semaine 11: Docker & Deployment

#### Dockerfile Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "run", "preview"]
```

#### Dockerfile Backend
```dockerfile
# aria-backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "app.py"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:5173"
    environment:
      - VITE_API_URL=http://backend:5000

  backend:
    build: ./aria-backend
    ports:
      - "5000:5000"
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - RASA_URL=http://rasa:5005
      - FLASK_ENV=production
    depends_on:
      - rasa

  rasa:
    image: rasa/rasa:3.6.0
    ports:
      - "5005:5005"
    volumes:
      - ./aria-backend/rasa:/app
    command: run --port 5005 --enable-api --cors "*"
```

#### Deployment
```bash
# Build and deploy
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Semaine 12: Testing & Final Polish

```bash
# 1. Frontend tests
cd frontend
npm test
npm run build

# 2. Backend tests
cd ../aria-backend
pytest

# 3. Integration tests
# Test full flow from browser

# 4. Performance testing
# Measure response times

# 5. Final commit
git add .
git commit -m "final: production ready v1.0"
git push origin main
```

---

## Dépannage Courant

### Erreur: "ModuleNotFoundError: No module named 'flask'"
```bash
# Solution:
pip install -r requirements.txt
pip install flask==2.3.0
```

### Erreur: "Connection refused" (Rasa not running)
```bash
# Solution:
cd aria-backend/rasa
rasa train
rasa run --port 5005 --enable-api --cors "*"
```

### Erreur: "GOOGLE_API_KEY not configured"
```bash
# Solution:
# 1. Get key from: aistudio.google.com
# 2. Create .env file:
echo "GOOGLE_API_KEY=your_key_here" > aria-backend/.env
```

### Frontend can't reach Backend (CORS error)
```bash
# Solution 1: Check backend is running
curl http://localhost:5000/health

# Solution 2: Check CORS configuration in app.py
CORS(app, origins="*")  # Allow all origins for dev

# Solution 3: Check frontend API URL
// In frontend, use:
fetch('http://localhost:5000/chat')
```

---

## Optimisations Futures

### Phase 2 (3-6 months)
```
✅ Database (PostgreSQL + pgVector)
✅ User Authentication (JWT)
✅ Multi-user Support
✅ Analytics Dashboard
✅ Voice Input/Output
```

### Phase 3 (6-12 months)
```
✅ Fine-tuning Custom Models
✅ Multi-language Support (20+ languages)
✅ Real-time Streaming
✅ Mobile App (React Native)
✅ Enterprise Features
```

### Phase 4 (12+ months)
```
✅ Image Understanding
✅ Document Processing (PDFs)
✅ Plugin System
✅ API Marketplace
✅ White-label Solution
```

---

## Ressources pour Apprendre

### Frontend
- React Docs: https://react.dev
- Vite Guide: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com
- Axios: https://axios-http.com

### Backend
- Flask Docs: https://flask.palletsprojects.com
- Python Guide: https://docs.python.org/3

### NLP/ML
- Rasa Docs: https://rasa.com/docs
- LangChain: https://python.langchain.com
- Hugging Face: https://huggingface.co

### Infrastructure
- Docker: https://docs.docker.com
- Git: https://git-scm.com/docs

---

---

## 🗄️ BONUS: Phase 2 - Base de Données Réelle (PostgreSQL)

### Option 1: Suite à Phase 1 (Recommandé)
Pour transformer votre MVP en production avec base de données persistante.

---

### Semaine 13-14: Migration PostgreSQL

#### Installation PostgreSQL

```bash
# macOS
brew install postgresql

# Ubuntu/Linux
sudo apt-get install postgresql postgresql-contrib

# Windows
# Télécharger depuis: https://www.postgresql.org/download/windows/

# Vérifier installation
psql --version
```

#### Créer Base de Données

```bash
# 1. Accéder à PostgreSQL
psql postgres

# 2. Créer database
CREATE DATABASE aria_chatbot;
CREATE USER aria_user WITH PASSWORD 'secure_password_here';
ALTER ROLE aria_user SET client_encoding TO 'utf8';
ALTER ROLE aria_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE aria_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE aria_chatbot TO aria_user;
\c aria_chatbot

# 3. Exit
\q
```

#### Installer SQLAlchemy & Drivers

```bash
cd aria-backend

# Update requirements.txt
cat >> requirements.txt << EOF
Flask-SQLAlchemy==3.0.5
psycopg2-binary==2.9.7
python-dateutil==2.8.2
alembic==1.12.1
pgvector==0.2.4
EOF

pip install -r requirements.txt
```

#### Créer Models Database

```python
# aria-backend/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sessions = db.relationship('Session', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    title = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    token_count = db.Column(db.Integer, default=0)
    metadata = db.Column(JSON, default={})
    
    messages = db.relationship('Message', backref='session', lazy=True, cascade='all, delete-orphan')
    intents = db.relationship('Intent', backref='session', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'token_count': self.token_count,
            'message_count': len(self.messages)
        }

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey('sessions.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    source = db.Column(db.String(50), nullable=True)  # 'rasa', 'langchain', 'gemini'
    intent = db.Column(db.String(100), nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    tokens = db.Column(db.Integer, default=0)
    metadata = db.Column(JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'role': self.role,
            'content': self.content,
            'source': self.source,
            'intent': self.intent,
            'confidence': self.confidence,
            'created_at': self.created_at.isoformat()
        }

class Intent(db.Model):
    __tablename__ = 'intents'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey('sessions.id'), nullable=False)
    intent_name = db.Column(db.String(100), nullable=False)
    confidence = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    source = db.Column(db.String(255), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'source': self.source,
            'uploaded_at': self.uploaded_at.isoformat()
        }
```

#### Configurer Flask avec SQLAlchemy

```python
# aria-backend/config.py - Mise à jour
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Google Gemini
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    
    # Rasa
    RASA_URL = os.getenv("RASA_URL", "http://localhost:5005")
    
    # Flask
    FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-key-change-in-prod")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
    
    # Database PostgreSQL
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "aria_chatbot")
    DB_USER = os.getenv("DB_USER", "aria_user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
    
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Model
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-pro")
    LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.60"))
    
    @classmethod
    def validate(cls):
        if not cls.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not configured")
    
    @classmethod
    def display(cls):
        print("\n" + "="*60)
        print("CONFIGURATION")
        print("="*60)
        config_items = [
            ("GOOGLE_API_KEY", cls._mask_key(cls.GOOGLE_API_KEY)),
            ("DATABASE", f"{cls.DB_USER}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"),
            ("FLASK_ENV", cls.FLASK_ENV),
            ("LLM_MODEL", cls.LLM_MODEL),
        ]
        for key, value in config_items:
            print(f"{key:<25} {value}")
        print("="*60 + "\n")
    
    @staticmethod
    def _mask_key(key: str, visible=4):
        if not key or len(key) <= visible:
            return "****"
        return f"****...{key[-visible:]}"
```

#### Nouvelle SessionManager avec Database

```python
# aria-backend/session_manager.py - Refactored

from models import db, Session, Message, Intent
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

class SessionManager:
    """Database-backed session management"""
    
    def create_session(self, session_id: str, user_id: str = None, title: str = None) -> dict:
        """Create new session in database"""
        try:
            session = Session(
                id=session_id,
                user_id=user_id,
                title=title or f"Chat {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
            )
            db.session.add(session)
            db.session.commit()
            logger.info(f"Session created: {session_id}")
            return session.to_dict()
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Error creating session: {str(e)}")
            raise
    
    def add_message(self, session_id: str, role: str, content: str, **kwargs) -> dict:
        """Add message to session in database"""
        try:
            # Get session
            session = Session.query.get(session_id)
            if not session:
                self.create_session(session_id)
            
            # Create message
            message = Message(
                session_id=session_id,
                role=role,
                content=content,
                source=kwargs.get('source'),
                intent=kwargs.get('intent'),
                confidence=kwargs.get('confidence'),
                tokens=kwargs.get('tokens', 0),
                metadata=kwargs.get('metadata', {})
            )
            
            db.session.add(message)
            
            # Update session activity
            session = Session.query.get(session_id)
            session.last_activity = datetime.utcnow()
            session.token_count += kwargs.get('tokens', 0)
            
            db.session.commit()
            logger.info(f"Message added to {session_id}")
            return message.to_dict()
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Error adding message: {str(e)}")
            raise
    
    def add_intent(self, session_id: str, intent_name: str, confidence: float = None):
        """Track intent in database"""
        try:
            intent = Intent(
                session_id=session_id,
                intent_name=intent_name,
                confidence=confidence
            )
            db.session.add(intent)
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Error adding intent: {str(e)}")
    
    def get_session(self, session_id: str) -> dict:
        """Get session from database"""
        try:
            session = Session.query.get(session_id)
            if session:
                return session.to_dict()
            return None
        except SQLAlchemyError as e:
            logger.error(f"Error getting session: {str(e)}")
            return None
    
    def get_session_messages(self, session_id: str, limit: int = 50) -> list:
        """Get all messages for session"""
        try:
            messages = Message.query.filter_by(session_id=session_id)\
                .order_by(Message.created_at)\
                .limit(limit)\
                .all()
            return [msg.to_dict() for msg in messages]
        except SQLAlchemyError as e:
            logger.error(f"Error getting messages: {str(e)}")
            return []
    
    def delete_session(self, session_id: str):
        """Delete session from database"""
        try:
            Session.query.filter_by(id=session_id).delete()
            db.session.commit()
            logger.info(f"Session deleted: {session_id}")
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Error deleting session: {str(e)}")
    
    def get_user_sessions(self, user_id: str) -> list:
        """Get all sessions for user"""
        try:
            sessions = Session.query.filter_by(user_id=user_id)\
                .order_by(Session.updated_at.desc())\
                .all()
            return [s.to_dict() for s in sessions]
        except SQLAlchemyError as e:
            logger.error(f"Error getting user sessions: {str(e)}")
            return []
```

#### Mettre à Jour app.py

```python
# aria-backend/app.py - Refactored with Database

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from models import db
from session_manager import SessionManager
from nlp_utils import RasaNLU
from langchain_module import RAGPipeline
import logging
from datetime import datetime

# Setup
app = Flask(__name__)
app.config.from_object(Config)

# Initialize database
db.init_app(app)

# Setup CORS and logging
CORS(app, origins="*")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize managers
session_manager = SessionManager()
rasa_nlp = RasaNLU()
Config.validate()
rag_pipeline = RAGPipeline(Config.GOOGLE_API_KEY)

# Create tables
with app.app_context():
    db.create_all()

# ==================== ENDPOINTS ====================

@app.route("/health", methods=["GET"])
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "flask": "running",
            "database": "connected",
            "rasa": "ready"
        }
    }

@app.route("/session/<session_id>", methods=["GET"])
def get_session(session_id):
    """Get session details"""
    session_data = session_manager.get_session(session_id)
    if not session_data:
        session_data = session_manager.create_session(session_id)
    
    messages = session_manager.get_session_messages(session_id)
    
    return {
        "session": session_data,
        "messages": messages,
        "message_count": len(messages)
    }

@app.route("/session", methods=["POST"])
def create_session():
    """Create new session"""
    try:
        data = request.json
        user_id = data.get("user_id")
        title = data.get("title")
        
        from uuid import uuid4
        session_id = str(uuid4())
        
        session_data = session_manager.create_session(session_id, user_id, title)
        
        return {
            "success": True,
            "session": session_data
        }, 201
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        return {"error": str(e)}, 500

@app.route("/session/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Delete session"""
    try:
        session_manager.delete_session(session_id)
        return {"success": True, "message": "Session deleted"}
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        return {"error": str(e)}, 500

@app.route("/chat", methods=["POST"])
def chat():
    """Main chat endpoint with database storage"""
    try:
        data = request.json
        message = data.get("message", "").strip()
        session_id = data.get("session_id")
        
        if not message or not session_id:
            return {"error": "Missing message or session_id"}, 400
        
        # Ensure session exists
        if not session_manager.get_session(session_id):
            session_manager.create_session(session_id)
        
        # Save user message to database
        session_manager.add_message(
            session_id,
            role="user",
            content=message
        )
        
        # Stage 1: Rasa NLU
        intent_result = rasa_nlp.get_intent(message, session_id)
        confidence = intent_result.get("confidence", 0)
        intent_name = intent_result.get("intent")
        
        source = "rasa"
        if confidence >= Config.CONFIDENCE_THRESHOLD:
            # Use Rasa response
            intent_responses = {
                "greet": "Hello! How can I help you?",
                "goodbye": "Goodbye! Have a great day!",
                "ask_hours": "We are open 9AM-6PM, Monday to Friday.",
            }
            reply = intent_responses.get(intent_name, "Hi there!")
        else:
            # Stage 2: LangChain RAG
            logger.info(f"Low confidence ({confidence}), using LangChain")
            reply = rag_pipeline.generate_response(message)
            source = "langchain"
        
        # Save assistant message to database
        session_manager.add_message(
            session_id,
            role="assistant",
            content=reply,
            source=source,
            intent=intent_name,
            confidence=confidence
        )
        
        # Track intent
        session_manager.add_intent(session_id, intent_name, confidence)
        
        return {
            "success": True,
            "reply": reply,
            "session_id": session_id,
            "intent": intent_name,
            "confidence": confidence,
            "source": source
        }
    
    except Exception as e:
        logger.error(f"Error in /chat: {str(e)}")
        return {"error": str(e)}, 500

@app.route("/user/<user_id>/sessions", methods=["GET"])
def get_user_sessions(user_id):
    """Get all sessions for user"""
    try:
        sessions = session_manager.get_user_sessions(user_id)
        return {
            "success": True,
            "user_id": user_id,
            "sessions": sessions,
            "count": len(sessions)
        }
    except Exception as e:
        logger.error(f"Error getting user sessions: {str(e)}")
        return {"error": str(e)}, 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return {"error": "Not found"}, 404

@app.errorhandler(500)
def server_error(error):
    logger.error(f"Server error: {str(error)}")
    return {"error": "Server error"}, 500

if __name__ == "__main__":
    app.run(debug=True, port=Config.FLASK_PORT)
```

#### Mise à Jour .env

```bash
# aria-backend/.env

# Google Gemini
GOOGLE_API_KEY=your_key_here

# Rasa
RASA_URL=http://localhost:5005

# Flask
FLASK_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_PORT=5000

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aria_chatbot
DB_USER=aria_user
DB_PASSWORD=secure_password_here

# Model Config
LLM_MODEL=gemini-pro
LLM_TEMPERATURE=0.3
CONFIDENCE_THRESHOLD=0.60
```

#### Docker Compose avec PostgreSQL

```yaml
# docker-compose.yml - Updated

version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: aria_postgres
    environment:
      POSTGRES_DB: aria_chatbot
      POSTGRES_USER: aria_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secure_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aria_user -d aria_chatbot"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Rasa NLU
  rasa:
    image: rasa/rasa:3.6.0
    container_name: aria_rasa
    ports:
      - "5005:5005"
    volumes:
      - ./aria-backend/rasa:/app
    command: run --port 5005 --enable-api --cors "*"
    depends_on:
      - postgres

  # Flask Backend
  backend:
    build: ./aria-backend
    container_name: aria_backend
    ports:
      - "5000:5000"
    environment:
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: aria_chatbot
      DB_USER: aria_user
      DB_PASSWORD: ${DB_PASSWORD:-secure_password}
      RASA_URL: http://rasa:5005
      FLASK_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      rasa:
        condition: service_started
    volumes:
      - ./aria-backend:/app

  # React Frontend
  frontend:
    build: ./frontend
    container_name: aria_frontend
    ports:
      - "3000:5173"
    environment:
      VITE_API_URL: http://backend:5000
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### Frontend - Retirer localStorage

```jsx
// frontend/src/App.jsx - Updated

import React, { useState, useEffect } from 'react';
import ChatContainer from './components/ChatContainer';
import HistorySidebar from './components/HistorySidebar';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);

  // Initialize new session
  useEffect(() => {
    createNewSession();
  }, []);

  const createNewSession = async () => {
    try {
      const newSessionId = uuidv4();
      const response = await fetch('http://localhost:5000/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('userId') || null,
          title: `Chat ${new Date().toLocaleString()}`
        })
      });
      
      const data = await response.json();
      setSessionId(data.session.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadSessionMessages = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/session/${id}`);
      const data = await response.json();
      setMessages(data.messages);
      setSessionId(id);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const handleSendMessage = async (text) => {
    // Add user message locally
    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages([...messages, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          source: data.source,
          intent: data.intent,
          confidence: data.confidence
        };
        setMessages([...messages, userMessage, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <HistorySidebar
        sessions={sessions}
        onNewChat={createNewSession}
        onSelectSession={loadSessionMessages}
      />
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
```

---

### Test de la Base de Données

```bash
# 1. Démarrer PostgreSQL
docker-compose up -d postgres

# 2. Démarrer backend
cd aria-backend
python app.py

# 3. Tester endpoints
curl http://localhost:5000/health

# 4. Créer session
curl -X POST http://localhost:5000/session \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user-123","title":"Test Chat"}'

# 5. Envoyer message
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","session_id":"session-id"}'

# 6. Voir messages en DB
docker exec -it aria_postgres psql -U aria_user -d aria_chatbot -c "SELECT * FROM messages;"
```

---

### Avantages Base de Données

✅ **Persistence**: Les conversations restent après redémarrage  
✅ **Multi-utilisateurs**: Support de plusieurs utilisateurs  
✅ **Analytics**: Requêtes sur les données historiques  
✅ **Backup**: Sauvegarde facilement les données  
✅ **Scalabilité**: Peut gérer des millions de messages  
✅ **Sécurité**: Contrôle d'accès par utilisateur  

---

## Conclusion

**Pour construire un chatbot comme ARIA:**

1. ✅ **Préparation** (2 semaines)
   - Setup environnement
   - Décisions architecturales

2. ✅ **Frontend** (2 semaines)
   - React components
   - Styling Tailwind
   - Appels API au backend

3. ✅ **Backend** (3 semaines)
   - Flask API
   - Session management
   - Error handling

4. ✅ **NLP** (3 semaines)
   - Rasa intégration
   - LangChain RAG
   - Gemini API

5. ✅ **Base de Données** (2 semaines) - OPTIONNEL
   - PostgreSQL setup
   - SQLAlchemy models
   - Migration depuis RAM

6. ✅ **Intégration** (2 semaines)
   - Docker Compose
   - Testing
   - Deployment

**Total: 12-14 semaines pour production complète**

Commencez par les 12 semaines, puis ajoutez PostgreSQL pour la production!

---

**Made with ❤️ for Developers**  
**Last Updated**: March 9, 2026

---

**Made with ❤️ for Developers**  
**Last Updated**: March 9, 2026
