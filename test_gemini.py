#!/usr/bin/env python3
"""
Test script to diagnose Gemini API key and list available models
"""
import os

API_KEY = "AIzaSyDAZZs3R_kfGHrfOF91iLXzAbuASK5wDTM"

print("=" * 60)
print("GEMINI API KEY DIAGNOSTIC TEST")
print("=" * 60)

try:
    import google.generativeai as genai
    
    print("\n✓ google-generativeai library is installed")
    
    # Configure with API key
    genai.configure(api_key=API_KEY)
    print("✓ API key configured")
    
    # List available models
    print("\nFetching available models...")
    models = genai.list_models()
    
    print(f"\nAvailable models ({sum(1 for _ in models)} total):")
    print("-" * 60)
    
    models = genai.list_models()
    for model in models:
        # Extract model name (remove 'models/' prefix)
        name = model.name.replace('models/', '')
        print(f"  • {name}")
        
except ImportError as e:
    print(f"\n✗ Error: google-generativeai not installed")
    print(f"  Install with: pip install google-generativeai")
except Exception as e:
    print(f"\n✗ Error: {type(e).__name__}")
    print(f"  Details: {str(e)}")
    print("\nPossible causes:")
    print("  1. Invalid or expired API key")
    print("  2. Generative Language API not enabled in Google Cloud")
    print("  3. Network connectivity issue")
    print("\nFix:")
    print("  1. Go to https://aistudio.google.com/app/apikey")
    print("  2. Create a new API key or verify existing one")
    print("  3. Ensure your Google account has enough quota")

print("\n" + "=" * 60)
