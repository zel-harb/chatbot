#!/bin/bash
# Setup and run ARIA Chatbot (Linux/Mac)

set -e  # Exit on error

echo "================================"
echo "ARIA Chatbot - Setup & Run"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

print_step "Python: $(python3 --version)"
print_step "Node.js: $(node --version)"
print_step "npm: $(npm --version)"

echo ""
print_step "Select setup method:"
echo "1) Docker Compose (Recommended - easier)"
echo "2) Manual Setup (Development)"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        print_step "Docker Compose Setup"
        
        if ! command -v docker &> /dev/null; then
            print_error "Docker is not installed"
            echo "Please install Docker from: https://www.docker.com/"
            exit 1
        fi
        
        print_step "Docker: $(docker --version)"
        
        # Backend setup
        cd aria-backend
        
        if [ ! -f .env ]; then
            print_step "Creating .env file..."
            cp .env.example .env
            print_warn "Please edit aria-backend/.env and add your OPENAI_API_KEY"
            read -p "Press Enter when you've updated .env..."
        fi
        
        print_step "Starting Docker services..."
        docker-compose up --build
        ;;
        
    2)
        print_step "Manual Setup"
        
        # Backend setup
        cd aria-backend
        
        if [ ! -f .env ]; then
            print_step "Creating .env file..."
            cp .env.example .env
            print_warn "Please edit aria-backend/.env and add your OPENAI_API_KEY"
            read -p "Press Enter when you've updated .env..."
        fi
        
        if [ ! -d venv ]; then
            print_step "Creating Python virtual environment..."
            python3 -m venv venv
        fi
        
        print_step "Activating virtual environment..."
        source venv/bin/activate
        
        print_step "Installing Python dependencies..."
        pip install -r requirements.txt
        
        print_step "Downloading spaCy model..."
        python -m spacy download en_core_web_sm
        
        cd rasa
        print_step "Training Rasa model..."
        rasa train
        
        print_warn "Now you need to start Rasa in separate terminals:"
        echo "  Terminal 1: cd aria-backend/rasa && rasa run -p 5005 --enable-api --cors \"*\""
        echo "  Terminal 2: cd aria-backend/rasa && rasa run actions"
        echo "  Terminal 3: cd aria-backend && python app.py"
        read -p "Press Enter when Rasa is running..."
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Frontend setup
echo ""
print_step "Frontend Setup"
cd ../frontend

if [ ! -d node_modules ]; then
    print_step "Installing npm packages..."
    npm install
fi

print_step "Starting frontend development server..."
npm run dev
