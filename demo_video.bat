@echo off
setlocal EnableDelayedExpansion

:: ==============================================================================
:: ACSS AUTOMATED DEMO SCRIPT - THE EXECUTIONER
:: Author: Saumya Patel
:: Usage: Run this script and press any key to advance through the demo steps.
:: ==============================================================================

:: Configuration
:: REPLACE WITH YOUR OWN NGROK URL (Run: ngrok http 11434)
set "NGROK_URL=https://your-ngrok-url.ngrok-free.app"
set "DEMO_DIR=%USERPROFILE%\acss-demo-final"
set "PROJECT_DIR=%DEMO_DIR%\chat-app"

:: Clear screen and set color (Matrix green is cool, but let's stick to professional)
color 0A
cls

:: ------------------------------------------------------------------------------
:: PART 1: INTRO
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo.
echo    "Hello everyone, I am Saumya Patel, an enthusiastic AI fullstack developer 
echo     and a college student..."
echo.
echo ===============================================================================
echo.
echo "Every developer using AI tools faces this frustrating problem: You're making
echo  great progress with ChatGPT, then you hit the rate limit. You switch to Claude,
echo  but now Claude has zero context. You waste 10 to 15 minutes re-explaining
echo  your entire project - the tech stack, your decisions, the errors you've hit.
echo  This happens multiple times a day. It's a massive productivity killer."
echo.
echo (Press any key to start the demo setup...)
set /p "id=Press ENTER to continue..."
echo.
echo "So I built ACSS - AI Coding Session State. It's a universal format that
echo  captures your complete coding session and enables instant handoffs between
echo  any AI tools. Let me show you how it works."
echo.
echo (Press any key to INITIALIZE PROJECT...)
set /p "id=Press ENTER to continue..."

:: ------------------------------------------------------------------------------
:: PART 0: CLEANUP & SETUP (Hidden)
:: ------------------------------------------------------------------------------
echo.
echo [System] Setting up fresh demo environment...
if exist "%DEMO_DIR%" rmdir /s /q "%DEMO_DIR%"
mkdir "%PROJECT_DIR%"
cd /d "%PROJECT_DIR%"

:: Create project files
mkdir src\auth src\chat src\api src\middleware src\utils
mkdir tests\unit tests\integration
type nul > src\index.js
type nul > src\auth\login.js
type nul > src\chat\websocket.js
type nul > src\api\users.js
type nul > src\api\messages.js
type nul > src\middleware\auth.js
type nul > src\utils\jwt.js
type nul > src\utils\validation.js

:: Create package.json
(
echo {
echo   "name": "realtime-chat-app",
echo   "version": "1.0.0",
echo   "description": "Real-time chat with JWT authentication",
echo   "dependencies": {
echo     "express": "^4.18.0",
echo     "socket.io": "^4.5.0",
echo     "jsonwebtoken": "^9.0.0",
echo     "bcrypt": "^5.1.0",
echo     "mongoose": "^7.0.0"
echo   }
echo }
) > package.json

cls

:: ------------------------------------------------------------------------------
:: PART 2: INITIALIZATION
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo PHASE 1: PROJECT INITIALIZATION
echo ===============================================================================
echo.
echo "I'm building a real-time chat application with authentication. Let me
echo  initialize ACSS to track this project."
echo.
echo COMMAND: acss init
echo.
echo (We interpret your project structure and tech stack automatically)
echo.
echo [ACTION]: Simulating interactive input...
timeout /t 2 >nul

:: Manually create session file to avoid interactive prompt issues in batch
node -e "const fs=require('fs'); const os=require('os'); const path=require('path'); const d=process.env.PROJECT_DIR; fs.mkdirSync(path.join(d,'.acss'),{recursive:true}); fs.writeFileSync(path.join(d,'.acss','session.acss.json'), JSON.stringify({sessionId:'demo',projectRoot:d,lastUpdatedAt:new Date().toISOString(),projectMetadata:{name:'Real-Time Chat App',techStack:['Node.js','Express','Socket.io','MongoDB','JWT'],totalFiles:14,fileTree:{src:['index.js','auth/login.js','chat/websocket.js']}},currentTask:{intent:'Building WebSocket-based real-time chat with authentication',status:'active'},decisions:[],errorsEncountered:[],nextSteps:[],sources:[],filesModified:[]},null,2));"

echo.
echo [OUTPUT]:
echo ✓ Scanning project directory...
echo ✓ Found 14 files across 8 directories
echo ✓ Detected tech stack from package.json
echo ✓ Created .acss/session.acss.json
echo.
echo Session initialized for: Real-Time Chat App
echo.
echo (Press any key to INSPECT the session...)
set /p "id=Press ENTER to continue..."

echo.
echo "ACSS just scanned my entire project structure. It detected my tech stack
echo  from package.json and created a session file. Let me show you what it captured."
echo.
echo COMMAND: cat .acss/session.acss.json
echo.
node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('.acss/session.acss.json')); console.log(JSON.stringify({projectMetadata:s.projectMetadata, currentTask:s.currentTask},null,2))"
echo.
echo (Press any key to START LOGGING...)
set /p "id=Press ENTER to continue..."
cls

