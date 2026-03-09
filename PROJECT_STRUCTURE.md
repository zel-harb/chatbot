# ARIA Chatbot - Project Structure

## 📁 Directory Organization

```
finalchat/
├── 📄 README.md                    # Main project documentation
├── 📄 ARCHITECTURE.md              # System design & technical details
├── 📄 PROJECT_STRUCTURE.md         # This file
├── 📄 QUICKSTART.md                # Quick setup guide
├── 📄 Makefile                     # Build automation commands
├── 🐳 docker-compose.yml           # Root docker orchestration
├── 📜 setup.sh                     # Linux/Mac setup script
├── 📜 setup.bat                    # Windows setup script
│
├── 📁 frontend/                    # React User Interface
│   ├── 📄 README.md               # Frontend documentation
│   ├── 📄 package.json            # npm dependencies
│   ├── 📄 package-lock.json       # Locked dependency versions
│   ├── 📄 index.html              # HTML entry point
│   ├── 📄 vite.config.js          # Vite bundler config
│   ├── 📄 tailwind.config.js      # Tailwind CSS config
│   ├── 📄 postcss.config.js       # PostCSS plugins
│   │
│   └── 📁 src/
│       ├── 📄 main.jsx            # React root mount point
│       ├── 📄 App.jsx             # Main app component (241 lines)
│       ├── 📄 index.css           # Global styles
│       │
│       └── 📁 components/
│           ├── 📄 ChatContainer.jsx      # Messages display area
│           ├── 📄 Message.jsx            # Individual message bubble
│           ├── 📄 MessageInput.jsx       # Text input + send button
│           ├── 📄 TypingIndicator.jsx   # Loading animation
│           └── 📄 HistorySidebar.jsx    # Chat history navigation
│
├── 📁 aria-backend/                # Python Flask Backend
│   ├── 📄 README.md               # Backend API documentation
│   ├── 📄 requirements.txt        # Python package dependencies
│   ├── 📄 .env.example            # Environment variables template
│   ├── 📄 .env                    # Actual env vars (gitignored)
│   ├── 📄 Dockerfile              # Docker image definition
│   ├── 📄 docker-compose.yml      # Compose file for services
│   │
│   ├── 📄 app.py                  # Flask main app (534 lines)
│   │   ├── 6 REST API endpoints
│   │   ├── Rasa integration
│   │   ├── LangChain fallback
│   │   ├── Error handling
│   │   └── Request logging
│   │
│   ├── 📄 config.py               # Configuration management (102 lines)
│   │   ├── Load .env variables
│   │   ├── Config validation
│   │   ├── Configuration display
│   │   └── Default values
│   │
│   ├── 📄 session_manager.py      # Session storage (190 lines)
│   │   ├── In-memory session dict
│   │   ├── Message persistence
│   │   ├── Intent tracking
│   │   ├── Token counting
│   │   └── Session statistics
│   │
│   ├── 📄 nlp_utils.py            # NLP utilities (339 lines)
│   │   ├── Text preprocessing
│   │   ├── Keyword extraction
│   │   ├── Language detection
│   │   ├── Token estimation
│   │   └── Confidence boosting
│   │
│   ├── 📄 langchain_module.py     # LangChain integration (304 lines)
│   │   ├── Gemini LLM initialization
│   │   ├── HuggingFace embeddings
│   │   ├── FAISS vectorstore
│   │   ├── Conversation memory
│   │   ├── RAG chain setup
│   │   └── Response generation
│   │
│   └── 📁 data/
│       └── 📁 docs/              # Document storage
│           └── .gitkeep          # Placeholder for documents
│
└── 📄 .gitignore                  # Git ignore rules

```

---

## 📊 Lines of Code Breakdown

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **Backend** | `app.py` | 534 | Flask API, routes, orchestration |
| | `langchain_module.py` | 304 | LangChain RAG, LLM integration |
| | `nlp_utils.py` | 339 | Text processing utilities |
| | `session_manager.py` | 190 | Session storage & management |
| | `config.py` | 102 | Configuration loader |
| **Frontend** | `App.jsx` | 241 | Main component, state mgmt |
| | `HistorySidebar.jsx` | 108 | History navigation & display |
| | Other components | ~150 | Chat UI components |
| **Config** | Various | ~50 | Webpack, Tailwind, PostCSS |
| **Total** | - | ~2000 | Entire application |

---

## 🔄 Component Dependencies

### **Backend Dependencies**
```
app.py
├── config.py           (loads environment)
├── session_manager.py  (session storage)
├── nlp_utils.py        (text processing)
├── langchain_module.py (RAG + LLM)
│   ├── ChatGoogleGenerativeAI (Gemini API)
│   ├── HuggingFaceEmbeddings
│   └── FAISS (vectorstore)
└── External APIs
    ├── Rasa (port 5005)
    └── Google Gemini API (HTTP)
```

### **Frontend Dependencies**
```
React App
├── vite (bundler)
├── tailwind (styling)
├── axios (HTTP)
└── localStorage (persistence)
```

---

## 🎯 Key Files Overview

### **Critical Files (Don't Delete)**
- ✅ `app.py` - Core business logic
- ✅ `docker-compose.yml` - Service orchestration
- ✅ `requirements.txt` - Python dependencies
- ✅ `.env` - Configuration (keep secret)
- ✅ `App.jsx` - Frontend entry

