import requests
import logging
import json
from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
from uuid import uuid4

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

from config import Config
from models import db, User, Roadmap, QuizResult
from session_manager import SessionManager
from langchain_module import LangChainModule
import nlp_utils

# ============ APPLICATION SETUP ============

# Load and validate configuration
Config.validate()
Config.display()

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize Database
db.init_app(app)

# Initialize JWT
jwt = JWTManager(app)

# Enable CORS for all origins
CORS(app, origins="*")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize global singletons
session_manager = SessionManager()
langchain_module = LangChainModule()

# Create database tables
with app.app_context():
    db.create_all()
    logger.info("✓ Database initialized successfully")

logger.info("Flask application initialized successfully")
logger.info(f"Rasa URL: {Config.RASA_URL}")
logger.info(f"LLM Model: {Config.LLM_MODEL}")

# ============ UTILITY FUNCTIONS ============


def call_rasa(message: str, sender_id: str) -> Dict[str, Any]:
    """
    Call Rasa NLU server for intent extraction and bot response.
    
    Makes two requests to Rasa NLU:
    1. POST to /webhooks/rest/webhook for animated bot response
    2. POST to /model/parse for intent classification and confidence
    
    Includes optional Bearer token authentication if RASA_TOKEN is configured.
    All requests have a 5-second timeout to prevent hanging.
    
    Args:
        message: User message text to process and classify.
        sender_id: Unique identifier for the conversation session.
    
    Returns:
        Dict containing:
        {
            'reply': str or None - Bot response text (None if request failed),
            'intent': str - Detected intent name (e.g., 'faq_flask', 'greet'),
            'confidence': float - Intent confidence score (0.0-1.0),
            'source': str - 'rasa' on success, 'rasa_failed' on error
        }
    
    On any exception or timeout, returns safe error response with None reply
    and unknown intent set to 0.0 confidence.
    """
    try:
        # Validate inputs
        if not message or not isinstance(message, str):
            logger.warning("Invalid message input to call_rasa")
            return {
                "reply": None,
                "intent": "unknown",
                "confidence": 0.0,
                "source": "rasa_failed"
            }
        
        # Load configuration
        config = Config
        rasa_url = config.RASA_URL.rstrip('/')
        timeout = 5  # seconds
        
        # Prepare headers with optional Bearer token authentication
        headers = {"Content-Type": "application/json"}
        if config.RASA_TOKEN:
            headers["Authorization"] = f"Bearer {config.RASA_TOKEN}"
            logger.debug("Using Bearer token authentication for Rasa")
        
        # ============ STEP 1: Get bot response from webhook ============
        webhook_url = f"{rasa_url}/webhooks/rest/webhook"
        webhook_payload = {
            "sender": sender_id,
            "message": message
        }
        
        logger.debug(f"Calling Rasa webhook: {webhook_url}")
        webhook_response = requests.post(
            webhook_url,
            json=webhook_payload,
            headers=headers,
            timeout=timeout
        )
        webhook_response.raise_for_status()
        
        # Extract reply from webhook response
        reply = None
        webhook_data = webhook_response.json()
        
        if webhook_data and isinstance(webhook_data, list) and len(webhook_data) > 0:
            # Iterate through responses to find first text message
            for response in webhook_data:
                if isinstance(response, dict) and "text" in response:
                    reply = response["text"]
                    logger.debug(f"Extracted reply from webhook: {reply[:50]}...")
                    break
        
        if not reply:
            logger.warning("No text reply found in Rasa webhook response")
            reply = None
        
        # ============ STEP 2: Get intent and confidence from parser ============
        parse_url = f"{rasa_url}/model/parse"
        parse_payload = {"text": message}
        
        logger.debug(f"Calling Rasa parser: {parse_url}")
        parse_response = requests.post(
            parse_url,
            json=parse_payload,
            headers=headers,
            timeout=timeout
        )
        parse_response.raise_for_status()
        
        # Extract intent and confidence from parser response
        parse_data = parse_response.json()
        intent = "unknown"
        confidence = 0.0
        
        if parse_data and "intent" in parse_data:
            intent_obj = parse_data["intent"]
            if isinstance(intent_obj, dict):
                intent = intent_obj.get("name", "unknown")
                confidence = float(intent_obj.get("confidence", 0.0))
                logger.info(f"Rasa parsing - Intent: {intent}, Confidence: {confidence:.3f}")
        
        return {
            "reply": reply,
            "intent": intent,
            "confidence": confidence,
            "source": "rasa"
        }
    
    except requests.exceptions.Timeout:
        logger.error(f"Rasa request timed out (>5s)")
        return {
            "reply": None,
            "intent": "unknown",
            "confidence": 0.0,
            "source": "rasa_failed"
        }
    
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Failed to connect to Rasa at {Config.RASA_URL}: {e}")
        return {
            "reply": None,
            "intent": "unknown",
            "confidence": 0.0,
            "source": "rasa_failed"
        }
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Rasa request failed: {e}")
        return {
            "reply": None,
            "intent": "unknown",
            "confidence": 0.0,
            "source": "rasa_failed"
        }
    
    except Exception as e:
        logger.error(f"Unexpected error in call_rasa: {e}", exc_info=True)
        return {
            "reply": None,
            "intent": "unknown",
            "confidence": 0.0,
            "source": "rasa_failed"
        }


