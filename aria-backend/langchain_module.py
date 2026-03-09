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
    """
    
    def __init__(self) -> None:
        """
        Initialize the LangChain module with Google Generative AI.
        
        CRITICAL: This __init__ is called ONCE at app startup.
        The memories dictionary persists for the lifetime of the Flask app.
        """
        logger.info("Initializing LangChainModule...")
        
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            # Initialize the LLM - will be reused for all sessions
            self.llm = ChatGoogleGenerativeAI(
                model=Config.LLM_MODEL,
                google_api_key=Config.GOOGLE_API_KEY,
                temperature=float(Config.LLM_TEMPERATURE),
                convert_system_message_to_human=True  # Required for Gemini
            )
            self.llm_type = "google"
            logger.info(f"✓ Google Generative AI initialized: {Config.LLM_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Generative AI: {e}")
            self.llm = None
            self.llm_type = "text"
        
        # CRITICAL: Persistent memory storage
        # Key: session_id, Value: SimpleMemory
        # This dict lives for the entire app lifetime
        self.memories: Dict[str, SimpleMemory] = {}
        logger.info("✓ Memory storage initialized (empty)")
        
        # Initialize vectorstore for RAG
        self.vectorstore = None
        self._load_vectorstore()
        
        logger.info("✓ LangChainModule initialization complete\n")
    
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
            
            # Create streaming LLM
            streaming_llm = ChatGoogleGenerativeAI(
                model=Config.LLM_MODEL,
                google_api_key=Config.GOOGLE_API_KEY,
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
            logger.error(f"Error in stream_response: {e}", exc_info=True)
            error_msg = f"I encountered an error: {str(e)[:100]}. Please try again."
            yield error_msg
    
    def stream_response(self, question: str, session_id: str):
        """
        Stream AI response tokens while maintaining conversation memory.
        
        Uses streaming LLM to yield tokens in real-time. Memory is still
        maintained through manual save_context calls after streaming ends.
        
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
            chat_history = memory.load_memory_variables({})
            history_messages = chat_history.get("chat_history", [])
            
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
Below is the complete conversation history. You have access to EVERYTHING previously discussed.
Remember EVERYTHING the user has told you, including:
- Their name and personal information
- Previous questions and your answers
- Code they've shared
- Preferences and context from earlier messages

When answering, always refer back to the conversation history when relevant.

RESPONSE GUIDELINES:
- Provide complete, direct, helpful answers
- Use numbered steps (1. 2. 3.) for procedures
- Use bullet points (- or •) for lists  
- Format code in ```language code blocks"""
            
            if rag_context:
                system_prompt += f"\n\nRELEVANT DOCUMENTATION:\n{rag_context}"
            
            # Create streaming LLM
            streaming_llm = ChatGoogleGenerativeAI(
                model=Config.LLM_MODEL,
                google_api_key=Config.GOOGLE_API_KEY,
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
            # This ensures the user's question and bot's response are added to conversation history
            memory.save_context(
                {"input": question},
                {"output": full_response}
            )
            
            logger.info(f"✓ Stream completed for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error in stream_response: {e}", exc_info=True)
            error_msg = f"I encountered an error: {str(e)[:100]}. Please try again."
            yield error_msg
