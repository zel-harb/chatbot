import os
import logging
from typing import Dict, Any, List
from config import Config
from langchain_core.messages import HumanMessage, AIMessage

# Configure logging
logger = logging.getLogger(__name__)


class SimpleMemory:
    """Simple in-memory conversation storage."""
    
    def __init__(self, k: int = 20):
        self.k = k
        self.messages = []
    
    def load_memory_variables(self, inputs=None):
        """Get current chat history."""
        return {"chat_history": self.messages[-self.k:] if self.messages else []}
    
    def save_context(self, inputs: dict, outputs: dict):
        """Save user input and AI response to memory."""
        user_message = HumanMessage(content=inputs.get("input", ""))
        ai_message = AIMessage(content=outputs.get("output", ""))
        self.messages.append(user_message)
        self.messages.append(ai_message)
        logger.debug(f"Memory saved. Total messages: {len(self.messages)}")


class LangChainModule:
    """
    LangChain integration with persistent conversation memory.
    
    CRITICAL DESIGN:
    - Created ONCE at app startup as a global singleton
    - The self.memories dict persists for the app lifetime
    - Each session_id gets one memory object that persists across requests
    - Supports automatic API key fallback if primary key expires/fails
    """
    
    def __init__(self) -> None:
        """
        Initialize the LangChain module with Google Generative AI.
        
        CRITICAL: This __init__ is called ONCE at app startup.
        The memories dictionary persists for the lifetime of the Flask app.
        Supports automatic fallback to backup API key.
        """
        logger.info("Initializing LangChainModule...")
        
        # Store API keys for fallback
        self.api_keys = [k.strip() for k in [Config.GOOGLE_API_KEY, Config.GOOGLE_API_KEY_BACKUP] if k and k.strip()]
        self.current_key_index = 0
        
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            # Initialize the LLM with the primary API key
            self.llm = ChatGoogleGenerativeAI(
                model=Config.LLM_MODEL,
                google_api_key=self._get_current_key(),
                temperature=float(Config.LLM_TEMPERATURE),
                convert_system_message_to_human=True  # Required for Gemini
            )
            self.llm_type = "google"
            logger.info(f"✓ Google Generative AI initialized: {Config.LLM_MODEL}")
            if len(self.api_keys) > 1:
                logger.info(f"✓ Backup API key configured (fallback ready)")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Generative AI: {e}")
            self.llm = None
            self.llm_type = "text"
        
        # CRITICAL: Persistent memory storage
        # Key: session_id, Value: SimpleMemory
        # This dict lives for the entire app lifetime
        self.memories: Dict[str, SimpleMemory] = {}
        logger.info("✓ Memory storage initialized (empty)")
        
        # File context storage: session_id -> list of {filename, text}
        self.file_contexts: Dict[str, List[Dict[str, str]]] = {}
        logger.info("✓ File context storage initialized")
        
        # Initialize vectorstore for RAG
        self.vectorstore = None
        self._load_vectorstore()
        
        logger.info("✓ LangChainModule initialization complete\n")
    
    def _get_current_key(self) -> str:
        """Get the current active API key."""
        if not self.api_keys:
            return ""
        return self.api_keys[self.current_key_index]
    
    def _switch_to_backup_key(self) -> bool:
        """
        Switch to the next available API key.
        
        Returns:
            True if switched successfully, False if no more keys available.
        """
        next_index = self.current_key_index + 1
        if next_index < len(self.api_keys):
            self.current_key_index = next_index
            new_key = self._get_current_key()
            logger.warning(f"⚠ Switching to backup API key (index {next_index}): ****...{new_key[-4:]}")
            
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model=Config.LLM_MODEL,
                    google_api_key=new_key,
                    temperature=float(Config.LLM_TEMPERATURE),
                    convert_system_message_to_human=True
                )
                logger.info(f"✓ LLM re-initialized with backup API key")
                return True
            except Exception as e:
                logger.error(f"Failed to initialize with backup key: {e}")
                return False
        else:
            logger.error("✗ No more backup API keys available")
            return False
    
    def _is_key_error(self, error: Exception) -> bool:
        """Check if an error is related to an expired/invalid API key."""
        error_str = str(error).lower()
        return any(phrase in error_str for phrase in [
            "api key", "invalid", "expired", "quota", "forbidden",
            "403", "401", "429", "resource_exhausted", "permission_denied",
            "api_key_invalid", "billing"
        ])
    
    def _load_vectorstore(self) -> None:
        """Load FAISS vectorstore for RAG if it exists."""
        try:
            from langchain_community.vectorstores import FAISS
            
            faiss_path = "/data/faiss_index"
            if os.path.exists(faiss_path):
                from langchain_community.embeddings import HuggingFaceEmbeddings
                embeddings = HuggingFaceEmbeddings(model_name=Config.EMBEDDINGS_MODEL)
                self.vectorstore = FAISS.load_local(
                    faiss_path, 
                    embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info(f"✓ FAISS vectorstore loaded from {faiss_path}")
        except Exception as e:
            logger.debug(f"Vectorstore not available: {e}")
            self.vectorstore = None
    
    def get_memory(self, session_id: str) -> SimpleMemory:
        """
        Get or create conversation memory for a session.
        
        CRITICAL BEHAVIOR:
        - Returns the SAME memory object for the same session_id across all requests
        - Memory persists for the app lifetime
        
        Args:
            session_id: Unique identifier for the conversation
            
        Returns:
            SimpleMemory object (same instance for same session)
        """
        if session_id not in self.memories:
            self.memories[session_id] = SimpleMemory(k=20)
            logger.info(f"↳ Created memory for session: {session_id}")
        
        return self.memories[session_id]
    
    def set_file_context(self, session_id: str, filename: str, text: str) -> None:
        """
        Store extracted file text as context for a session.
        
        Args:
            session_id: Session identifier
            filename: Original file name
            text: Extracted text content
        """
        if session_id not in self.file_contexts:
            self.file_contexts[session_id] = []
        self.file_contexts[session_id].append({"filename": filename, "text": text})
        logger.info(f"✓ File context added for session {session_id}: {filename} ({len(text)} chars)")

    def clear_file_context(self, session_id: str) -> None:
        """Clear file context for a session."""
        if session_id in self.file_contexts:
            del self.file_contexts[session_id]
            logger.info(f"✓ File context cleared for session {session_id}")

    def _build_file_context_prompt(self, session_id: str) -> str:
        """Build file context section for the system prompt."""
        if session_id not in self.file_contexts or not self.file_contexts[session_id]:
            return ""
        
        parts = []
        for fc in self.file_contexts[session_id]:
            parts.append(f"--- FILE: {fc['filename']} ---\n{fc['text'][:10000]}")
        
        return "\n\nUPLOADED FILE CONTENT (use this as context when answering):\n" + "\n\n".join(parts)
    
    def generate_title(self, first_message: str) -> str:
        """
        Generate a 4-word conversation title from the first user message.
        
        Args:
            first_message: The first user message in the conversation
            
        Returns:
            A short 4-word title string
        """
        try:
            if not self.llm:
                return first_message[:30]
            
            from langchain_core.messages import HumanMessage
            
            prompt = f"Generate a 4-word title for a conversation starting with: {first_message}\n\nRespond with ONLY the 4-word title, nothing else. No quotes, no punctuation at the end."
            result = self.llm.invoke([HumanMessage(content=prompt)])
            title = result.content.strip().strip('"').strip("'").strip('.')
            
            # Fallback if response is too long or empty
            if not title or len(title.split()) > 8:
                return ' '.join(first_message.split()[:4])
            
            logger.info(f"✓ Generated conversation title: {title}")
            return title
            
        except Exception as e:
            if self._is_key_error(e) and self._switch_to_backup_key():
                return self.generate_title(first_message)
            logger.error(f"Title generation failed: {e}")
            return ' '.join(first_message.split()[:4])
    
    def generate_roadmap(self, technology: str, level: str = "beginner") -> List[Dict[str, Any]]:
        """
        Generate an 8-week learning roadmap for a technology.
        
        Args:
            technology: Name of the technology to learn
            level: Current skill level (beginner or intermediate)
            
        Returns:
            List of week dicts with week, title, goals, resources
        """
        try:
            if not self.llm:
                return []
            
            import json as _json
            from langchain_core.messages import HumanMessage
            
            prompt = f"""Generate an 8-week learning roadmap for someone at the {level} level who wants to learn {technology}.

Return ONLY a valid JSON array. No markdown, no code fences, no text outside the JSON.
Each element must have this exact structure:
{{
  "week": 1,
  "title": "Short week title",
  "goals": ["Goal 1", "Goal 2", "Goal 3"],
  "resources": ["Resource or link 1", "Resource or link 2"]
}}

Rules:
- Exactly 8 weeks
- 2-4 goals per week (actionable learning objectives)
- 1-3 resources per week (books, docs, tutorials, practice sites)
- Progress logically from {level} level upward
- Make it practical and project-oriented
- Return ONLY the JSON array"""
            
            result = self.llm.invoke([HumanMessage(content=prompt)])
            raw = result.content.strip()
            
            # Strip markdown code fences if present
            if raw.startswith('```'):
                raw = raw.split('\n', 1)[1] if '\n' in raw else raw[3:]
                if raw.endswith('```'):
                    raw = raw[:-3]
                raw = raw.strip()
            
            weeks = _json.loads(raw)
            
            if not isinstance(weeks, list):
                logger.error("Roadmap response is not a list")
                return []
            
            # Validate structure
            validated = []
            for w in weeks:
                if all(k in w for k in ('week', 'title', 'goals', 'resources')):
                    if isinstance(w['goals'], list) and isinstance(w['resources'], list):
                        validated.append({
                            "week": int(w['week']),
                            "title": str(w['title']),
                            "goals": [str(g) for g in w['goals']],
                            "resources": [str(r) for r in w['resources']]
                        })
            
            logger.info(f"✓ Generated roadmap: {len(validated)} weeks for '{technology}' ({level})")
            return validated
            
        except Exception as e:
            if self._is_key_error(e) and self._switch_to_backup_key():
                return self.generate_roadmap(technology, level)
            logger.error(f"Roadmap generation failed: {e}", exc_info=True)
            return []
    
    def generate_quiz(self, topic: str, num_questions: int = 5) -> List[Dict[str, Any]]:
        """
        Generate a multiple choice quiz on a given topic.
        
        Args:
            topic: The quiz topic
            num_questions: Number of questions (1-20)
            
        Returns:
            List of question dicts with question, options, correct, explanation
        """
        try:
            if not self.llm:
                return []
            
            import json as _json
            from langchain_core.messages import HumanMessage
            
            prompt = f"""Generate a quiz with exactly {num_questions} multiple choice questions about: {topic}

Return ONLY a valid JSON array. No markdown, no code fences, no explanation outside the JSON.
Each element must have this exact structure:
{{
  "question": "The question text",
  "options": ["A) answer1", "B) answer2", "C) answer3", "D) answer4"],
  "correct": "A",
  "explanation": "Brief explanation of the correct answer"
}}

Rules:
- Exactly 4 options per question labeled A, B, C, D
- "correct" field must be a single letter: A, B, C, or D
- Make questions educational and varied in difficulty
- Return ONLY the JSON array, nothing else"""
            
            result = self.llm.invoke([HumanMessage(content=prompt)])
            raw = result.content.strip()
            
            # Strip markdown code fences if present
            if raw.startswith('```'):
                raw = raw.split('\n', 1)[1] if '\n' in raw else raw[3:]
                if raw.endswith('```'):
                    raw = raw[:-3]
                raw = raw.strip()
            
            quiz = _json.loads(raw)
            
            if not isinstance(quiz, list):
                logger.error("Quiz response is not a list")
                return []
            
            # Validate structure
            validated = []
            for q in quiz:
                if all(k in q for k in ('question', 'options', 'correct', 'explanation')):
                    if isinstance(q['options'], list) and len(q['options']) == 4:
                        if q['correct'] in ('A', 'B', 'C', 'D'):
                            validated.append(q)
            
            logger.info(f"✓ Generated quiz: {len(validated)} questions on '{topic}'")
            return validated
            
        except Exception as e:
            if self._is_key_error(e) and self._switch_to_backup_key():
                return self.generate_quiz(topic, num_questions)
            logger.error(f"Quiz generation failed: {e}", exc_info=True)
            return []
    
    def get_response(self, question: str, session_id: str) -> Dict[str, Any]:
        """
        Get AI response with FULL conversation memory integration.
        
        This uses our simple memory system:
        1. Load chat_history from memory for this session
        2. Build the full prompt with history
        3. Generate response using the LLM
        4. Save response to memory
        
        Args:
            question: The user's question
            session_id: Session identifier (memory is per-session)
            
        Returns:
            Dict with 'answer', 'tokens_used', 'source'
        """
        try:
            from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
            
            if not self.llm:
                return {
                    "answer": "LLM not available. Please check configuration.",
                    "tokens_used": 0,
                    "source": "error"
                }
            
            # CRITICAL: Get the persistent memory for this session
            memory = self.get_memory(session_id)
            
            # Load current chat history from memory
            chat_data = memory.load_memory_variables()
            history_messages = chat_data.get("chat_history", [])
            
            # Build RAG context if available
            rag_context = ""
            if self.vectorstore:
                try:
                    retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                    docs = retriever.invoke(question)
                    if docs:
                        rag_context = "\n\n".join([doc.page_content for doc in docs])
                except Exception as rag_err:
                    logger.debug(f"RAG retrieval failed: {rag_err}")
            
            # Build system prompt that emphasizes memory
            system_prompt = """You are ARIA, an intelligent technical support assistant specializing in Python, Flask, Rasa, LangChain, NLP, and general programming.

CONVERSATION MEMORY - THIS IS CRITICAL:
You have access to the complete conversation history above. Remember EVERYTHING:
- User's name and personal information
- Previous questions and your answers
- Code they've shared
- Preferences mentioned earlier

When answering, use the conversation context. If they ask about something already discussed, reference it.

RESPONSE GUIDELINES:
- Provide complete, direct, helpful answers
- Use numbered steps (1. 2. 3.) for procedures
- Use bullet points (- or •) for lists  
- Format code in ```language code blocks
- Keep responses concise but comprehensive"""
            
            if rag_context:
                system_prompt += f"\n\nRELEVANT DOCUMENTATION:\n{rag_context}"
            
            # Add file context if available
            file_context = self._build_file_context_prompt(session_id)
            if file_context:
                system_prompt += file_context
            
            # Create prompt with memory placeholder
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{question}")
            ])
            
            # Create chain using LCEL (LangChain Expression Language)
            chain = prompt | self.llm
            
            # Invoke chain with history
            result = chain.invoke({
                "chat_history": history_messages,
                "question": question
            })
            
            # Extract answer text
            answer = result.content if hasattr(result, 'content') else str(result)
            answer = answer.strip()
            
            # CRITICAL: Save the exchange to memory
            # This is what makes memory persistent across requests
            memory.save_context(
                {"input": question},
                {"output": answer}
            )
            
            logger.info(f"✓ Response generated & saved to memory for session {session_id}")
            
            return {
                "answer": answer,
                "tokens_used": len(answer.split()) * 2,
                "source": "llm"
            }
            
        except Exception as e:
            # Check if error is API key related and try backup
            if self._is_key_error(e) and self._switch_to_backup_key():
                logger.info("Retrying with backup API key...")
                return self.get_response(question, session_id)
            
            logger.error(f"Error in get_response: {e}", exc_info=True)
            return {
                "answer": f"I encountered an error: {str(e)[:100]}. Please try again.",
                "tokens_used": 0,
                "source": "error"
            }
    
    def stream_response(self, question: str, session_id: str):
        """
        Stream AI response tokens while maintaining conversation memory.
        
        Uses streaming LLM to yield tokens in real-time. Memory is maintained
        through save_context calls after streaming ends.
        
        Args:
            question: The user's question
            session_id: Session identifier
            
        Yields:
            Token strings as they arrive from the LLM
        """
        try:
            from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            # Get the persistent memory for this session
            memory = self.get_memory(session_id)
            
            # Load current chat history from memory
            chat_data = memory.load_memory_variables()
            history_messages = chat_data.get("chat_history", [])
            
            # Build RAG context if available
            rag_context = ""
            if self.vectorstore:
                try:
                    retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                    docs = retriever.invoke(question)
                    if docs:
                        rag_context = "\n\n".join([doc.page_content for doc in docs])
                except Exception as rag_err:
                    logger.debug(f"RAG retrieval failed in streaming: {rag_err}")
            
            # System prompt with memory emphasis
            system_prompt = """You are ARIA, an intelligent technical support assistant specializing in Python, Flask, Rasa, LangChain, NLP, and general programming.

CONVERSATION MEMORY - THIS IS CRITICAL:
You have access to the complete conversation history above. Remember EVERYTHING:
- User's name and personal information
- Previous questions and your answers
- Code they've shared
- Preferences mentioned earlier

When answering, use the conversation context.

RESPONSE GUIDELINES:
- Provide complete, direct, helpful answers
- Use numbered steps (1. 2. 3.) for procedures
- Use bullet points (- or •) for lists  
- Format code in ```language code blocks"""
            
            if rag_context:
                system_prompt += f"\n\nRELEVANT DOCUMENTATION:\n{rag_context}"
            
            # Add file context if available
            file_context = self._build_file_context_prompt(session_id)
            if file_context:
                system_prompt += file_context
            
            # Create streaming LLM with current active API key
            streaming_llm = ChatGoogleGenerativeAI(
                model=Config.LLM_MODEL,
                google_api_key=self._get_current_key(),
                streaming=True,
                temperature=float(Config.LLM_TEMPERATURE),
                convert_system_message_to_human=True
            )
            
            # Create prompt with history placeholder
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{question}")
            ])
            
            # Create chain and stream
            chain = prompt | streaming_llm
            
            # Stream response
            full_response = ""
            for chunk in chain.stream({
                "chat_history": history_messages,
                "question": question
            }):
                token = chunk.content if hasattr(chunk, 'content') else str(chunk)
                full_response += token
                yield token
            
            # CRITICAL: Save the exchange to memory after streaming completes
            memory.save_context(
                {"input": question},
                {"output": full_response}
            )
            
            logger.info(f"✓ Stream completed for session {session_id}")
            
        except Exception as e:
            # Check if error is API key related and try backup
            if self._is_key_error(e) and self._switch_to_backup_key():
                logger.info("Retrying stream with backup API key...")
                yield from self.stream_response(question, session_id)
                return
            
            logger.error(f"Error in stream_response: {e}", exc_info=True)
            
            # Provide a clear, specific error message
            if self._is_key_error(e):
                error_msg = (
                    f"[API_KEY_ERROR] All API keys have expired or are invalid. "
                    f"Details: {str(e)[:200]}. "
                    f"Please update your GOOGLE_API_KEY in the .env file. "
                    f"Get a free key at: https://aistudio.google.com/app/apikey"
                )
            else:
                error_msg = f"I encountered an error: {str(e)[:200]}. Please try again."
            yield error_msg