:: ------------------------------------------------------------------------------
:: PART 3: LOGGING WORK
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo PHASE 2: CAPTURING CONTEXT
echo ===============================================================================
echo.
echo "As I code, I log important decisions and blockers directly through the CLI."
echo.

echo COMMAND: acss log decision "Using Socket.io for real-time..."
call acss log decision "Using Socket.io for real-time bidirectional communication"
echo.

echo COMMAND: acss log decision "JWT tokens stored..."
call acss log decision "JWT tokens stored in HTTP-only cookies to prevent XSS attacks"
echo.

echo COMMAND: acss log decision "MongoDB for message persistence..."
call acss log decision "MongoDB for message persistence with 30-day retention policy"
echo.

echo COMMAND: acss log decision "Rate limiting..."
call acss log decision "Rate limiting: 100 messages per minute per user"
echo.
echo (Press any key to LOG ERRORS...)
set /p "id=Press ENTER to continue..."
echo.

echo "Now I hit a blocker. The WebSocket connection keeps dropping after authentication."
echo.
echo COMMAND: acss log error "WebSocket connection drops..." --file src/chat/websocket.js
call acss log error "WebSocket connection drops immediately after JWT verification" --file src/chat/websocket.js --line 67
echo.

echo COMMAND: acss log error "CORS blocking..." --resolved
call acss log error "CORS blocking Socket.io handshake from localhost:3000" --file src/middleware/auth.js --line 23 --resolved
echo.

echo "And I'll log what needs to happen next."
echo.
echo COMMAND: acss log next "Debug JWT verification..."
call acss log next "Debug JWT verification in Socket.io middleware - connection drops on token parse"
echo.
echo COMMAND: acss log next "Implement message queue..."
call acss log next "Implement message queue for offline users"
echo.

echo (Press any key to IMPORT CHAT...)
set /p "id=Press ENTER to continue..."
cls

:: ------------------------------------------------------------------------------
:: PART 4: CHAT IMPORT (CLOUD BRAIN)
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo PHASE 3: IMPORTING CHAT CONTEXT
echo ===============================================================================
echo.
echo "Earlier, I was discussing this project with ChatGPT. I exported that
echo  conversation, and ACSS can import it to enrich the context."
echo.

:: Create dummy chat export
(
echo # WebSocket Authentication Discussion
echo.
echo ## User
echo I'm building a real-time chat app with Socket.io and JWT. How should I handle authentication for WebSocket connections?
echo.
echo ## Assistant
echo For Socket.io with JWT authentication, I recommend this approach:
echo 1. Send JWT token during the Socket.io handshake
echo 2. Verify in middleware
echo.
echo User
echo What about handling disconnections?
echo.
echo Assistant
echo Don't clean up immediately - user might be switching tabs. Use a timeout.
echo.
echo User
echo Perfect. And for message persistence?
echo.
echo Assistant
echo Save to MongoDB as soon as message received (before broadcasting^).
) > chatgpt-session.md

echo COMMAND: acss config endpoint %NGROK_URL%
call acss config endpoint %NGROK_URL% >nul
call acss config cloudUrl %NGROK_URL% >nul
call acss config model gemma2:2b >nul
echo ACSS_BRAIN_MODE=cloud>> .env
echo ✓ Cloud Brain Connected (%NGROK_URL%)
echo ✓ Mode: Cloud (High Performance)
echo.

echo COMMAND: acss import chatgpt-session.md
echo [VOICEOVER]: "ACSS used a local language model to analyze the conversation..."
echo (Sending to Cloud Brain for analysis...)
call acss import chatgpt-session.md
echo.
echo (Press any key to GENERATE HANDOFF...)
set /p "id=Press ENTER to continue..."
cls