### **Important Files (Reference)**
- 📚 `README.md` - Main documentation
- 🏗️ `ARCHITECTURE.md` - System design
- 🚀 `QUICKSTART.md` - Setup instructions
- 📝 `config.py` - Configuration handler

### **Utility Files (Can Refactor)**
- 🔧 `nlp_utils.py` - Could split into `text_processing.py` + `embeddings.py`
- 🔧 `langchain_module.py` - Could become `llm_engine.py`
- 🔧 `session_manager.py` - Could become `persistence.py`

---

## 📦 Recommended Refactoring (Not Critical)

### **Current** → **Proposed**
```
aria-backend/
├── app.py             → app.py (keep as is)
├── config.py          → config/config.py
├── session_manager.py → persistence/session_store.py
├── nlp_utils.py       → nlp/text_processor.py
└── langchain_module.py→ llm/gemini_engine.py
```

But **current structure is fine for MVP** - don't restructure unless needed.

---

## 🔌 API File Organization

If `app.py` grows beyond 600 lines, split into:
```
aria-backend/
├── app.py              # Flask app init + main routes
└── api/
    ├── routes/
    │   ├── chat.py     # POST /chat
    │   ├── session.py  # GET/DELETE /session
    │   └── health.py   # GET /health
    └── utils/
        ├── validators.py
        └── response.py
```

---

## 🧪 Testing Directory (Future)

```
aria-backend/
├── tests/
│   ├── __init__.py
│   ├── test_app.py
│   ├── test_nlp.py
│   ├── test_session.py
│   └── test_langchain.py
└── conftest.py         # pytest configuration
```

Frontend would add:
```
frontend/
└── __tests__/
    ├── App.test.jsx
    ├── ChatContainer.test.jsx
    └── MessageInput.test.jsx
```

---

## 📝 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Overview, quick links |
| `ARCHITECTURE.md` | System design, data flow, decisions |
| `PROJECT_STRUCTURE.md` | Directory layout (this file) |
| `QUICKSTART.md` | Setup instructions |
| `aria-backend/README.md` | API endpoint reference |
| `frontend/README.md` | Component documentation |

---

## .gitignore Rules

```
# Environment
.env
.env.local

# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Build outputs
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml

# Data (optional)
data/faiss_index/
data/docs/*.pdf
data/docs/*.txt
```

---

## 📋 Configuration Files

### **Backend Configuration**
| File | Purpose |
|------|---------|
| `.env` | Runtime environment variables |
| `config.py` | Configuration loader class |
| `dockerfile` | Container image definition |
| `docker-compose.yml` | Service orchestration |

### **Frontend Configuration**
| File | Purpose |
|------|---------|
| `package.json` | npm scripts & dependencies |
| `vite.config.js` | Build process configuration |
| `tailwind.config.js` | CSS framework customization |
| `postcss.config.js` | CSS processing plugins |

---

## 🔐 Security Notes

### **Sensitive Files (Keep Private)**
```
.env                    ← Contains GOOGLE_API_KEY
.env.local             ← Local overrides
docker-compose.override.yml
```

### **Safe to Share**
```
.env.example           ← Template without secrets
Dockerfile             ← Image definition
requirements.txt       ← Dependencies list
```

### **.gitignore Must Include**
```
.env
*.key
*.pem
secrets/
credentials/
```

---

## 🚀 Build & Deployment Artifacts

### **Frontend Build**
```
frontend/
└── dist/               ← Created by: npm run build
    ├── index.html
    ├── assets/
    │   ├── index.*.js
    │   └── index.*.css
```

### **Docker Images**
```
aria-backend:latest    ← Backend container
rasa/rasa:3.6.0       ← Rasa NLU service
```

### **Database/Storage** (Future)
```
data/
├── faiss_index/       ← Vector embeddings
├── docs/              ← Source documents
└── database.sqlite    ← (Future) local DB
```

---

## 📈 Scaling Considerations

### **Current: Single Container**
- ✅ Simple deployment
- ✅ Easy local development
- ❌ No horizontal scaling
- ❌ Data lost on restart

### **Recommended: Multi-Container (Phase 2)**
```
docker-compose.yml
├── flask (port 5000)
│   └── 3 replicas (load balanced)
├── rasa (port 5005)
│   └── 1 instance
├── postgres (port 5432)
│   └── Persistent storage
└── redis (port 6379)
    └── Session cache
```

---

## 🧾 Dependency Management

### **Python**
- Base image: `python:3.10-slim`
- Package manager: `pip`
- Lock file: `requirements.txt` (pinned versions)
- Update: `pip install --upgrade -r requirements.txt`

### **JavaScript**
- Base image: Node 18+ (via nvm)
- Package manager: `npm`
- Lock file: `package-lock.json`
- Update: `npm update`

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Total Files | ~40 |
| Python Files | 5 |
| JavaScript Files | 7 |
| Config Files | 8 |
| Documentation Files | 4 |
| Total Lines of Code | ~2000 |
| Total Lines of Config | ~500 |
| Total Documentation | ~2000 lines |

---

**Last Updated**: March 7, 2026  
**Project Status**: MVP - Minimum Viable Product  
**Next Phase**: Refactoring & Enhanced Features
