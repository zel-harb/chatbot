# ARIA Chatbot - Development Guide

## 🎯 Code Standards & Best Practices

### **Python Code Style**

#### **Type Hints (Required)**
```python
# ❌ Bad
def process_message(message):
    return message.lower()

# ✅ Good
def process_message(message: str) -> str:
    """Convert message to lowercase.
    
    Args:
        message: The input message to process.
    
    Returns:
        The processed message in lowercase.
    """
    return message.lower()
```

#### **Docstrings (Required)**
```python
# ✅ Good docstring format
def estimate_tokens(text: str) -> int:
    """
    Estimate token count using tiktoken encoding.
    
    Falls back to ~4 characters per token if tiktoken unavailable.
    
    Args:
        text: The input text to estimate.
    
    Returns:
        Estimated token count (int).
    
    Raises:
        ValueError: If text is empty.
    """
```

#### **Error Handling (Required)**
```python
# ❌ Bad - Silent failure
try:
    result = some_function()
except:
    pass

# ✅ Good - Explicit error handling
try:
    result = some_function()
except SpecificError as e:
    logger.error(f"Failed to process: {e}")
    return default_value
except Exception as e:
    logger.exception(f"Unexpected error: {e}")
    raise
```

#### **Logging (Required)**
```python
import logging

logger = logging.getLogger(__name__)

# ✅ Good logging
logger.info(f"Processing message for session: {session_id}")
logger.warning(f"Low confidence: {confidence:.2f}")
logger.error(f"API error: {error_message}")
logger.debug(f"Response tokens: {tokens}")
```

---

### **JavaScript/React Code Style**

#### **Component Structure**
```jsx
// ✅ Good component structure
import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

export function ChatContainer({ messages, isLoading }) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-container">
      {messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  )
}

ChatContainer.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool.isRequired
}
```

#### **State Management**
```jsx
// ✅ Good state organization
const [messages, setMessages] = useState([])
const [isLoading, setIsLoading] = useState(false)
const [conversations, setConversations] = useState([])

// Group related state into objects
const [ui, setUI] = useState({
  showHistory: false,
  sidebarWidth: 'w-56'
})

// Use useCallback for expensive operations
const handleSendMessage = useCallback(async (text) => {
  setIsLoading(true)
  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    // Handle response
  } finally {
    setIsLoading(false)
  }
}, [])
```

---

## 🔒 Security Guidelines

### **API Security Checklist**

- [ ] **Input Validation**
  ```python
  # ✅ Validate all incoming data
  message = data.get("message", "").strip()
  if not message or len(message) > 5000:
      return {"error": "Invalid message"}, 400
  ```

- [ ] **Rate Limiting** (TODO: Implement)
  ```python
  from flask_limiter import Limiter
  limiter = Limiter(app)
  
  @app.post("/chat")
  @limiter.limit("10/minute")
  def chat():
      pass
  ```

- [ ] **CORS Configuration**
  ```python
  # ❌ Don't use CORS("*") in production
  # ✅ Restrict to specific domains
  CORS(app, origins=["https://yourdomain.com"])
  ```

- [ ] **Authentication** (TODO: Implement)
  ```python
  from flask_jwt_extended import jwt_required
  
  @app.post("/chat")
  @jwt_required()
  def chat():
      pass
  ```

- [ ] **SQL Injection Protection** (Use ORM)
  ```python
  # ❌ Never do this
  query = f"SELECT * FROM users WHERE id = {user_id}"
  
  # ✅ Use parameterized queries/ORM
  user = User.query.filter_by(id=user_id).first()
  ```

- [ ] **Secret Management**
  ```python
  # ❌ Don't hardcode secrets
  API_KEY = "sk_..."
  
  # ✅ Load from environment
  API_KEY = os.getenv("GROQ_API_KEY")
  ```

---

## 📊 Performance Optimization

### **Backend Optimization**

#### **Caching Responses**
```python
from functools import lru_cache

# Cache Rasa model static data
@lru_cache(maxsize=128)
def get_intent_templates(intent: str) -> list:
    return query_intent_db(intent)
```

#### **Async Processing**
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

# Don't block on long operations
def slow_operation():
    time.sleep(5)

# Run in thread pool
loop.run_in_executor(executor, slow_operation)
```

#### **Database Connection Pooling** (Future)
```python
from sqlalchemy import create_engine

engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True  # Test connections before use
)
```

### **Frontend Optimization**

#### **Code Splitting**
```jsx
// ✅ Lazy load components
const ChatHistory = lazy(() => import('./components/HistorySidebar'))
const ModelConfig = lazy(() => import('./components/ModelConfig'))

<Suspense fallback={<Loading />}>
  <ChatHistory />
</Suspense>
```

#### **Memoization**
```jsx
// ✅ Prevent unnecessary re-renders
import { memo } from 'react'

const Message = memo(function Message({ text, sender }) {
  return <div className="message">{text}</div>
})
```

#### **Image Optimization**
```jsx
// ✅ Optimize images
<img 
  src="image.jpg" 
  alt="description"
  loading="lazy"
  width="200"
  height="200"
/>
```

---

## 🧪 Testing Strategy

### **Unit Tests (Python)**
```python
import pytest
from app import app
from nlp_utils import preprocess_text

