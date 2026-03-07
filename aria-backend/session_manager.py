from datetime import datetime
from typing import Dict, List, Optional, Any
from collections import Counter


class SessionManager:
    """
    In-memory session management for chat conversations.
    
    Manages multiple chat sessions in memory, storing conversation history,
    intents, and token usage for each session. Sessions are stored in a
    Python dictionary and are not persisted to a database.
    """
    
    def __init__(self) -> None:
        """Initialize the session manager with an empty sessions dictionary."""
        self.sessions: Dict[str, Dict[str, Any]] = {}
    
    def create_session(self, session_id: str) -> Dict[str, Any]:
        """
        Create a new chat session with the given ID.
        
        Args:
            session_id: Unique identifier for the session.
        
        Returns:
            Dict containing the new session data with structure:
            {
                'id': str,
                'created_at': datetime,
                'messages': list,
                'intent_history': list,
                'token_count': int
            }
        """
        session = {
            'id': session_id,
            'created_at': datetime.now(),
            'messages': [],
            'intent_history': [],
            'token_count': 0
        }
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Dict[str, Any]:
        """
        Get an existing session or create one if it doesn't exist.
        
        Args:
            session_id: Unique identifier for the session.
        
        Returns:
            Dict containing the session data. Creates a new session
            automatically if the session_id doesn't exist.
        """
        if session_id not in self.sessions:
            return self.create_session(session_id)
        return self.sessions[session_id]
    
    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        intent: str = "",
        confidence: float = 0.0
    ) -> None:
        """
        Add a message to a session's conversation history.
        
        Args:
            session_id: Unique identifier for the session.
            role: Role of the message sender ('user' or 'assistant').
            content: The message text content.
            intent: Detected intent from NLU (optional, default "").
            confidence: Confidence score of the intent (0.0-1.0, default 0.0).
        
        Creates a new session if session_id doesn't exist. Each message
        includes a timestamp and intent metadata.
        """
        session = self.get_session(session_id)
        
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.now(),
            'intent': intent,
            'confidence': confidence
        }
        
        session['messages'].append(message)
        
        # Track intent history if intent is provided
        if intent:
            session['intent_history'].append({
                'intent': intent,
                'confidence': confidence,
                'timestamp': datetime.now()
            })
    
    def get_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get the conversation history for a session.
        
        Args:
            session_id: Unique identifier for the session.
            limit: Maximum number of recent messages to return (default: 10).
        
        Returns:
            List of the most recent messages (up to 'limit' messages).
            Returns an empty list if session doesn't exist or has no messages.
        """
        session = self.get_session(session_id)
        messages = session['messages']
        
        # Return the last 'limit' messages
        return messages[-limit:] if messages else []
    
    def increment_tokens(self, session_id: str, count: int) -> None:
        """
        Increment the token count for a session.
        
        Args:
            session_id: Unique identifier for the session.
            count: Number of tokens to add to the session's token count.
        
        Creates a new session if session_id doesn't exist.
        Used to track API usage and token consumption across conversations.
        """
        session = self.get_session(session_id)
        session['token_count'] += count
    
    def delete_session(self, session_id: str) -> None:
        """
        Delete a session and all its associated data.
        
        Args:
            session_id: Unique identifier for the session to delete.
        
        Safely removes the session from memory. Does nothing if
        the session_id doesn't exist.
        """
        if session_id in self.sessions:
            del self.sessions[session_id]
    
    def get_stats(self, session_id: str) -> Dict[str, Any]:
        """
        Get statistics about a session.
        
        Args:
            session_id: Unique identifier for the session.
        
        Returns:
            Dict containing:
            {
                'message_count': int,
                'token_count': int,
                'top_intent': str or None,
                'top_intent_confidence': float,
                'session_duration': timedelta,
                'total_intents_detected': int
            }
        
        Creates a new session if session_id doesn't exist.
        """
        session = self.get_session(session_id)
        
        # Calculate message count
        message_count = len(session['messages'])
        
        # Get top intent from intent history
        top_intent = None
        top_intent_confidence = 0.0
        
        if session['intent_history']:
            # Count intent occurrences
            intent_counts = Counter(
                item['intent'] for item in session['intent_history']
            )
            top_intent = intent_counts.most_common(1)[0][0]
            
            # Find average confidence for top intent
            top_intent_records = [
                item for item in session['intent_history']
                if item['intent'] == top_intent
            ]
            if top_intent_records:
                top_intent_confidence = sum(
                    item['confidence'] for item in top_intent_records
                ) / len(top_intent_records)
        
        # Calculate session duration
        session_duration = datetime.now() - session['created_at']
        
        return {
            'message_count': message_count,
            'token_count': session['token_count'],
            'top_intent': top_intent,
            'top_intent_confidence': round(top_intent_confidence, 3),
            'session_duration': session_duration,
            'total_intents_detected': len(session['intent_history'])
        }