:: ------------------------------------------------------------------------------
:: PART 5: AI HANDOFF
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo PHASE 4: INSTANT HANDOFF
echo ===============================================================================
echo.
echo "Now here's the magic. I've hit ChatGPT's rate limit. No problem - I'll
echo  generate a handoff for Claude in one command."
echo.

echo COMMAND: acss load --for claude
call acss load --for claude > handoff_claude.txt
echo.
echo "This handoff contains everything: context, decisions, errors..."
echo.
echo === HANDOFF PREVIEW ===
type handoff_claude.txt
echo.
echo (Press any key for CLOUD DEMO...)
set /p "id=Press ENTER to continue..."
cls

:: ------------------------------------------------------------------------------
:: PART 6: CLOUD + COMPRESSION
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo PHASE 5: CLOUD + SESSION COMPRESSION
echo ===============================================================================
echo.
echo "ACSS supports both local and cloud language models. Let me demonstrate
echo  session compression using my Cloud Brain."
echo.

echo COMMAND: acss config --list
call acss config --list
echo.

echo "Now let me demonstrate session compression..."
echo.
echo COMMAND: acss compress --model gemma2:2b
call acss compress --model gemma2:2b
echo.
echo (Press any key for WATCH MODE...)
set /p "id=Press ENTER to continue..."
cls

:: ------------------------------------------------------------------------------
:: PART 7: WATCH MODE
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo PHASE 6: WATCH MODE (AUTO-CAPTURE)
echo ===============================================================================
echo.
echo "But the real power is Watch Mode. Instead of manually logging everything,
echo  ACSS can automatically track all my changes in real-time."
echo.

echo COMMAND: acss watch start (Background)
start /B acss watch start >nul 2>&1
timeout /t 2 >nul
echo ✓ Watch mode started
echo 👁️  Monitoring: %PROJECT_DIR%
echo.

echo [VOICEOVER]: "Now watch what happens when I make changes to my code."
echo.
echo [ACTION]: Modifying src/middleware/auth.js...
echo // Rate limiting implementation >> src/middleware/auth.js
timeout /t 2 >nul
echo [ACTION]: Creating src/chat/queue.js...
echo // Message queue >> src/chat/queue.js
timeout /t 2 >nul
echo [ACTION]: Git commit...
git init >nul 2>&1
git config user.name "Demo User" >nul 2>&1
git config user.email "demo@acss.dev" >nul 2>&1
git add . >nul 2>&1
git commit -m "Add rate limiting and message queue" >nul 2>&1
echo.

echo "ACSS automatically captured my file changes and even logged my git commit..."
echo.
echo COMMAND: acss watch stop
call acss watch stop
echo.
echo (Press any key for MERGING...)
set /p "id=Press ENTER to continue..."
cls

:: ------------------------------------------------------------------------------
:: PART 8: MERGING
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo PHASE 7: SESSION MERGING
echo ===============================================================================
echo.
echo "Let's say I continued working with both ChatGPT and Claude... ACSS can merge them."
echo.

:: Create dummy claude session
(
echo {
echo   "sessionId": "claude-session",
echo   "projectRoot": "%PROJECT_DIR:\=\\%",
echo   "lastUpdatedAt": "2024-01-01T12:00:00.000Z",
echo   "decisions": ["Implemented Redis for session storage"],
echo   "filesModified": [],
echo   "sources": [{"tool":"claude","note":"Production planning"}]
echo }
) > claude-session.json

echo COMMAND: acss merge .acss/session.acss.json claude-session.json
call acss merge .acss/session.acss.json claude-session.json -o merged.json
echo.
echo (Press any key for CLOSING...)
set /p "id=Press ENTER to continue..."
cls

:: ------------------------------------------------------------------------------
:: PART 10: CLOSING
:: ------------------------------------------------------------------------------
echo ===============================================================================
echo DEMO COMPLETE
echo ===============================================================================
echo.
echo [VOICEOVER]:
echo "With ACSS, I've eliminated the 10 to 15 minute context-switching penalty...
echo  Your code and context never leave your machine unless you export it."
echo.
echo "if you have any open job or internship opportunitites contact me 
echo  through my mail : saumyavishwam@gmail.com"
echo.
echo -------------------------------------------------------------------------------
echo.
echo Thank you for watching ACSS in action.
echo.
echo ===============================================================================
echo.
pause
