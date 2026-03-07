# ARIA Chatbot - Project Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ARIA Chatbot System                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   FRONTEND       │         │    BACKEND API   │          │
│  │   (React/Vite)   │◄──────► │   (Flask/Python) │          │
│  │  Port: 3000      │  HTTP   │   Port: 5000     │          │
│  └──────────────────┘         └──────────────────┘          │
│         ▲                             ▲                      │
│         │ localStorage                │ Session Manager     │
│         │                             ├─► In-Memory Store   │
│         │                    ┌────────┘                      │
│         │                    │                               │
│         │              ┌─────▼──────────┐                    │
│         │              │  NLP Pipeline  │                    │
│         │              ├─────────────────┤                    │
│         │              │ 1. Rasa NLU    │                    │
│         │              │ 2. LangChain   │                    │
│         │              │ 3. Groq LLM    │                    │
│         │              │ 4. FAISS RAG   │                    │
│         │              └─────────────────┘                    │
│         │                    ▲                               │
│         │                    │                               │
│         └────────────────────┘                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Overview

### **Frontend (React 18 + Vite + Tailwind)**
- **Purpose**: User-facing chat interface
- **Tech Stack**: React 18, Vite, Tailwind CSS, Axios
- **State Management**: React Hooks + localStorage
- **Key Features**:
  - Real-time message display
  - Chat history persistence
  - Responsive design (mobile/tablet/desktop)
  - Auto-scroll to latest messages
  - Typing indicator animation

### **Backend API (Flask + Python)**
- **Purpose**: Central business logic and NLP orchestration
- **Tech Stack**: Flask, Python 3.10, Groq API, Rasa
- **Port**: 5000
- **Key Responsibilities**:
  - HTTP REST API endpoints
  - Session management
  - NLU routing (Rasa → LangChain → Groq)
  - Token tracking
  - Error handling & logging

### **NLU Pipeline (Multi-Stage)**

#### **Stage 1: Rasa NLU (Intent Classification)**
- **Model**: Rasa 3.6.0 (intent + entity extraction)
- **Confidence Threshold**: 0.60
- **On Success**: Use Rasa response
- **On Low Confidence**: Fall back to LangChain

#### **Stage 2: LangChain (RAG + Memory)**
- **Vector Store**: FAISS (CPU-based)
- **Embeddings**: Sentence-Transformers (all-MiniLM-L6-v2)
- **Memory**: Conversation Buffer (in-memory)
- **Features**: Document retrieval + context injection

#### **Stage 3: Groq LLM (Fallback Generator)**
- **Model**: llama-3.3-70b-versatile
- **Provider**: Groq API (free, ultra-fast)
- **Temperature**: 0.3 (deterministic responses)
- **Backup Models**: llama-3.1-8b-instant, gemma-2-9b-it

### **Session Manager**
- **Storage**: In-memory Python dictionary (per container lifetime)
- **Structure**:
  ```python
  {
    "session_id": {
      "id": str,
      "created_at": datetime,
      "messages": [{"role", "content", "timestamp", "intent", "confidence"}],
      "intent_history": [],
      "token_count": int
    }
  }
  ```
- **Lifetime**: Container restart clears all sessions (acceptable for MVP)

---

## 🔄 Request Flow

```
┌────────────────────────────────────────────────────────────┐
│ 1. User sends message from React frontend                  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 2. Axios POST /chat with {message, session_id}             │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 3. Flask app.py processes request                          │
│    - Validate input                                        │
│    - Preprocess text (lowercase, normalize)                │
│    - Detect language                                       │
│    - Estimate tokens                                       │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 4. Call Rasa NLU (/parse endpoint)                         │
│    - Extract intent + confidence + entities               │
└────────────────────────┬───────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         YES  ▼                     ▼  NO
     (confidence                (confidence
      >= 0.60)                   < 0.60)
              │                     │
              │              ┌──────▼──────┐
              │              │ Call         │
              │              │ LangChain    │
              │              └──────┬───────┘
              │                     │
              │              ┌──────▼───────────────┐
              │              │ 1. Retrieve docs     │
              │              │ 2. Inject context    │
              │              │ 3. Call Groq LLM     │
              │              └──────┬───────────────┘
              │                     │
              └─────────┬───────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ 5. Format response {reply, intent, confidence, source}     │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 6. Save to session history + increment token count         │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 7. Return JSON response to frontend                        │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 8. React displays message + saves to localStorage          │
└────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### **Primary Routes**

| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| GET | `/health` | Health check | - | `{status, timestamp, version}` |
| POST | `/chat` | Main chat endpoint | `{message, session_id}` | `{reply, intent, confidence, source, session_id}` |
| POST | `/langchain` | Direct LangChain call | `{message, session_id}` | `{answer, tokens_used, source}` |
| POST | `/build-index` | Build FAISS vectorstore | `{files[]}` + header auth | `{status, indexed_docs}` |
| GET | `/session/{id}` | Get session stats | session_id | `{message_count, token_count, top_intent}` |
| DELETE | `/session/{id}` | Delete session | session_id | `{status}` |

---

## 🧠 Technology Decisions

### **Why Groq over OpenAI?**
- ✅ **Free tier** with no quota limits
- ✅ **Ultra-fast inference** (8+ tokens/second)
- ✅ **No billing** for testing/development
- ❌ OpenAI requires paid API key

### **Why Rasa for NLU?**
- ✅ **Specialized intent classification** without API calls
- ✅ **Entity extraction** for structured data
- ✅ **Runs locally** (no external API)
- ❌ Requires model training (auto-generated in Docker)

### **Why FAISS for RAG?**
- ✅ **CPU-based** vectorstore (no GPU needed)
- ✅ **Fast similarity search** for document retrieval
- ✅ **No external dependencies** (local storage)
- ❌ Limited to CPU performance (acceptable for MVP)

### **Why Sentence-Transformers for embeddings?**
- ✅ **Universal embeddings** (all-MiniLM-L6-v2)
- ✅ **Lightweight** (~80MB)
- ✅ **Fast inference** on CPU
- ✅ **Open source** (no API calls)

---

## 🚀 Deployment Model

### **Current: Docker Compose (Development)**
```
┌──────────────────────────────────────────┐
│        Docker Container (Linux)          │
├──────────────────────────────────────────┤
│  Service 1: Flask API (Port 5000)        │
│  Service 2: Rasa NLU (Port 5005)         │
│  Service 3: Rasa Actions (Port 5055)     │
└──────────────────────────────────────────┘
```

### **Future: Production Deployment Options**
1. **AWS**: ECS + RDS (database) + S3 (documents)
2. **GCP**: Cloud Run + Firestore + GCS
3. **Azure**: App Service + Cosmos DB + Blob Storage
4. **Heroku**: Single dyno (lightweight) or multi-dyno

---

## 💾 Data Flow & Persistence

### **Session Data**
```
Frontend (localStorage)  ←→  Browser Cache
    ↓
    └─→ Flask Backend (in-memory dict)
           └─→ Lost on container restart
