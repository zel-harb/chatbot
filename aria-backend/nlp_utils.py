import re
import logging
from typing import List

# Configure logging for NLP utilities
logger = logging.getLogger(__name__)


def preprocess_text(text: str) -> str:
    """
    Preprocess text by normalizing and cleaning it.
    
    Performs the following operations:
    - Converts text to lowercase
    - Strips leading/trailing whitespace
    - Removes special characters, keeping only alphanumerics and spaces
    
    Args:
        text: Raw text to preprocess.
    
    Returns:
        str: Cleaned and normalized text.
    """
    if not isinstance(text, str):
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Strip whitespace
    text = text.strip()
    
    # Remove special characters, keep alphanumerics and spaces
    text = re.sub(r'[^a-z0-9\s]', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text


def extract_keywords(text: str) -> List[str]:
    """
    Extract keywords from text using noun chunks and named entities.
    
    Attempts to use spaCy's en_core_web_sm model to extract noun chunks
    and named entities. Falls back to simple word-based extraction if
    spaCy model is not available.
    
    Args:
        text: Text to extract keywords from.
    
    Returns:
        List[str]: List of extracted keyword phrases.
    """
    if not isinstance(text, str) or not text.strip():
        return []
    
    # Try spaCy extraction first
    try:
        import spacy
        
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model 'en_core_web_sm' not found. Using fallback extraction.")
            return _fallback_keyword_extraction(text)
        
        doc = nlp(text)
        keywords = []
        
        # Extract noun chunks
        for chunk in doc.noun_chunks:
            keywords.append(chunk.text)
        
        # Extract named entities
        for ent in doc.ents:
            keywords.append(ent.text)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_keywords = []
        for kw in keywords:
            if kw.lower() not in seen:
                seen.add(kw.lower())
                unique_keywords.append(kw)
        
        return unique_keywords
    
    except ImportError:
        logger.warning("spaCy not installed. Using fallback keyword extraction.")
        return _fallback_keyword_extraction(text)
    except Exception as e:
        logger.error(f"Error in spaCy extraction: {e}. Using fallback.")
        return _fallback_keyword_extraction(text)


def _fallback_keyword_extraction(text: str) -> List[str]:
    """
    Fallback keyword extraction using simple word filtering.
    
    Splits text into words and filters out common stopwords.
    
    Args:
        text: Text to extract keywords from.
    
    Returns:
        List[str]: List of extracted keywords.
    """
    stopwords = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'how', 'what', 'when', 'where', 'why', 'it', 'this', 'that'
    }
    
    words = text.lower().split()
    keywords = [w for w in words if w not in stopwords and len(w) > 2]
    return list(dict.fromkeys(keywords))  # Remove duplicates while preserving order


def detect_language(text: str) -> str:
    """
    Detect the language of text using langdetect.
    
    Identifies the language of the input text and returns its ISO 639-1 code.
    Falls back to 'en' (English) if detection fails or langdetect is unavailable.
    
    Args:
        text: Text to detect language for.
    
    Returns:
        str: ISO 639-1 language code (e.g., 'en', 'fr', 'ar', 'es').
             Returns 'en' if detection fails.
    """
    if not isinstance(text, str) or not text.strip():
        return "en"
    
    try:
        from langdetect import detect, LangDetectException
        
        try:
            language = detect(text)
            return language
        except LangDetectException:
            logger.debug("Language detection failed, defaulting to 'en'")
            return "en"
    
    except ImportError:
        logger.warning("langdetect not installed. Defaulting to 'en'.")
        return "en"
    except Exception as e:
        logger.error(f"Error detecting language: {e}. Defaulting to 'en'.")
        return "en"


def estimate_tokens(text: str) -> int:
    """
    Estimate the number of tokens in text using tiktoken.
    
    Uses the 'cl100k_base' encoding (used by GPT-3.5-turbo and GPT-4)
    to estimate token count. Useful for tracking API usage and costs.
    
    Args:
        text: Text to estimate token count for.
    
    Returns:
        int: Estimated number of tokens. Returns 0 for empty text.
             Falls back to rough estimation if tiktoken unavailable.
    """
    if not isinstance(text, str) or not text.strip():
        return 0
    
    try:
        import tiktoken
        
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = encoding.encode(text)
        return len(tokens)
    
    except ImportError:
        logger.warning("tiktoken not installed. Using fallback token estimation.")
        # Rough estimation: ~4 characters per token
        return max(1, len(text) // 4)
    except Exception as e:
        logger.error(f"Error estimating tokens: {e}. Using fallback estimation.")
        # Rough estimation: ~4 characters per token
        return max(1, len(text) // 4)


def boost_confidence(text: str, intent: str, base_confidence: float) -> float:
    """
    Boost confidence score based on keyword matching.
    
    If the text contains keywords that match the intent name, increases
    the confidence score. For example, if the intent is 'faq_flask' and
    the text contains 'flask', the confidence is boosted by 0.08.
    
    Args:
        text: User input text to analyze.
        intent: The detected intent name (e.g., 'faq_flask').
        base_confidence: Original confidence score (0.0-1.0).
    
    Returns:
        float: Boosted confidence score, capped at 1.0.
    """
    if not isinstance(text, str) or not isinstance(intent, str):
        return min(1.0, base_confidence)
    
    if not text.strip() or not intent.strip():
        return min(1.0, base_confidence)
    
    # Extract intent keywords (remove prefix like 'faq_')
    intent_parts = intent.lower().split('_')
    intent_keywords = [part for part in intent_parts if part]
    
    # Preprocess text for comparison
    text_lower = text.lower()
    text_keywords = set(text_lower.split())
    
    # Check if any intent keywords are in the text
    for keyword in intent_keywords:
        if keyword in text_keywords or keyword in text_lower:
            boosted = base_confidence + 0.08
            # Cap at 1.0
            return min(1.0, boosted)
    
    return min(1.0, base_confidence)
