# ARIA Backend - Conversational AI Assistant

A Flask-based conversational AI backend powered by Rasa NLU, LangChain, and OpenAI.

## Features

- **Rasa NLU Integration** - Intent classification and entity extraction
- **LangChain RAG** - Document-based question answering with FAISS vector store
- **OpenAI LLM** - GPT-3.5-turbo/GPT-4 powered responses
- **Session Management** - In-memory conversation history per user
- **Token Tracking** - API usage and cost estimation
- **Language Detection** - Automatic language identification
- **Docker Ready** - Complete Docker and Docker Compose setup

## Prerequisites

- Python 3.10+
- pip (Python package manager)
- Rasa 3.6.0 (for NLU training and inference)
- Docker & Docker Compose (optional, for containerized setup)
- OpenAI API Key (for LLM functionality)

## Installation

### 1. Clone or Setup Project

```bash
cd /path/to/finalchat/aria-backend
```

### 2. Create Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Download spaCy Model

```bash
python -m spacy download en_core_web_sm
```

### 5. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and set your values:
# - OPENAI_API_KEY=your_key_here
# - RASA_URL=http://localhost:5005
# - FLASK_SECRET_KEY=your_secret_key
```

## Running the Application

### Option 1: Manual Setup (Development)

#### Start Rasa Server

```bash
# In the ./rasa directory
rasa train  # Train the Rasa model (if needed)
rasa run -p 5005 --enable-api --cors "*"
```

#### Start Actions Server (Optional)

```bash
# In the ./rasa directory, in another terminal
rasa run actions
```

#### Start Flask Backend

```bash
# In the aria-backend directory
python app.py
```

The API will be available at `http://localhost:5000`

### Option 2: Docker Compose (Production)

```bash
# Start all services
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## API Endpoints

### Health Check

**GET /health**

Check application status.

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-06T12:00:00.000000",
  "version": "1.0.0",
  "rasa_url": "http://localhost:5005"
}
```

### Chat (Main Endpoint)

**POST /chat**

Send a message and get a response with Rasa + LangChain fallback.

```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Python?",
    "session_id": "user123"
  }'
```

Request:
```json
{
  "message": "string (required) - User message",
  "session_id": "string (optional) - Conversation session ID, auto-generated if not provided"
}
```

Response:
```json
{
  "reply": "Python is a programming language...",
  "intent": "faq_programming",
  "confidence": 0.87,
  "source": "rasa",
  "session_id": "user123",
  "language": "en",
  "tokens": 145
}
```

### LangChain Direct

**POST /langchain**

Get response directly from LangChain, bypassing Rasa.

```bash
curl -X POST http://localhost:5000/langchain \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain machine learning",
    "session_id": "user123"
  }'
```

Response:
```json
{
  "reply": "Machine learning is...",
  "intent": "",
  "confidence": 1.0,
  "source": "langchain",
  "session_id": "user123",
  "language": "en",
  "tokens": 234
}
```

### Build Documentation Index

**POST /build-index**

Build FAISS vectorstore from documents in `./data/docs/`.

Requires admin authentication via `X-Admin-Token` header.

```bash
curl -X POST http://localhost:5000/build-index \
  -H "X-Admin-Token: your-secret-key"
```

Response:
```json
{
  "status": "ok",
  "message": "Index built successfully"
}
```

### Get Session Statistics

**GET /session/{session_id}**

Retrieve conversation statistics for a session.

```bash
curl http://localhost:5000/session/user123
```

Response:
```json
{
  "message_count": 5,
  "token_count": 892,
  "top_intent": "faq_programming",
  "top_intent_confidence": 0.89,
  "session_duration": "0:05:23.123456",
  "total_intents_detected": 3
}
```

### Delete Session

**DELETE /session/{session_id}**

Remove a session from memory.

```bash
curl -X DELETE http://localhost:5000/session/user123
```

Response:
```json
{
  "status": "deleted"
}
```

## Configuration

All configuration is managed via environment variables in `.env`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Rasa Configuration
RASA_URL=http://localhost:5005
RASA_TOKEN=

# Flask Configuration
FLASK_SECRET_KEY=your-secret-key
FLASK_ENV=development
FLASK_PORT=5000

# Model Configuration
LLM_MODEL=gpt-3.5-turbo
LLM_TEMPERATURE=0.3
CONFIDENCE_THRESHOLD=0.60

# Document Configuration
DOCS_PATH=./data/docs
EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

## Adding Documents

1. Place your documents in `./data/docs/`:
   - `.txt` files
   - `.pdf` files

2. Build the FAISS index:

```bash
curl -X POST http://localhost:5000/build-index \
  -H "X-Admin-Token: your-secret-key"
```

3. The index will be saved to `./data/faiss_index` and automatically loaded on app restart.

## Project Structure

```
aria-backend/
├── app.py                    # Flask application and routes
├── config.py                 # Configuration management
├── session_manager.py        # Session and conversation storage
├── langchain_module.py       # LangChain and RAG integration
├── nlp_utils.py             # NLP utilities (preprocessing, language detection, etc.)
├── requirements.txt          # Python dependencies
├── .env.example             # Example environment variables
├── Dockerfile               # Docker image definition
├── docker-compose.yml       # Docker Compose orchestration
├── data/
│   ├── docs/               # Place your documents here (.txt, .pdf)
│   └── faiss_index/        # FAISS vectorstore (auto-generated)
└── rasa/                   # Rasa NLU configuration (separate repo/directory)
    ├── nlu.yml
    ├── domain.yml
    ├── rules.yml
    └── actions/
```

## Docker Setup

### Build and Run with Docker Compose

```bash
# Start all services
docker-compose up --build

# In another terminal, configure our .env
cp .env.example .env
# Edit .env with your settings

# Access the services:
# - Flask API: http://localhost:5000
# - Rasa Server: http://localhost:5005
# - Actions Server: http://localhost:5055
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f flask
docker-compose logs -f rasa
docker-compose logs -f actions
```

### Stop Services

```bash
docker-compose down

# Remove volumes as well
docker-compose down -v
```

## Troubleshooting

### Rasa Connection Error

If Flask cannot connect to Rasa:
- Ensure Rasa is running on the configured port (default 5005)
- Check `RASA_URL` in `.env`
- Verify firewall settings

### FAISS Index Not Found

The LangChain module will work without an index:
- It will use LLM fallback without document retrieval
- To enable RAG, place documents in `./data/docs/` and call `/build-index`

### OpenAI API Errors

- Verify `OPENAI_API_KEY` is set correctly in `.env`
- Check API key is valid and has sufficient credits
- Verify network connectivity to OpenAI

### Memory Usage

Session data is stored in memory. For production:
- Implement database persistence (PostgreSQL, MongoDB, etc.)
- Clear old sessions periodically
- Monitor session count and memory usage

## Development

### Logging

Logs are output to console at INFO level. Adjust in `config.py` or command line:

```bash
# Increase verbosity
LOGLEVEL=DEBUG python app.py
```

### Hot Reload

When running locally with `FLASK_ENV=development`, Flask automatically reloads on code changes.

### Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test chat endpoint
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## License

MIT

## Support

For issues or questions, refer to:
- [Rasa Documentation](https://rasa.com/docs/)
- [LangChain Documentation](https://python.langchain.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