```

### **Documents/RAG Data**
```
aria-backend/data/docs/
    ├── *.txt (TextLoader)
    ├── *.pdf (PyPDFLoader)
    └─→ FAISS Index (./data/faiss_index/)
```

### **Configuration**
```
.env file → Config class → All modules
  └─→ GROQ_API_KEY, RASA_URL, LLM_MODEL, etc.
```

---

## 🔐 Security Considerations

### **Current Gaps (MVP)**
- ❌ No authentication (anyone can access /chat)
- ❌ No rate limiting (DDoS vulnerable)
- ❌ No HTTPS (HTTP only)
- ❌ API keys in .env file (exposed if committed to git)
- ❌ CORS allows all origins (`*`)

### **Production Improvements**
- ✅ Add JWT token authentication
- ✅ Implement rate limiting (flask-limiter)
- ✅ Use HTTPS/TLS certificates
- ✅ Store secrets in AWS Secrets Manager / HashiCorp Vault
- ✅ Restrict CORS to specific domains
- ✅ Add request validation & sanitization
- ✅ Implement input size limits
- ✅ Add audit logging

---

## 📊 Performance Metrics

### **Typical Response Times**
- **Rasa only**: 50-100ms
- **LangChain + FAISS**: 200-500ms
- **Full pipeline (Groq LLM)**: 1-3 seconds
- **Network roundtrip**: 100-200ms

### **Scalability Bottlenecks**
1. **In-memory sessions**: Limited by RAM (no persistence)
2. **FAISS vectorstore**: Single instance (no distributed search)
3. **Rasa model**: Single instance (no API load balancing)
4. **Groq API**: Free tier rate limits (~10 req/min)

---

## 🧪 Testing Strategy

### **Unit Tests** (Not yet implemented)
```python
# tests/test_nlp_utils.py
def test_preprocess_text()
def test_extract_keywords()
def test_estimate_tokens()

# tests/test_session_manager.py
def test_create_session()
def test_add_message()
def test_get_stats()
```

### **Integration Tests** (Not yet implemented)
```python
# tests/test_api_endpoints.py
def test_chat_endpoint()
def test_langchain_endpoint()
def test_health_endpoint()
```

### **E2E Tests** (Manual for now)
- Open frontend → Send message → Verify response displayed

---

## 📝 Code Quality Standards

### **Current State**
- ✅ Type hints on all functions
- ✅ Docstrings on all modules/classes
- ✅ Error handling (try/except) throughout
- ✅ Logging on INFO/WARNING/ERROR levels
- ❌ No unit tests
- ❌ No linting (pylint/flake8)
- ❌ No type checking (mypy)

### **Improvements Needed**
1. Add `.pylintrc` and run linting
2. Add `mypy.ini` and check types
3. Add unit tests with pytest
4. Add CI/CD pipeline (GitHub Actions)
5. Add code coverage tracking
6. Add pre-commit hooks

---

## 🎯 Future Roadmap

### **Phase 2: Enhanced Features**
- [ ] Multi-language support (Spanish, French, etc.)
- [ ] Document upload UI
- [ ] Custom Rasa model training UI
- [ ] Analytics dashboard
- [ ] User feedback mechanism

### **Phase 3: Production Ready**
- [ ] Database persistence (PostgreSQL)
- [ ] User authentication (OAuth)
- [ ] Rate limiting & quotas
- [ ] Monitoring & alerts (DataDog, New Relic)
- [ ] Distributed Rasa/FAISS

### **Phase 4: Advanced AI**
- [ ] Fine-tuned LLM (LoRA)
- [ ] Multi-modal support (images)
- [ ] Voice input/output
- [ ] Real-time streaming responses
- [ ] Multi-turn conversation memory

---

## 📚 Reference Documentation

- **Frontend**: [frontend/README.md](../frontend/README.md)
- **Backend**: [aria-backend/README.md](../aria-backend/README.md)
- **Setup**: [QUICKSTART.md](../QUICKSTART.md)

---

**Last Updated**: March 7, 2026  
**Status**: MVP (Minimum Viable Product)  
**License**: MIT
