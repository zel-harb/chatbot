# ARIA Chatbot - Complete Setup Guide

## Quick Start (5 Minutes)

### 1. Backend Setup

```bash
cd /home/zel-harb/Desktop/finalchat/aria-backend

# Copy environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# nano .env  (or use your editor)
```

### 2. Start Backend (Option A: Docker - Easiest)

```bash
# From aria-backend directory
docker-compose up

# Wait for all services to start (Rasa takes 1-2 minutes)
# You should see: "Starting ARIA backend on port 5000"
```

**Services running:**
- Flask API: http://localhost:5000
- Rasa NLU: http://localhost:5005
- Rasa Actions: http://localhost:5055

### 3. Start Backend (Option B: Manual - For Development)

```bash
# Terminal 1: Start Rasa
cd aria-backend/rasa
rasa train  # First time only
rasa run -p 5005 --enable-api --cors "*"

# Terminal 2: Start Rasa Actions (if needed)
cd aria-backend/rasa
rasa run actions

# Terminal 3: Start Flask
cd aria-backend
python app.py
```

Flask API will be available at: http://localhost:5000

### 4. Frontend Setup

```bash
cd /home/zel-harb/Desktop/finalchat/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## Full Setup with All Components

### Prerequisites Check

```bash
# Check Python version
python --version  # Should be 3.10+

# Check Node.js
node --version   # Should be 16+
npm --version

# Check Docker (if using Docker)
docker --version
docker-compose --version
```

---

## Step-by-Step Setup

### Backend Setup (Docker Method - Recommended)

```bash
cd aria-backend

# 1. Create .env file
cp .env.example .env

# 2. Edit .env with your settings
# Required: OPENAI_API_KEY=your_key_here
nano .env  # or use your favorite editor

# 3. Build and start all services
docker-compose up --build

# 4. Wait for Rasa to finish loading (1-2 minutes)
# Look for: "Started server process"
```

**Check if services are running:**

```bash
# In another terminal
curl http://localhost:5000/health

# Should return:
# {"status":"ok","timestamp":"...","version":"1.0.0","rasa_url":"http://localhost:5005"}
```

### Backend Setup (Manual Method - For Development)

```bash
cd aria-backend

# 1. Create .env file
cp .env.example .env

# 2. Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download spaCy model
python -m spacy download en_core_web_sm

# Terminal 1: Start Rasa
cd rasa
rasa train  # First time only - trains NLU model
rasa run -p 5005 --enable-api --cors "*"

# Terminal 2 (in another terminal, rasa directory)
rasa run actions

# Terminal 3 (back in aria-backend directory)
deactivate  # exit rasa venv if needed
source venv/bin/activate
python app.py
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# Open browser to http://localhost:3000
```

---

## Test the System

### 1. Check Backend Health

```bash
curl http://localhost:5000/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2026-03-06T14:00:00.000000",
#   "version": "1.0.0",
#   "rasa_url": "http://localhost:5005"
# }
```

### 2. Test Chat Endpoint

```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what can you do?",
    "session_id": "test-user-1"
  }'

# Response should contain a reply from the backend
```

### 3. Test in Browser

1. Open http://localhost:3000
2. Type a message in the chat input
3. Click Send or press Enter
4. You should see a response

---

## Troubleshooting

### Issue: "Cannot connect to Rasa"

**Solution:**
```bash
# Check if Rasa is running
curl http://localhost:5005/status

# If not running, start Rasa manually:
cd aria-backend/rasa
rasa run -p 5005 --enable-api --cors "*"
```

### Issue: "OpenAI API Key Error"

**Solution:**
```bash
# 1. Check your .env file
cat aria-backend/.env | grep OPENAI

# 2. Verify the key is correct
# 3. Restart Flask:
python aria-backend/app.py
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find and kill the process
lsof -i :5000
kill -9 <PID>

# Or change port in .env
# FLASK_PORT=5001
```

### Issue: "Port 5005 already in use"

**Solution:**
```bash
# Find and kill Rasa
lsof -i :5005
kill -9 <PID>

# Or start with different port
rasa run -p 5006 --enable-api --cors "*"
```

### Issue: "npm ERR! code ENOENT"

**Solution:**
```bash
cd frontend
# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
npm run dev
```

---

## Project URLs

Once everything is running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Backend Health**: http://localhost:5000/health
- **Rasa NLU**: http://localhost:5005
- **Rasa Actions**: http://localhost:5055

---

## Common Commands

### Stop Everything

```bash
# Docker method
cd aria-backend
docker-compose down

# Manual method
# Ctrl+C in each terminal
```

### View Logs

```bash
# Docker logs
docker-compose logs -f flask

# View Flask logs
# Already visible in the running terminal
```

### Clear Session Data

```bash
# Sessions are stored in memory, they clear on app restart
# Restart Flask to clear all sessions
```

### Build Fresh

```bash
# Docker - rebuild everything
docker-compose down
docker-compose up --build

# Manual - reinstall dependencies
pip install --upgrade -r requirements.txt
```

---

## Next Steps

After everything is running:

1. **Add Documents** for RAG:
   ```bash
   # Place .txt or .pdf files in aria-backend/data/docs/
   
   # Build the index:
   curl -X POST http://localhost:5000/build-index \
     -H "X-Admin-Token: change_me_in_production"
   ```

2. **Train Rasa** with custom intents:
   ```bash
   cd aria-backend/rasa
   # Edit: nlu.yml, domain.yml, rules.yml
   rasa train
   rasa run -p 5005 --enable-api --cors "*"
   ```

3. **Customize Frontend**:
   - Edit colors in `frontend/tailwind.config.js`
   - Modify prompts in `frontend/src/App.jsx`

4. **Deploy**:
   - Frontend: Vercel, Netlify, or any static host
   - Backend: Docker container on AWS/GCP/Azure/Heroku

---

## Need Help?

Check the detailed README files:
- Backend: `aria-backend/README.md`
- Frontend: `frontend/README.md`

Or run individual components separately to debug.
