# 🤖 ARIA Chatbot - Intelligent Conversational AI

A modern, production-ready chatbot platform built with **React**, **Flask**, **Rasa NLU**, **LangChain**, and **Groq** for ultra-fast AI responses.

![Status](https://img.shields.io/badge/Status-MVP-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)
![Node](https://img.shields.io/badge/Node-18+-green?logo=node.js)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

---

## 📋 Quick Navigation

| Document | Purpose |
|----------|---------|
| 🚀 [QUICKSTART.md](./QUICKSTART.md) | **Setup & run in 5 minutes** |
| 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flow, decisions |
| 📁 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Directory organization & code overview |
| 💻 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | Code standards, testing, best practices |
| 📡 [aria-backend/README.md](./aria-backend/README.md) | API endpoints & backend docs |

---

## ✨ Features

### 💬 Smart Chat Interface
- **Real-time messaging** with typing indicators
- **Chat history** persisted in localStorage
- **Responsive design** (mobile, tablet, desktop)
- **Auto-scroll** to latest messages

### 🧠 Advanced NLP Pipeline
- **Rasa NLU** - Intent classification (local, no API)
- **LangChain** - Retrieval-Augmented Generation (RAG)
- **Groq API** - Ultra-fast LLM (free tier, 8+ tokens/sec)
- **FAISS** - Vector similarity search
- **Fallback logic** - Rasa → LangChain → Groq

### 📊 Session Management
- Per-conversation storage with unique IDs
- Token counting for usage tracking
- Intent tracking with confidence scores
- Message history with metadata

---

## 🚀 Quick Start

```bash
# 1. Clone & navigate
git clone <repo-url>
cd finalchat

# 2. Run setup (handles everything)
./setup.sh          # Linux/Mac
setup.bat           # Windows

# 3. Open browser
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

**First run takes 3-5 minutes** (Rasa model training). ☕

📚 [Detailed Setup →](./QUICKSTART.md)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Frontend (React 18 + Vite)        │
│   Port: 3000                        │
└──────────────┬──────────────────────┘
               │ HTTP /chat
               ▼
┌─────────────────────────────────────┐
│   Backend API (Flask + Python)      │
│   Port: 5000                        │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
    ┌────────┐   ┌──────────┐
    │ Rasa   │   │LangChain│
    │ NLU    │   │+ FAISS  │
    │(Local) │   │+ Groq   │
    └────────┘   └──────────┘
```

**Data Flow:**
1. User sends message (React)
2. Frontend calls POST /chat (Axios)
3. Backend processes (Flask)
4. Rasa classifies intent
5. LangChain retrieves docs if needed
6. Groq generates response
7. Response returned to frontend

📚 [Full Architecture →](./ARCHITECTURE.md)

---

## 📁 Project Structure

```
finalchat/
├── frontend/                    # React UI (241 lines)
│   ├── src/App.jsx             # Main component
│   ├── src/components/         # Chat UI components
│   └── package.json
│
├── aria-backend/                # Flask API (~1000 lines)
│   ├── app.py                  # Main application (6 routes)
│   ├── config.py               # Configuration loader
│   ├── session_manager.py      # Session storage
│   ├── nlp_utils.py            # Text processing
│   ├── langchain_module.py     # RAG + LLM engine
│   ├── requirements.txt        # Python packages
│   └── .env.example
│
├── ARCHITECTURE.md              # System design (2000+ lines)
├── PROJECT_STRUCTURE.md         # Code organization
├── DEVELOPMENT_GUIDE.md         # Best practices
├── QUICKSTART.md               # Setup instructions
└── docker-compose.yml
```

📚 [Full Structure →](./PROJECT_STRUCTURE.md)

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Axios |
| **Backend** | Flask 2.3, Python 3.10, Rasa 3.6.0 |
| **NLP** | LangChain, FAISS, Sentence-Transformers, spaCy |
| **LLM** | Groq API (llama-3.3-70b-versatile) |
| **Infrastructure** | Docker, Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ & npm
- Groq API key (free at [console.groq.com/keys](https://console.groq.com/keys))

### Steps

1. **Get Groq Key**: https://console.groq.com/keys (free signup)
2. **Clone & Setup**:
   ```bash
   git clone <repo-url>
   cd finalchat
   ./setup.sh
   ```
3. **Add API Key**: Edit `aria-backend/.env` with your Groq key
4. **Open Browser**: http://localhost:3000

📚 [Detailed Guide →](./QUICKSTART.md)

---

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Health check |
| `POST` | `/chat` | Send message (main endpoint) |
| `POST` | `/langchain` | Direct LangChain call |
| `POST` | `/build-index` | Build document vectorstore |
| `GET` | `/session/:id` | Get session stats |
| `DELETE` | `/session/:id` | Delete session |

**Example:**
```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "session_id": "user-1"}'
```

📚 [Full API Docs →](./aria-backend/README.md)

---

## 💻 Development

### Code Quality
- ✅ Type hints on all functions
- ✅ Docstrings on classes/functions
- ✅ Comprehensive error handling
- ✅ Logging on all key operations

### Adding Features
1. Create feature branch: `git checkout -b feature/my-feature`
2. Write code with tests
3. Follow [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
4. Submit PR

📚 [Development Guide →](./DEVELOPMENT_GUIDE.md)

---

## 🔒 Security

### ✅ MVP Security
- Environment-based secrets (.env)
- Input validation
- CORS enabled for localhost

### 🔲 Production Needs
- JWT authentication
- Rate limiting
- HTTPS/TLS
- Audit logging

📚 [Security Details →](./DEVELOPMENT_GUIDE.md#-security-guidelines)

---

## 🐛 Troubleshooting

### Backend not running?
```bash
cd aria-backend
docker-compose ps
docker-compose logs flask
```

### Can't reach backend from frontend?
- Check: http://localhost:5000/health
- View browser console (F12) for errors
- Verify Docker containers running

### Groq API errors?
- Verify API key in `.env`
- Get key from: https://console.groq.com/keys
- Check rate limits

📚 [Full Troubleshooting →](./QUICKSTART.md#-troubleshooting)

---

## 📊 Performance

**Typical Response Times:**
- Rasa only: 50-100ms
- LangChain + FAISS: 200-500ms  
- Full pipeline (Groq): 1-3 seconds

**Resource Usage:**
- Memory: ~500MB
- CPU: Minimal
- Disk: ~2GB (models)

---

## 🎯 Roadmap

| Phase | Features | Status |
|-------|----------|--------|
| **Phase 1 (Current)** | Chat, history, NLU, RAG | ✅ Complete |
| **Phase 2** | Database, auth, analytics | 🔲 Planned |
| **Phase 3** | Multi-language, voice, streaming | 🔲 Future |
| **Phase 4** | Fine-tuning, multi-modal | 🔲 Long-term |

---

## 📚 Documentation Files

1. **[QUICKSTART.md](./QUICKSTART.md)** - Setup instructions (5 min setup)
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design & decisions
3. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Code organization
4. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Standards & best practices
5. **[aria-backend/README.md](./aria-backend/README.md)** - API reference
6. **[frontend/README.md](./frontend/README.md)** - Component docs (if exists)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Follow [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
4. Submit Pull Request

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🔗 Resources

- [Rasa Docs](https://rasa.com/docs/)
- [LangChain Docs](https://python.langchain.com/)
- [Groq API](https://console.groq.com/docs/)
- [FAISS Guide](https://github.com/facebookresearch/faiss)
- [React Docs](https://react.dev/)

---

**Status**: ✅ MVP Ready  
**Last Updated**: March 7, 2026  
**Version**: 1.0.0