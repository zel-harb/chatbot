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
        - ChatOpenAI model from config
        - HuggingFace embeddings model
        - FAISS vectorstore (if available)
        - Conversation memory storage
        
        Logs warnings if models or documents are not found.
        """
        logger.info("Initializing LangChainModule...")
        
        # Load configuration
        self.config = Config
        
        # Initialize Groq ChatModel (Free API)
        try:
            from langchain_groq import ChatGroq
            
            self.llm = ChatGroq(
                model=self.config.LLM_MODEL,
                temperature=self.config.LLM_TEMPERATURE,
                api_key=self.config.GROQ_API_KEY
            )
            logger.info(f"ChatGroq initialized with model: {self.config.LLM_MODEL}")
        except Exception as e:
            logger.error(f"Failed to initialize ChatGroq: {e}")
            raise
        
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
        Get or create conversation memory for a session.
        
        Memory is stored per session_id to maintain separate conversation
        contexts for different users. Uses ConversationBufferMemory with
        'chat_history' as the key and human_prefix/ai_prefix for clarity.
        
        Args:
            session_id: Unique identifier for the conversation session.
        
        Returns:
            ConversationBufferMemory instance for the session.
        """
        if session_id not in self.memories:
            try:
                from langchain.memory import ConversationBufferMemory
                
                memory = ConversationBufferMemory(
                    memory_key="chat_history",
                    return_messages=True,
                    human_prefix="User",
                    ai_prefix="Assistant"
                )
                self.memories[session_id] = memory
                logger.info(f"Created new memory for session: {session_id}")
            except Exception as e:
                logger.error(f"Failed to create memory: {e}")
                raise
        
        return self.memories[session_id]
    
    def get_response(self, question: str, session_id: str) -> Dict[str, Any]:
        """
        Get AI response for a question using RAG or LLM fallback.
        
        If vectorstore is available, uses ConversationalRetrievalChain for
        RAG-based responses. Otherwise, falls back to a simple LLMChain with
        a system prompt instructing the model to act as a technical assistant.
        
        Args:
            question: The user's question/input text.
            session_id: Unique identifier for the conversation session.
        
        Returns:
            Dict containing:
            {
                'answer': str - The AI's response,
                'tokens_used': int - Estimated tokens used,
                'source': str - 'rag' or 'llm'
            }
        
        Returns error response on failure (with source='error').
        """
        try:
            from nlp_utils import estimate_tokens
            
            tokens_used = estimate_tokens(question)
            
            # Use RAG if vectorstore is available
            if self.vectorstore:
                logger.info(f"Using RAG retrieval for session: {session_id}")
                
                # Retrieve relevant documents
                retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                docs = retriever.invoke(question)
                
                # Build context from retrieved documents
                context = "\n\n".join([doc.page_content for doc in docs]) if docs else "No relevant documents found."
                
                # Create RAG prompt and get response
                rag_prompt = f"""You are a helpful technical assistant. Use the following context to answer the question.
If the context doesn't contain relevant information, say so and provide your best answer.

Context:
{context}

Question: {question}

Answer:"""
                
                response = self.llm.invoke(rag_prompt)
                answer = response.content if hasattr(response, 'content') else str(response)
                
                # Add response tokens to total
                tokens_used += estimate_tokens(answer)
                
                return {
                    "answer": answer,
                    "tokens_used": tokens_used,
                    "source": "rag"
                }
            
            # Fallback to simple LLM (no RAG)
            else:
                logger.info(f"Using LLM fallback for session: {session_id}")
                
                llm_prompt = """You are a helpful technical assistant for students.
Answer questions clearly and concisely.
If you don't know something, say so honestly.

Question: """ + question + "\n\nAnswer:"
                
                response = self.llm.invoke(llm_prompt)
                answer = response.content if hasattr(response, 'content') else str(response)
                
                # Add response tokens to total
                tokens_used += estimate_tokens(answer)
                
                return {
                    "answer": answer,
                    "tokens_used": tokens_used,
                    "source": "llm"
                }
        
        except Exception as e:
            logger.error(f"Error getting response: {e}")
            return {
                "answer": f"Error processing request: {str(e)}",
                "tokens_used": 0,
                "source": "error"
            }