@pytest.fixture
def client():
    """Create test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_preprocess_text():
    """Test text preprocessing."""
    result = preprocess_text("HELLO WORLD!")
    assert result == "hello world"

def test_chat_endpoint(client):
    """Test chat endpoint."""
    response = client.post('/chat', json={
        'message': 'Hello',
        'session_id': 'test-123'
    })
    assert response.status_code == 200
    assert 'reply' in response.json
```

### **Integration Tests (JavaScript)**
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'

describe('Chat Integration', () => {
  it('should send message and receive response', async () => {
    render(<App />)
    
    const input = screen.getByPlaceholderText(/Type a message/i)
    const button = screen.getByRole('button', { name: /Send/i })
    
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(button)
    
    // Wait for response
    await expectAsync(
      screen.findByText(/response/i)
    ).toBePending()
  })
})
```

---

## 🚀 Deployment Checklist

### **Before Deploying to Production**

- [ ] **Code Review**
  - [ ] No hardcoded secrets
  - [ ] Proper error handling
  - [ ] Type hints on functions
  - [ ] Docstrings present

- [ ] **Testing**
  - [ ] All unit tests pass (`pytest`)
  - [ ] No linting errors (`pylint`, `flake8`)
  - [ ] Type checking passes (`mypy`)
  - [ ] E2E tests complete

- [ ] **Security**
  - [ ] API authentication enabled
  - [ ] Rate limiting configured
  - [ ] CORS restricted
  - [ ] Input validation present
  - [ ] Dependencies audited

- [ ] **Performance**
  - [ ] Response time < 2s
  - [ ] Memory usage < 500MB
  - [ ] Database indexes optimized
  - [ ] Caching configured

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring (DataDog)
  - [ ] Uptime monitoring
  - [ ] Log aggregation (ELK)

- [ ] **Documentation**
  - [ ] API docs updated
  - [ ] Deployment guide written
  - [ ] Runbooks created
  - [ ] Architecture documented

---

## 📚 Code Review Guidelines

### **What to Check**

#### **Functionality**
- [ ] Does it do what it claims?
- [ ] Are edge cases handled?
- [ ] Is error handling complete?

#### **Maintainability**
- [ ] Is code readable and clear?
- [ ] Are variable names descriptive?
- [ ] Is it DRY (Don't Repeat Yourself)?
- [ ] Are functions focused and small?

#### **Performance**
- [ ] Are there N+1 queries?
- [ ] Is caching used where appropriate?
- [ ] Are loops optimized?

#### **Security**
- [ ] Is user input sanitized?
- [ ] Are secrets safe?
- [ ] Is authentication/authorization present?
- [ ] Are SQL injections prevented?

#### **Testing**
- [ ] Are tests present?
- [ ] Do tests cover happy + sad paths?
- [ ] Are tests maintainable?

---

## 🔧 Common Development Tasks

### **Add New API Endpoint**

1. Define route in `app.py`:
```python
@app.route("/api/new-endpoint", methods=["POST"])
def new_endpoint():
    """New endpoint description."""
    try:
        data = request.get_json()
        # Validate input
        if not data.get("required_field"):
            return {"error": "Missing field"}, 400
        
        # Process
        result = process_data(data)
        
        # Return response
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        logger.error(f"Error: {e}")
        return {"error": str(e)}, 500
```

2. Update frontend:
```jsx
const response = await fetch('http://localhost:5000/api/new-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

3. Test with curl:
```bash
curl -X POST http://localhost:5000/api/new-endpoint \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```

### **Add New Component**

1. Create component file:
```jsx
// frontend/src/components/NewComponent.jsx
export function NewComponent({ prop1, prop2 }) {
  return <div>{prop1}: {prop2}</div>
}
```

2. Import and use:
```jsx
import { NewComponent } from './components/NewComponent'

<NewComponent prop1="Hello" prop2="World" />
```

### **Update Dependencies**

**Python:**
```bash
# Add package
pip install new-package
pip freeze > requirements.txt

# Update Dockerfile
docker-compose build --no-cache
docker-compose up
```

**JavaScript:**
```bash
npm install new-package
npm run build
```

---

## 🐛 Debugging Tips

### **Backend Debugging**

```python
# Add debug logging
logger.debug(f"Variable state: {variable}")

# Use pdb debugger
import pdb; pdb.set_trace()

# Print for quick debugging
print(f"DEBUG: {value}", file=sys.stderr)

# Check logs
docker-compose logs -f flask
```

### **Frontend Debugging**

```javascript
// Console logging
console.log('Debug:', value)
console.error('Error:', error)
console.warn('Warning:', warning)

// Debugger breakpoint
debugger;

// View network requests
// F12 → Network tab

// Check localStorage
localStorage.getItem('chatbot_conversations')
```

---

## 📈 Monitoring & Logging

### **Log Levels**

```python
logger.debug("Detailed information for debugging")
logger.info("General information about execution")
logger.warning("Warning messages for potential issues")
logger.error("Error occurred but application continues")
logger.critical("Critical error, application may stop")
```

### **Key Metrics to Track**

- Response time (p50, p95, p99)
- Error rate by endpoint
- Number of active sessions
- Token usage
- Cache hit rate
- Database query time

---

## 🎓 Team Guidelines

### **Commit Message Format**
```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
```
feat(chat): Add streaming responses
fix(backend): Handle empty messages
docs: Update API documentation
refactor(nlp): Split utilities into modules
test: Add unit tests for session manager
```

### **Branch Naming**
```
feature/add-voice-input
bugfix/fix-session-timeout
docs/update-readme
refactor/optimize-performance
```

---

**Last Updated**: March 7, 2026  
**Status**: MVP Development Guide  
**Next Review**: Phase 2 Planning
