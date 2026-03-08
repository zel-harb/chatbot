import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """
    Configuration class that loads and manages all environment variables.
    
    This class centralizes all application configuration, loading variables
    from the .env file and providing sensible defaults. All attributes are
    class-level variables for easy access throughout the application.
    """
    
    # Google Gemini Configuration (Free API)
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Rasa NLU Configuration
    RASA_URL: str = os.getenv("RASA_URL", "http://localhost:5005")
    RASA_TOKEN: str = os.getenv("RASA_TOKEN", "")
    
    # Flask Configuration
    FLASK_SECRET_KEY: str = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    FLASK_PORT: int = int(os.getenv("FLASK_PORT", "5000"))
    
    # Model Configuration
    LLM_MODEL: str = os.getenv("LLM_MODEL", "mixtral-8x7b-32768")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.60"))
    
    # Document and Embeddings Configuration
    DOCS_PATH: str = os.getenv("DOCS_PATH", "./data/docs")
    EMBEDDINGS_MODEL: str = os.getenv("EMBEDDINGS_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    
    @classmethod
    def validate(cls) -> None:
        """
        Validate that all critical configuration variables are set.
        
        Raises:
            ValueError: If OPENAI_API_KEY is not configured.
        
        This method should be called during application startup to ensure
        all required environment variables are properly configured.
        """
        if not cls.GOOGLE_API_KEY:
            raise ValueError(
                "GOOGLE_API_KEY is not configured. "
                "Please set it in your .env file or environment variables. "
                "Get a free API key from: https://aistudio.google.com/app/apikey"
            )
    
    @classmethod
    def display(cls) -> None:
        """
        Display all configuration values to console.
        
        Prints all configuration variables in a formatted table while masking
        the OPENAI_API_KEY for security. Useful for debugging and verifying
        application configuration.
        """
        print("\n" + "=" * 60)
        print("APPLICATION CONFIGURATION")
        print("=" * 60)
        
        config_items = [
            ("GOOGLE_API_KEY", cls._mask_key(cls.GOOGLE_API_KEY)),
            ("RASA_URL", cls.RASA_URL),
            ("RASA_TOKEN", cls._mask_key(cls.RASA_TOKEN) if cls.RASA_TOKEN else "(not set)"),
            ("FLASK_SECRET_KEY", cls._mask_key(cls.FLASK_SECRET_KEY)),
            ("FLASK_ENV", cls.FLASK_ENV),
            ("FLASK_PORT", str(cls.FLASK_PORT)),
            ("LLM_MODEL", cls.LLM_MODEL),
            ("LLM_TEMPERATURE", str(cls.LLM_TEMPERATURE)),
            ("CONFIDENCE_THRESHOLD", str(cls.CONFIDENCE_THRESHOLD)),
            ("DOCS_PATH", cls.DOCS_PATH),
            ("EMBEDDINGS_MODEL", cls.EMBEDDINGS_MODEL),
        ]
        
        for key, value in config_items:
            print(f"{key:<30} {value}")
        
        print("=" * 60 + "\n")
    
    @staticmethod
    def _mask_key(key: str, visible_chars: int = 4) -> str:
        """
        Mask a sensitive key for safe display.
        
        Args:
            key: The key to mask.
            visible_chars: Number of characters to show at the end (default: 4).
        
        Returns:
            str: The masked key in format "****...xxxx" where xxxx is the last 4 characters.
        """
        if not key or len(key) <= visible_chars:
            return "****"
        return f"****...{key[-visible_chars:]}"
