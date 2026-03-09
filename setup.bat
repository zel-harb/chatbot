@echo off
REM Setup and run ARIA Chatbot (Windows)

echo.
echo ================================
echo ARIA Chatbot - Setup ^& Run
echo ================================
echo.

REM Check prerequisites
echo [*] Checking prerequisites...

where python >nul 2>nul
if errorlevel 1 (
    echo [X] Python 3 is not installed
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo [X] Node.js is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VER=%%i
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i

echo [+] Python: %PYTHON_VER%
echo [+] Node.js: %NODE_VER%
echo [+] npm: %NPM_VER%
echo.

echo [*] Select setup method:
echo 1) Docker Compose (Recommended - easier)
echo 2) Manual Setup (Development)

set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo [*] Docker Compose Setup
    
    where docker >nul 2>nul
    if errorlevel 1 (
        echo [X] Docker is not installed
        echo Please install Docker from: https://www.docker.com/
        exit /b 1
    )
    
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VER=%%i
    echo [+] %DOCKER_VER%
    echo.
    
    cd aria-backend
    
    if not exist .env (
        echo [*] Creating .env file...
        copy .env.example .env
        echo [!] Please edit aria-backend\.env and add your GOOGLE_API_KEY
        echo [!] Get free key from: https://aistudio.google.com/app/apikey
        pause
    )
    
    echo [*] Starting Docker services...
    docker-compose up --build
    
) else if "%choice%"=="2" (
    echo.
    echo [*] Manual Setup
    
    cd aria-backend
    
    if not exist .env (
        echo [*] Creating .env file...
        copy .env.example .env
        echo [!] Please edit aria-backend\.env and add your GOOGLE_API_KEY
        echo [!] Get free key from: https://aistudio.google.com/app/apikey
        pause
    )
        echo [*] Creating Python virtual environment...
        python -m venv venv
    )
    
    echo [*] Activating virtual environment...
    call venv\Scripts\activate.bat
    
    echo [*] Installing Python dependencies...
    pip install -r requirements.txt
    
    echo [*] Downloading spaCy model...
    python -m spacy download en_core_web_sm
    
    cd rasa
    echo [*] Training Rasa model...
    call rasa train
    
    echo.
    echo [!] Now you need to start Rasa in separate terminals:
    echo   Terminal 1: cd aria-backend\rasa ^&^& rasa run -p 5005 --enable-api --cors "*"
    echo   Terminal 2: cd aria-backend\rasa ^&^& rasa run actions
    echo   Terminal 3: cd aria-backend ^&^& python app.py
    pause
    
) else (
    echo [X] Invalid choice
    exit /b 1
)

REM Frontend setup
echo.
echo [*] Frontend Setup
cd ..\frontend

if not exist node_modules (
    echo [*] Installing npm packages...
    call npm install
)

echo [*] Starting frontend development server...
call npm run dev

pause
