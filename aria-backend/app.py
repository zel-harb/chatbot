import requests
import logging
from typing import Dict, Any, Tuple
from datetime import datetime
from uuid import uuid4

from flask import Flask, request, jsonify
from flask_cors import CORS

from config import Config
from session_manager import SessionManager
from langchain_module import LangChainModule
import nlp_utils

# ============ APPLICATION SETUP ============

# Load and validate configuration
Config.validate()
Config.display()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = Config.FLASK_SECRET_KEY

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
def chat():
    """
    Main chat endpoint that combines Rasa NLU and LangChain.
    
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
    # Phrases that indicate Rasa is giving a generic fallback response
    FALLBACK_PHRASES = [
        "could you provide",
        "more detail",
        "I appreciate your question",
        "a bit more context",
        "could you clarify",
        "can you tell me more",
        "more information"
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
