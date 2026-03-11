#!/usr/bin/env python3
"""Test JWT authentication endpoints."""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_endpoints():
    print("=" * 60)
    print("  JWT AUTHENTICATION TESTING")
    print("=" * 60)
    
    # Test 1: Register a new user
    print("\n1. Testing /register endpoint...")
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=register_data)
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 201]:
            data = response.json()
            access_token = data.get("access_token")
            print(f"✓ Registration successful")
            print(f"  - User: {data['user']['username']}")
            print(f"  - Token: {access_token[:20]}...")
        else:
            print(f"✗ Registration failed: {response.json()}")
            return False
    except Exception as e:
        print(f"✗ Registration error: {e}")
        return False
    
    # Test 2: Login
    print("\n2. Testing /login endpoint...")
    login_data = {
        "username": "testuser",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✓ Login successful")
            print(f"  - Token: {token[:20]}...")
        else:
            print(f"✗ Login failed: {response.json()}")
            return False
    except Exception as e:
        print(f"✗ Login error: {e}")
        return False
    
    # Test 3: Access protected /chat endpoint without token (should fail)
    print("\n3. Testing /chat endpoint without token (should fail)...")
    try:
        response = requests.post(f"{BASE_URL}/chat", json={"message": "hello"})
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print(f"✓ Correctly rejected (401): {response.json()}")
        else:
            print(f"✗ Should have returned 401, got: {response.json()}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 4: Access /chat with valid token
    print("\n4. Testing /chat endpoint with valid token...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat", 
            json={"message": "What is Python?"},
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Chat successful")
            print(f"  - Reply: {data['reply'][:60]}...")
        else:
            print(f"✗ Chat failed: {response.text}")
    except Exception as e:
        print(f"✗ Chat error: {e}")
    
    print("\n" + "=" * 60)
    print("  TESTS COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()
