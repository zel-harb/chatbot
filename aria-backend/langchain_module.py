import os
import logging
from pathlib import Path
from typing import Dict, Optional, Any
from config import Config

# Configure logging
logger = logging.getLogger(__name__)


class LangChainModule:
    """
    LangChain integration module for conversational AI with RAG.
    
    Handles initialization of language models, embeddings, vector stores,
    and conversation memory. Supports both RAG-based responses (when docs
    are available) and standalone LLM responses as fallback.
    """
    
    def __init__(self) -> None:
        """
        Initialize the LangChain module with all necessary components.
        
        Sets up:
        - Claude API (Anthropic) as primary LLM fallback
        - Google Generative AI (if API key works)
        - HuggingFace embeddings model
        - FAISS vectorstore (if available)
        - Conversation memory storage
        
        Logs warnings if models or documents are not found.
        """
        logger.info("Initializing LangChainModule...")
        
        # Load configuration
        self.config = Config
        
        # Try Google Generative AI first, with fallback to text generation
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.config.GOOGLE_API_KEY)
            self.llm = genai.GenerativeModel(self.config.LLM_MODEL)
            self.llm_type = "google"
            logger.info(f"Google Generative AI initialized with model: {self.config.LLM_MODEL}")
        except Exception as e:
            logger.warning(f"Google Generative AI failed ({type(e).__name__}): {str(e)[:100]}")
            logger.info("Falling back to text generation fallback mode")
            self.llm = None
            self.llm_type = "text"
        
        # Initialize HuggingFace Embeddings
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.config.EMBEDDINGS_MODEL
            )
            logger.info(f"HuggingFaceEmbeddings initialized with model: {self.config.EMBEDDINGS_MODEL}")
        except Exception as e:
            logger.error(f"Failed to initialize embeddings: {e}")
            self.embeddings = None
        
        # Initialize vectorstore
        self.vectorstore = None
        self._load_vectorstore()
        
        # Initialize conversation memories (one per session)
        self.memories: Dict[str, Any] = {}
        
        logger.info("LangChainModule initialization complete")
    
    def _load_vectorstore(self) -> None:
        """
        Load FAISS vectorstore from disk if it exists.
        
        Attempts to load a pre-built FAISS index from ./data/faiss_index.
        If not found, logs a warning indicating that the vectorstore will
        be built on demand or no RAG functionality will be available.
        """
        try:
            from langchain_community.vectorstores import FAISS
            
            faiss_path = "/data/faiss_index"
            if os.path.exists(faiss_path) and self.embeddings:
                self.vectorstore = FAISS.load_local(
                    faiss_path, 
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info(f"FAISS vectorstore loaded from {faiss_path}")
            else:
                logger.warning(
                    f"FAISS vectorstore not found at {faiss_path}. "
                    "Run build_vectorstore() to create it."
                )
        except Exception as e:
            logger.warning(f"Could not load vectorstore: {e}")
            self.vectorstore = None
    
    def build_vectorstore(self) -> None:
        """
        Build FAISS vectorstore from documents in DOCS_PATH.
        
        Process:
        1. Walk through DOCS_PATH and load all .txt and .pdf files
        2. Split documents using RecursiveCharacterTextSplitter
        3. Create FAISS vectorstore from split documents
        4. Save vectorstore to ./data/faiss_index
        5. Log statistics about indexed documents
        
        Raises:
            FileNotFoundError: If DOCS_PATH doesn't exist
            ImportError: If required libraries are not available
        """
        logger.info(f"Building vectorstore from documents in {self.config.DOCS_PATH}")
        
        if not self.embeddings:
            logger.error("Cannot build vectorstore without embeddings")
            return
        
        try:
            from langchain_community.document_loaders import TextLoader, PyPDFLoader
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            from langchain_community.vectorstores import FAISS
            
            # Check if docs path exists
            docs_path = Path(self.config.DOCS_PATH)
            if not docs_path.exists():
                logger.warning(f"DOCS_PATH not found: {self.config.DOCS_PATH}")
                return
            
            # Load documents
            documents = []
            
            # Load .txt files
            for txt_file in docs_path.glob("**/*.txt"):
                try:
                    loader = TextLoader(str(txt_file))
                    documents.extend(loader.load())
                    logger.info(f"Loaded text file: {txt_file}")
                except Exception as e:
                    logger.warning(f"Failed to load {txt_file}: {e}")
            
            # Load .pdf files
            for pdf_file in docs_path.glob("**/*.pdf"):
                try:
                    loader = PyPDFLoader(str(pdf_file))
                    documents.extend(loader.load())
                    logger.info(f"Loaded PDF file: {pdf_file}")
                except Exception as e:
                    logger.warning(f"Failed to load {pdf_file}: {e}")
            
            if not documents:
                logger.warning("No documents found to index")
                return
            
            logger.info(f"Loaded {len(documents)} documents")
            
            # Split documents
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50
            )
            chunks = splitter.split_documents(documents)
            logger.info(f"Split documents into {len(chunks)} chunks")
            
            # Create FAISS vectorstore
            self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
            
            # Save vectorstore
            faiss_path = "./data/faiss_index"
            os.makedirs(os.path.dirname(faiss_path), exist_ok=True)
            self.vectorstore.save_local(faiss_path)
            
            logger.info(f"FAISS vectorstore built and saved to {faiss_path}")
            logger.info(f"Total chunks indexed: {len(chunks)}")
        
        except Exception as e:
            logger.error(f"Error building vectorstore: {e}")
            raise
    
    def get_memory(self, session_id: str) -> Any:
        """
        Get conversation history for a session.
        
        Note: Session memory is managed by the Flask backend via session_manager.
        This method is kept for compatibility but retrieves history from outside.
        
        Args:
            session_id: Unique identifier for the conversation session.
        
        Returns:
            Empty dict placeholder (actual history comes from session_manager).
        """
        # Memory is managed external via session_manager in app.py
        # This method is a placeholder for compatibility
        return {}
    
    def get_response(self, question: str, session_id: str) -> Dict[str, Any]:
        """
        Get AI response for a question using ChatPromptTemplate with proper prompt architecture.
        
        Uses a properly separated system prompt (ChatPromptTemplate) to prevent
        prompt injection and leakage.
        
        Args:
            question: The user's question/input text.
            session_id: Unique identifier for the conversation session.
        
        Returns:
            Dict containing:
            {
                'answer': str - The AI's response,
                'tokens_used': int - Estimated tokens used,
                'source': str - 'rag', 'llm', or 'error'
            }
        """
        try:
            from langchain_core.prompts import ChatPromptTemplate
            from nlp_utils import estimate_tokens
            
            tokens_used = estimate_tokens(question)
            
            # System prompt - defines ARIA's role and behavior
            SYSTEM_PROMPT = """You are ARIA, an intelligent technical support assistant specializing in Python, Flask, Rasa, LangChain, NLP, and general programming.

RESPONSE GUIDELINES:
- Provide complete, direct answers without generic filler
- Use numbered steps (1. 2. 3.) for guides and procedures  
- Use bullet points (- or •) for lists and options
- Format code in ```language blocks (e.g., ```python)
- Keep responses concise but comprehensive
- Ask at most ONE follow-up question at the end, or none if the answer is complete
- Never use phrases like "I appreciate your question" or "could you provide more detail?"
- Answer any topic with your best knowledge, not just the listed specialties"""
            
            # Build ChatPromptTemplate with proper separation of system and user messages
            chat_prompt = ChatPromptTemplate.from_messages([
                ("system", SYSTEM_PROMPT),
                ("human", "{question}")
            ])
            
            # Use RAG if vectorstore is available
            if self.vectorstore:
                logger.info(f"Using RAG retrieval for session: {session_id}")
                
                try:
                    # Retrieve relevant documents
                    retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                    docs = retriever.invoke(question)
                    
                    # Build context from retrieved documents
                    context = "\n\n".join([doc.page_content for doc in docs]) if docs else ""
                    
                    if context:
                        # Add document context to the system prompt
                        rag_system = SYSTEM_PROMPT + f"\n\nRELEVANT DOCUMENTATION:\n{context}"
                        chat_prompt = ChatPromptTemplate.from_messages([
                            ("system", rag_system),
                            ("human", "{question}")
                        ])
                        source = "rag"
                    else:
                        source = "llm"
                except Exception as rag_error:
                    logger.warning(f"RAG retrieval failed, falling back to LLM: {rag_error}")
                    source = "llm"
            else:
                source = "llm"
            
            # Format the prompt
            formatted_prompt = chat_prompt.format(question=question)
            
            # Call LLM with the properly formatted prompt
            answer = self._call_llm(formatted_prompt)
            
            tokens_used += estimate_tokens(answer)
            
            return {
                "answer": answer,
                "tokens_used": tokens_used,
                "source": source
            }
        
        except Exception as e:
            logger.error(f"Error getting response: {e}")
            return {
                "answer": "I encountered an error processing your question. Please try again.",
                "tokens_used": 0,
                "source": "error"
            }
    
    def _call_llm(self, prompt: str) -> str:
        """
        Call the LLM with simple error handling.
        
        Tries to use Google Generative AI if available.
        
        Args:
            prompt: The prompt to send to the LLM
            
        Returns:
            The LLM response as a string
        """
        try:
            if self.llm and self.llm_type == "google":
                response = self.llm.generate_content(prompt)
                return response.text if hasattr(response, 'text') else str(response)
            else:
                # No LLM available
                logger.warning("LLM not available - returning error message")
                return "I'm unable to process your request at this moment. Please try again later."
                
        except Exception as e:
            logger.error(f"Error in _call_llm: {e}")
            return f"I encountered an error: {str(e)[:100]}. Please try again."