def check_admin_token() -> Tuple[bool, str]:
    """
    Validate admin authentication via X-Admin-Token header.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    token = request.headers.get("X-Admin-Token", "")
    if token != Config.FLASK_SECRET_KEY:
        logger.warning("Invalid admin token attempt")
        return False, "Invalid admin token"
    return True, ""


# ============ AUTHENTICATION ROUTES ============

@app.route("/register", methods=["POST"])
def register():
    """
    Register a new user account.
    
    Request body:
    {
        "username": str (required, 3-80 chars),
        "email": str (required, valid email),
        "password": str (required, 8+ chars)
    }
    
    Response:
    {
        "message": str,
        "user": {user object},
        "access_token": str
    }
    """
    try:
        logger.info("POST /register")
        
        # Validate input
        data = request.get_json() or {}
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")
        
        # Validation checks
        if not username or len(username) < 3 or len(username) > 80:
            logger.warning(f"Invalid username length: {len(username)}")
            return jsonify({"error": "Username must be 3-80 characters"}), 400
        
        if not email or "@" not in email:
            logger.warning(f"Invalid email format: {email}")
            return jsonify({"error": "Valid email is required"}), 400
        
        if not password or len(password) < 8:
            logger.warning("Password too short")
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        
        # Check if user already exists
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            logger.warning(f"User already exists: {username}")
            return jsonify({"error": "Username or email already registered"}), 409
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Generate JWT token
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=Config.JWT_ACCESS_TOKEN_EXPIRES
        )
        
        logger.info(f"✓ User registered successfully: {username}")
        
        return jsonify({
            "message": "User registered successfully",
            "user": user.to_dict(),
            "access_token": access_token
        }), 201
    
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/login", methods=["POST"])
def login():
    """
    Authenticate user and issue JWT token.
    
    Request body:
    {
        "username": str (required),
        "password": str (required)
    }
    
    Response:
    {
        "message": str,
        "user": {user object},
        "access_token": str
    }
    """
    try:
        logger.info("POST /login")
        
        # Validate input
        data = request.get_json() or {}
        username = data.get("username", "").strip()
        password = data.get("password", "")
        
        if not username or not password:
            logger.warning("Missing username or password in login attempt")
            return jsonify({"error": "Username and password are required"}), 400
        
        # Find user
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            logger.warning(f"Failed login attempt for user: {username}")
            return jsonify({"error": "Invalid username or password"}), 401
        
        # Generate JWT token
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=Config.JWT_ACCESS_TOKEN_EXPIRES
        )
        
        logger.info(f"✓ User logged in successfully: {username}")
        
        return jsonify({
            "message": "Login successful",
            "user": user.to_dict(),
            "access_token": access_token
        }), 200
    
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ============ ROUTES ============

@app.route("/health", methods=["GET"])
def health():
    """
    Health check endpoint.
    
    Returns application status and configuration information.
    """
    try:
        logger.info("GET /health")
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "rasa_url": Config.RASA_URL
        }), 200
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    """
    Main chat endpoint that combines Rasa NLU and LangChain.
    
    Requires JWT authentication token in Authorization header.
    
    Input:
        {
            "message": str (required),
            "session_id": str (optional)
        }
    
    Output:
        {
            "reply": str,
            "intent": str,
            "confidence": float,
            "source": str,
            "session_id": str,
            "language": str,
            "tokens": int
        }
    """
    # Get authenticated user ID from JWT token
    user_id = get_jwt_identity()
    
    # Phrases that indicate Rasa is giving a generic fallback response
    # If Rasa response contains ANY of these phrases, force LangChain instead
    FALLBACK_PHRASES = [
        "could you provide",
        "more detail",
        "I appreciate your question",
        "a bit more context",
        "could you clarify",
        "can you tell me more",
        "more information",
        "provide more context",
        "help me understand",
        "I understand you're asking",
        "specific part",
        "specific aspect",
        "what would be helpful",
        "best answer",
        "Provide a comprehensive",
        "That's great"
    ]
    
    try:
        logger.info("POST /chat")
        
        # Validate input
        data = request.get_json() or {}
        message = data.get("message", "").strip()
        session_id = data.get("session_id")
        
        if not message:
            logger.warning("Empty message in /chat request")
            return jsonify({"error": "Message is required and cannot be empty"}), 400
        
        # Generate session_id if not provided
        if not session_id:
            session_id = str(uuid4())
            logger.info(f"Generated new session_id: {session_id}")
        
        # Preprocess message
        processed_message = nlp_utils.preprocess_text(message)
        
        # Auto-context: If message is very short, use previous message for context
        message_words = processed_message.split()
        if len(message_words) < 3:
            history = session_manager.get_history(session_id)
            if len(history) >= 2:
                # Get the last user message (should be at -2 if last is bot response)
                for msg in reversed(history[:-1]):  # Skip the last message, look at previous
                    if msg.get('role') == 'user':
                        last_user_msg = msg.get('content', '')
                        if last_user_msg:
                            processed_message = f"{last_user_msg} - specifically about: {processed_message}"
                            logger.info(f"Auto-context enabled. Enhanced message: '{processed_message[:80]}...'")
                        break
        
        # Detect language
        language = nlp_utils.detect_language(message)
        
        # Estimate tokens
        tokens = nlp_utils.estimate_tokens(message)
        
        logger.info(f"Processing message (session: {session_id}, lang: {language}, tokens: {tokens})")
        
        # Call Rasa
        rasa_result = call_rasa(processed_message, session_id)
        logger.info(f"Rasa result: intent={rasa_result['intent']}, confidence={rasa_result['confidence']:.3f}")
        
        # Decide on response source
        reply = rasa_result["reply"]
        intent = rasa_result["intent"]
        confidence = rasa_result["confidence"]
        source = "rasa"
        
        # Check if Rasa returned a generic fallback response
        rasa_reply_lower = (reply or "").lower()
        has_fallback_phrase = any(phrase in rasa_reply_lower for phrase in FALLBACK_PHRASES)
        
        # Use LangChain if:
        # 1. Rasa confidence is below threshold, OR
        # 2. Rasa returned a generic fallback phrase, OR
        # 3. Rasa failed completely
        should_use_langchain = (
            confidence < Config.CONFIDENCE_THRESHOLD
            or has_fallback_phrase
            or rasa_result['source'] == 'rasa_failed'
        )
        
        if should_use_langchain:
            if has_fallback_phrase:
                logger.info(f"Rasa returned generic fallback phrase, forcing LangChain: '{reply}'")
            else:
                logger.info(f"Using LangChain (confidence={confidence:.3f}, threshold={Config.CONFIDENCE_THRESHOLD})")
            
            langchain_result = langchain_module.get_response(processed_message, session_id)
            reply = langchain_result["answer"]
            source = langchain_result["source"]
            tokens += langchain_result["tokens_used"]
            logger.info(f"LangChain response: {reply[:100]}...")
        
        # Boost confidence based on keyword matching
        confidence = nlp_utils.boost_confidence(message, intent, confidence)
        
        # Add message to session history
        session_manager.add_message(
            session_id=session_id,
            role="user",
            content=message,
            intent=intent,
            confidence=confidence
        )
        
        session_manager.add_message(
            session_id=session_id,
            role="assistant",
            content=reply,
            intent=intent,
            confidence=confidence
        )
        
        # Track token usage
        session_manager.increment_tokens(session_id, tokens)
        
        logger.info(f"Chat response generated - Source: {source}, Tokens: {tokens}")
        
        return jsonify({
            "reply": reply,
            "intent": intent,
            "confidence": round(confidence, 3),
            "source": source,
            "session_id": session_id,
            "language": language,
            "tokens": tokens
        }), 200
    
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/chat/stream", methods=["POST"])
@jwt_required()
def chat_stream():
    """
    Streaming chat endpoint using Server-Sent Events (SSE).
    
    Requires JWT authentication token in Authorization header.
    
    Streams response tokens in real-time as they are generated by the LLM.
    Uses EventStream format compatible with browser EventSource API.
    
    Request body:
    {
        "message": str - The user's message (required),
        "session_id": str - Optional session identifier
    }
    
    Response:
    Server-Sent Events stream where each event is:
    data: {token}
    
    Final event: data: [DONE]
    """
    # Get authenticated user ID from JWT token
    user_id = get_jwt_identity()
    
    # CRITICAL FIX: Extract request data BEFORE yielding
    # This prevents Flask context loss in the generator
    try:
        data = request.get_json() or {}
        message = data.get("message", "").strip()
        session_id = data.get("session_id")
        
        if not message:
            def generate():
                yield f"data: {json.dumps({'error': 'Message is required'})}\n\n"
                yield "data: [DONE]\n\n"
            return Response(generate(), mimetype="text/event-stream")
        
        # Generate session_id if not provided
        if not session_id:
            session_id = str(uuid4())
            logger.info(f"Generated new session_id for streaming: {session_id}")
    except Exception as e:
        logger.error(f"Stream request parsing error: {e}")
        def generate():
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
        return Response(generate(), mimetype="text/event-stream")
    
    def generate():
        try:
            
            # Preprocess message
            processed_message = nlp_utils.preprocess_text(message)
            
            # Auto-context: If message is very short, use previous message for context
            message_words = processed_message.split()
            if len(message_words) < 3:
                history = session_manager.get_history(session_id)
                if len(history) >= 2:
                    for msg in reversed(history[:-1]):
                        if msg.get('role') == 'user':
                            last_user_msg = msg.get('content', '')
                            if last_user_msg:
                                processed_message = f"{last_user_msg} - specifically about: {processed_message}"
                            break
            
            logger.info(f"Streaming chat for session: {session_id}")
            
            # Add user message to history
            session_manager.add_message(
                session_id=session_id,
                role="user",
                content=message
            )
            
            # Generate title if this is the first user message in the session
            history = session_manager.get_history(session_id)
            user_messages = [m for m in history if m.get('role') == 'user']
            if len(user_messages) == 1:
                try:
                    title = langchain_module.generate_title(message)
                    yield f"data: {json.dumps({'title': title})}\n\n"
                except Exception as title_err:
                    logger.warning(f"Title generation failed: {title_err}")
            
            # Stream tokens from LangChain
            full_response = ""
            tokens_used = nlp_utils.estimate_tokens(processed_message)
            
            for token in langchain_module.stream_response(processed_message, session_id):
                full_response += token
                # Send token as SSE data
                yield f"data: {json.dumps({'token': token})}\n\n"
            
            # Calculate total tokens
            tokens_used += nlp_utils.estimate_tokens(full_response)
            
            # Add full response to history
            session_manager.add_message(
                session_id=session_id,
                role="assistant",
                content=full_response
            )
            
            # Track tokens
            session_manager.increment_tokens(session_id, tokens_used)
            
            logger.info(f"Stream completed - Tokens: {tokens_used}")
            
            # Send completion signal
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            error_str = str(e).lower()
            # Classify the error for the frontend
            api_key_phrases = ["api key", "invalid", "expired", "quota", "forbidden", "403", "401", "429", "resource_exhausted", "permission_denied", "billing"]
            is_api_key_error = any(p in error_str for p in api_key_phrases)
            error_payload = {
                'error': str(e),
                'error_type': 'api_key' if is_api_key_error else 'general'
            }
            yield f"data: {json.dumps(error_payload)}\n\n"
            yield "data: [DONE]\n\n"
    
    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream"
        }
    )


@app.route("/langchain", methods=["POST"])
def langchain_direct():
    """
    Direct LangChain endpoint, bypassing Rasa.
    
    Same input/output as /chat but always uses LangChain.
    """
    try:
        logger.info("POST /langchain")
        
        # Validate input
        data = request.get_json() or {}
        message = data.get("message", "").strip()
        session_id = data.get("session_id")
        
        if not message:
            logger.warning("Empty message in /langchain request")
            return jsonify({"error": "Message is required and cannot be empty"}), 400
        
        # Generate session_id if not provided
        if not session_id:
            session_id = str(uuid4())
            logger.info(f"Generated new session_id: {session_id}")
        
        # Preprocess message
        processed_message = nlp_utils.preprocess_text(message)
        
        # Detect language
        language = nlp_utils.detect_language(message)
        
        # Estimate tokens
        tokens = nlp_utils.estimate_tokens(message)
        
        logger.info(f"LangChain request (session: {session_id}, lang: {language})")
        
        # Call LangChain directly
        langchain_result = langchain_module.get_response(processed_message, session_id)
        
        reply = langchain_result["answer"]
        source = langchain_result["source"]
        tokens += langchain_result["tokens_used"]
        
        # For LangChain, intent is empty
        intent = ""
        confidence = 1.0 if source == "langchain" else 0.0
        
        # Add message to session history
        session_manager.add_message(
            session_id=session_id,
            role="user",
            content=message,
            intent=intent,
            confidence=confidence
        )
        
        session_manager.add_message(
            session_id=session_id,
            role="assistant",
            content=reply,
            intent=intent,
            confidence=confidence
        )
        
        # Track token usage
        session_manager.increment_tokens(session_id, tokens)
        
        logger.info(f"LangChain response generated - Source: {source}, Tokens: {tokens}")
        
        return jsonify({
            "reply": reply,
            "intent": intent,
            "confidence": round(confidence, 3),
            "source": source,
            "session_id": session_id,
            "language": language,
            "tokens": tokens
        }), 200
    
    except Exception as e:
        logger.error(f"LangChain error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/build-index", methods=["POST"])
def build_index():
    """
    Build FAISS vectorstore from documents.
    
    Protected by X-Admin-Token header matching FLASK_SECRET_KEY.
    """
    try:
        logger.info("POST /build-index")
        
        # Check admin token
        is_valid, error_msg = check_admin_token()
        if not is_valid:
            return jsonify({"error": error_msg}), 401
        
        logger.info("Building vectorstore from documents...")
        langchain_module.build_vectorstore()
        
        logger.info("Index built successfully")
        return jsonify({
            "status": "ok",
            "message": "Index built successfully"
        }), 200
    
    except Exception as e:
        logger.error(f"Build index error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/session/<session_id>", methods=["GET"])
def get_session(session_id: str):
    """
    Get session statistics.
    
    Returns:
        {
            "message_count": int,
            "token_count": int,
            "top_intent": str,
            "top_intent_confidence": float,
            "session_duration": str,
            "total_intents_detected": int
        }
    """
    try:
        logger.info(f"GET /session/{session_id}")
        
        stats = session_manager.get_stats(session_id)
        
        # Format session_duration for JSON serialization
        stats["session_duration"] = str(stats["session_duration"])
        
        logger.info(f"Session stats retrieved: {session_id}")
        return jsonify(stats), 200
    
    except Exception as e:
        logger.error(f"Get session error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/session/<session_id>", methods=["DELETE"])
def delete_session(session_id: str):
    """
    Delete a session and all its data.
    
    Returns:
        { "status": "deleted" }
    """
    try:
        logger.info(f"DELETE /session/{session_id}")
        
        session_manager.delete_session(session_id)
        
        logger.info(f"Session deleted: {session_id}")
        return jsonify({"status": "deleted"}), 200
    
    except Exception as e:
        logger.error(f"Delete session error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ============ FILE CONTEXT CLEAR ============

@app.route("/session/<session_id>/file", methods=["DELETE"])
def clear_file_context(session_id: str):
    """Remove uploaded file context from a session."""
    try:
        logger.info(f"DELETE /session/{session_id}/file")
        langchain_module.clear_file_context(session_id)
        return jsonify({"status": "ok", "message": "File context cleared"}), 200
    except Exception as e:
        logger.error(f"Clear file context error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ============ FILE UPLOAD ============

ALLOWED_EXTENSIONS = {'pdf', 'txt'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    """
    Upload a PDF or TXT file (max 5MB).
    Extracts text and stores it as context for the session's LangChain conversation.
    
    Expects multipart/form-data with:
        - file: The uploaded file
        - session_id (optional): Conversation session ID
    
    Returns:
        { "filename": str, "text_length": int, "message": str }
    """
    try:
        current_user = get_jwt_identity()
        logger.info(f"POST /upload from user: {current_user}")

        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Only PDF and TXT files are allowed"}), 400

        # Check file size
        file.seek(0, 2)  # seek to end
        size = file.tell()
        file.seek(0)     # seek back to start
        if size > MAX_FILE_SIZE:
            return jsonify({"error": f"File too large. Max size is 5MB, got {size / (1024*1024):.1f}MB"}), 400

        session_id = request.form.get('session_id', 'default')
        filename = file.filename
        ext = filename.rsplit('.', 1)[1].lower()

        # Extract text
        extracted_text = ""
        if ext == 'pdf':
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(file)
                pages = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        pages.append(page_text)
                extracted_text = "\n".join(pages)
            except Exception as pdf_err:
                logger.error(f"PDF extraction error: {pdf_err}")
                return jsonify({"error": f"Failed to extract text from PDF: {str(pdf_err)[:100]}"}), 400
        elif ext == 'txt':
            extracted_text = file.read().decode('utf-8', errors='replace')

        if not extracted_text.strip():
            return jsonify({"error": "No text could be extracted from the file"}), 400

        # Store file context in LangChain module
        langchain_module.set_file_context(session_id, filename, extracted_text)

        logger.info(f"✓ File uploaded: {filename} ({len(extracted_text)} chars) for session {session_id}")
        return jsonify({
            "filename": filename,
            "text_length": len(extracted_text),
            "message": f"File '{filename}' uploaded successfully. You can now ask questions about it."
        }), 200

    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ============ QUIZ ============

@app.route("/quiz", methods=["POST"])
@jwt_required()
def generate_quiz():
    """
    Generate a multiple choice quiz using LangChain / Gemini.
    
    Request body:
    {
        "topic": str (required),
        "num_questions": int (optional, default 5, max 20)
    }
    
    Response:
    {
        "topic": str,
        "questions": [ { question, options, correct, explanation } ]
    }
    """
    try:
        current_user = get_jwt_identity()
        logger.info(f"POST /quiz from user: {current_user}")
        
        data = request.get_json() or {}
        topic = data.get("topic", "").strip()
        num_questions = data.get("num_questions", 5)
        
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        
        try:
            num_questions = int(num_questions)
            num_questions = max(1, min(num_questions, 20))
        except (TypeError, ValueError):
            num_questions = 5
        
        questions = langchain_module.generate_quiz(topic, num_questions)
        
        if not questions:
            return jsonify({"error": "Failed to generate quiz. Please try again."}), 500
        
        logger.info(f"✓ Quiz generated: {len(questions)} questions on '{topic}'")
        return jsonify({
            "topic": topic,
            "questions": questions
        }), 200
    
    except Exception as e:
        logger.error(f"Quiz error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ============ ROADMAP ============

@app.route("/roadmap", methods=["POST"])
@jwt_required()
def generate_roadmap():
    """
    Generate an 8-week learning roadmap using LangChain / Gemini.
    
    Request body:
    {
        "technology": str (required),
        "level": str (beginner | intermediate)
    }
    
    Response:
    {
        "technology": str,
        "level": str,
        "weeks": [ { week, title, goals: [str], resources: [str] } ]
    }
    """
    try:
        current_user = get_jwt_identity()
        logger.info(f"POST /roadmap from user: {current_user}")
        
        data = request.get_json() or {}
        technology = data.get("technology", "").strip()
        level = data.get("level", "beginner").strip().lower()
        
        if not technology:
            return jsonify({"error": "Technology name is required"}), 400
        
        if level not in ("beginner", "intermediate"):
            level = "beginner"
        
        weeks = langchain_module.generate_roadmap(technology, level)
        
        if not weeks:
            return jsonify({"error": "Failed to generate roadmap. Please try again."}), 500
        
        logger.info(f"\u2713 Roadmap generated: {len(weeks)} weeks for '{technology}' ({level})")
        return jsonify({
            "technology": technology,
            "level": level,
            "weeks": weeks
        }), 200
    
    except Exception as e:
        logger.error(f"Roadmap error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ============ ROADMAP PERSISTENCE ============

@app.route("/roadmap/save", methods=["POST"])
@jwt_required()
def save_roadmap():
    """Save or update roadmap progress for the current user."""
    user_id = get_jwt_identity()
    data = request.get_json()
    roadmap_id = data.get("roadmap_id")
    if not roadmap_id:
        return jsonify({"error": "roadmap_id is required"}), 400

    existing = Roadmap.query.filter_by(user_id=user_id, roadmap_id=roadmap_id).first()
    if existing:
        existing.roadmap_data = json.dumps(data.get("roadmap_data", {}))
        existing.completed_items = json.dumps(data.get("completed_items", []))
        existing.updated_at = datetime.utcnow()
    else:
        existing = Roadmap(
            user_id=user_id,
            roadmap_id=roadmap_id,
            roadmap_data=json.dumps(data.get("roadmap_data", {})),
            completed_items=json.dumps(data.get("completed_items", [])),
            updated_at=datetime.utcnow()
        )
        db.session.add(existing)

    db.session.commit()
    return jsonify({"status": "saved", "roadmap_id": roadmap_id})


@app.route("/roadmap/list", methods=["GET"])
@jwt_required()
def get_roadmaps():
    """Get all saved roadmaps for the current user."""
    user_id = get_jwt_identity()
    roadmaps = Roadmap.query.filter_by(user_id=user_id).order_by(Roadmap.updated_at.desc()).all()
    return jsonify([r.to_dict() for r in roadmaps])


@app.route("/roadmap/delete/<roadmap_id>", methods=["DELETE"])
@jwt_required()
def delete_roadmap(roadmap_id):
    """Delete a saved roadmap."""
    user_id = get_jwt_identity()
    r = Roadmap.query.filter_by(user_id=user_id, roadmap_id=roadmap_id).first()
    if r:
        db.session.delete(r)
        db.session.commit()
    return jsonify({"status": "deleted"})


# ============ QUIZ PERSISTENCE ============

@app.route("/quiz/save", methods=["POST"])
@jwt_required()
def save_quiz():
    """Save a quiz result for the current user."""
    user_id = get_jwt_identity()
    data = request.get_json()
    result = QuizResult(
        user_id=user_id,
        topic=data.get("topic", ""),
        score=data.get("score", 0),
        total=data.get("total", 0),
        percentage=data.get("percentage", 0),
        questions_data=json.dumps(data.get("questions", [])),
        taken_at=datetime.utcnow()
    )
    db.session.add(result)
    db.session.commit()
    return jsonify({"status": "saved", "id": result.id})


@app.route("/quiz/history", methods=["GET"])
@jwt_required()
def get_quiz_history():
    """Get quiz history for the current user (last 20)."""
    user_id = get_jwt_identity()
    history = QuizResult.query.filter_by(user_id=user_id).order_by(QuizResult.taken_at.desc()).limit(20).all()
    return jsonify([h.to_dict() for h in history])


# ============ ERROR HANDLERS ============

@app.errorhandler(404)
def not_found(error):
    """Handle 404 Not Found errors."""
    logger.warning(f"404 Not Found: {request.path}")
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 Method Not Allowed errors."""
    logger.warning(f"405 Method Not Allowed: {request.method} {request.path}")
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 Internal Server errors."""
    logger.error(f"500 Internal Server Error: {error}")
    return jsonify({"error": "Internal server error"}), 500


# ============ MAIN ============

if __name__ == "__main__":
    port = int(Config.FLASK_PORT)
    debug = Config.FLASK_ENV == "development"
    logger.info(f"Starting ARIA backend on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
