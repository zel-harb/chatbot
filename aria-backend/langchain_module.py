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
        Get AI response for a question using RAG or LLM.
        
        Uses system prompt that defines ARIA as technical support specialist.
        If vectorstore is available, adds document context for RAG.
        
        Args:
            question: The user's question/input text.
            session_id: Unique identifier for the conversation session.
        
        Returns:
            Dict containing:
            {
                'answer': str - The AI's response,
                'tokens_used': int - Estimated tokens used,
                'source': str - 'rag' or 'llm' or 'text'
            }
        
        Returns error response on failure (with source='error').
        """
        try:
            from nlp_utils import estimate_tokens
            
            tokens_used = estimate_tokens(question)
            
            # System prompt for ARIA
            system_prompt = """You are ARIA, an intelligent technical support assistant and student tutor. 

Your expertise includes:
- Python programming (basics to advanced)
- Flask web framework
- Rasa NLU and conversational AI
- LangChain and RAG systems
- NLP and machine learning concepts
- General programming and software engineering

Your response style:
- Give clear, direct, complete answers
- Provide examples and code snippets when relevant
- Break down complex topics into simple steps
- Never ask for more context unless absolutely necessary
- If someone asks to learn something, provide structured learning guides
- Be friendly but professional
- Admit if you don't know something, but try to give helpful guidance anyway

For technical questions, always provide working examples when possible."""
            
            # Use RAG if vectorstore is available
            if self.vectorstore:
                logger.info(f"Using RAG retrieval for session: {session_id}")
                
                # Retrieve relevant documents
                retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                docs = retriever.invoke(question)
                
                # Build context from retrieved documents
                context = "\n\n".join([doc.page_content for doc in docs]) if docs else ""
                
                if context:
                    # Create RAG prompt with context
                    rag_prompt = f"""{system_prompt}

Context from documents:
{context}

User question: {question}

Provide a comprehensive answer based on the context and your knowledge:"""
                else:
                    # No documents retrieved, use regular prompt
                    rag_prompt = f"""{system_prompt}

User question: {question}

Provide a comprehensive answer:"""
                
                answer = self._call_llm(rag_prompt)
                tokens_used += estimate_tokens(answer)
                
                return {
                    "answer": answer,
                    "tokens_used": tokens_used,
                    "source": "rag"
                }
            
            # Fallback to simple LLM (no RAG)
            else:
                logger.info(f"Using LLM fallback for session: {session_id}")
                
                llm_prompt = f"""{system_prompt}

User question: {question}

Provide a comprehensive, helpful answer:"""
                
                answer = self._call_llm(llm_prompt)
                tokens_used += estimate_tokens(answer)
                
                return {
                    "answer": answer,
                    "tokens_used": tokens_used,
                    "source": "llm"
                }
        
        except Exception as e:
            logger.error(f"Error getting response: {e}")
            return {
                "answer": f"I encountered an error processing your question: {str(e)}. Please try again.",
                "tokens_used": 0,
                "source": "error"
            }
    
    def _call_llm(self, prompt: str) -> str:
        """
        Call the LLM with fallback handling.
        
        Tries to use Google Generative AI if available. 
        Falls back to basic text templates as last resort.
        
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
                # Fallback: Use pattern-based responses
                logger.info("Using text generation fallback (Gemini API unavailable)")
                return self._generate_fallback_response(prompt)
                
        except Exception as e:
            logger.error(f"Error in _call_llm: {e}")
            return self._generate_fallback_response(prompt)
    
    def _generate_fallback_response(self, prompt: str) -> str:
        """
        Generate intelligent fallback responses without requiring external APIs.
        Uses pattern matching and NLP to provide helpful answers.
        """
        prompt_lower = prompt.lower()
        
        # Extract question if present
        if "question:" in prompt_lower:
            parts = prompt.split("Question:") if "Question:" in prompt else prompt.split("question:")
            question = parts[-1].split("Answer:")[0].strip() if len(parts) > 1 else prompt.strip()
        else:
            question = prompt.strip()
        
        question_lower = question.lower()
        
        # Greeting patterns
        greetings = ['hello', 'hi', 'hey', 'greetings', 'sup', 'good morning', 'good afternoon', 'good evening']
        if any(word in question_lower for word in greetings):
            return "Hello! I'm ARIA, your AI assistant for technical support and learning. What can I help you with today?"
        
        # How are you patterns
        if any(phrase in question_lower for phrase in ['how are you', "how do you do", "what's up", 'whats up']):
            return "I'm doing great, thanks for asking! I'm ready to help with technical questions about Python, Flask, Rasa, LangChain, or general programming. What would you like to know?"
        
        # Thank you patterns
        if any(word in question_lower for word in ['thank you', 'thanks', 'thankyou', 'appreciate']):
            return "You're welcome! I'm happy to help. Do you have any other questions?"
        
        # Goodbye patterns
        if any(word in question_lower for word in ['bye', 'goodbye', 'see you', 'take care', 'farewell']):
            return "Goodbye! Feel free to reach out anytime you need help. Have a great day!"
        
        # Python-related questions
        if any(word in question_lower for word in ['python', 'py', 'code', 'programming', 'script']):
            if any(word in question_lower for word in ['learn', 'start', 'beginner', 'basic']):
                return """To start learning Python, follow these steps:
1. **Install Python** from python.org (3.9+ recommended)
2. **Text editor/IDE**: Use VS Code, PyCharm, or Jupyter Notebook
3. **Basic concepts**: Start with variables, data types, loops, functions
4. **Projects**: Build simple programs like calculators, to-do lists, games
5. **Practice**: Solve problems on platforms like LeetCode or HackerRank

Key resources: Python.org tutorials, Codecademy, Real Python

What specific aspect would you like to learn first?"""
            
            if any(word in question_lower for word in ['list', 'dictionary', 'string', 'tuple']):
                return """Python Data Structures:
- **List**: Ordered, mutable collection. Use [ ] and append(), pop(), extend()
- **Dictionary**: Key-value pairs. Use { } and access by key
- **Tuple**: Ordered, immutable. Use ( ) - can't modify after creation
- **Set**: Unordered unique items. Use { } with unique values

Which data structure are you working with?"""
            
            if any(word in question_lower for word in ['function', 'def', 'return', 'parameter']):
                return """Python Functions:
```python
def function_name(parameter):
    # Code here
    return result
```
- Functions help organize code
- Parameters are inputs, return is output
- Use return keyword to send data back

Need help with a specific function?"""
            
            return "I can help with Python! What specific topic are you interested in? (loops, functions, data types, libraries, etc.)"
        
        # Flask-related questions
        if 'flask' in question_lower:
            if any(word in question_lower for word in ['start', 'setup', 'install', 'begin']):
                return """Flask Setup:
1. Install Flask: `pip install flask`
2. Create app.py:
```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello World!'

if __name__ == '__main__':
    app.run()
```
3. Run: `python app.py`
4. Visit: http://localhost:5000

Ready to build your first Flask app?"""
            
            return "Flask is a Python web framework. What would you like to know? (routing, templates, databases, etc.)"
        
        # Rasa-related questions
        if 'rasa' in question_lower:
            if any(word in question_lower for word in ['start', 'setup', 'install']):
                return """Rasa Setup:
1. Install: `pip install rasa`
2. Create project: `rasa init`
3. Structure:
   - nlu.yml: Training data for intent/entity recognition
   - domain.yml: Intents, actions, responses
   - stories.yml: Conversation flows
   - rules.yml: Conditional flows
4. Train: `rasa train`
5. Chat: `rasa shell`

What aspect of Rasa do you want to learn?"""
            
            return "Rasa is for NLU and conversational AI. What would you like to know about it?"
        
        # Error handling
        if any(word in question_lower for word in ['error', 'bug', 'problem', 'broken', 'issue', 'not working', 'traceback']):
            return "I can help debug issues! Please share:\n1. The error message/traceback\n2. What you were trying to do\n3. The relevant code snippet\n\nThen I can help you fix it."
        
        # General how questions
        if question_lower.startswith('how '):
            topic = question.replace('How ', '').replace('how ', '')
            if len(topic) > 50:
                topic = ' '.join(topic.split()[:3])
            return f"""I can explain how to work with {topic}. 

Here's my general approach:
1. **Understand the basics** - Know what the concept does
2. **See an example** - Look at working code
3. **Try it yourself** - Practice with a simple implementation
4. **Debug & iterate** - Modify and improve

What specific part of '{topic}' would you like to understand?"""
        
        # What questions (definitions/explanations)
        if question_lower.startswith('what '):
            topic = question.replace('What ', '').replace('what ', '').replace('is ', '').replace('are ', '').strip()
            if len(topic) > 40:
                topic = ' '.join(topic.split()[:2])
            return f"""{topic.title()} is a concept or tool that serves a specific purpose. 

I can give you:
1. **Definition** - What it is and does
2. **When to use it** - Real-world applications
3. **Code examples** - How to implement it
4. **Best practices** - Tips for using it well

Tell me which aspects you'd like to explore!"""
        
        # Why questions (reasoning)
        if question_lower.startswith('why ') or any(word in question_lower for word in ['why ', 'reason', 'purpose']):
            return """Great question! Understanding the 'why' is important for learning.

The reason things work the way they do usually comes down to:
- **Design decisions** - How the creator designed it
- **Performance** - What makes it efficient
- **Best practices** - What experience showed works well
- **Compatibility** - How it works with other systems

What specifically would you like to understand the reasoning behind?"""
        
        # Default intelligent response
        return f"""I'm here to help! I understand you're asking about: "{question}"

To give you the best answer, I can:
1. Explain the concept step-by-step
2. Show you code examples
3. Help you troubleshoot issues
4. Guide you through implementation

What would be most helpful for you?"""

