# ACSS: AI Coding Session State Protocol 🧠💾

> **"Stop repeating yourself to every new AI agent."**

ACSS is a lightweight, portable protocol that captures the *intent*, *decisions*, and *context* of a coding session. It bridges the gap between human developers and AI assistants (or between two AI assistants), preventing "Context Rot" when switching tools.

![Extension Demo](vscode-extension/media/demo_placeholder.png)

## 🚨 The Problem

You're building a feature with ChatGPT. You switch to Claude for a second opinion. You ask a local LLM to refactor a file.
In every new chat, you have to paste:
1.  "I'm building a React app..."
2.  "We decided to use Tailwind, not CSS Modules..."
3.  "The API key is in `.env`, don't expose it..."

**Context Rot** sets in. The new AI guesses wrong. You waste time re-explaining architecture.

## 💡 The Solution

**ACSS (AI Coding Session State)** creates a `session.acss.json` file in your repo. It tracks:
-   **Intent**: "Implementing the Login Flow"
-   **Status**: `in_progress`
-   **Decisions**: "Use JWT for auth", "Pin React version to 18"
-   **Blockers**: "Pending API specs from backend team"

When you hand off to a new AI, you don't paste code. You paste the **ACSS Handoff Prompt**. The AI instantly "logs in" to your mindset.

## 🏗️ Build & Install (Developer Guide)

This is a **monorepo**. Follow these steps to set up the tools from scratch.

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Build the Core Library
The CLI and Extension both depend on `@acss/core`.
```bash
cd packages/core
npm install
npm run build
```

### 2. Install the CLI
You can install the CLI globally from the source:
```bash
cd ../../cli
npm install
npm run build
npm link # Makes 'acss' available globally
```
*Now you can run `acss --help` anywhere.*

### 3. Run the VS Code Extension
1. Open the project root in VS Code.
2. Go to "Run and Debug" (Ctrl+Shift+D).
3. Select **"Extension"** and hit Play (F5).
4. A new "Extension Development Host" window will open.

---

## ✨ Key Features

-   **cli** (`@acss/cli`):
    -   `acss init`: Start tracking a session in seconds.
    -   `acss log`: Record decisions, errors, and next steps as you work.
    -   `acss load`: Generate a **human-readable prompt** ("Take over this session...") for ChatGPT/Claude/Gemini.
    -   `acss compress`: Use a local LLM (Ollama) to shrink your session history without losing context.
-   **VS Code Extension**:
    -   Real-time **Sidebar** that syncs with the CLI.
    -   See your "Next Steps" and "Decisions" always pinned to your IDE.

## 🚀 Quick Start (User Mode)

### 1. Initialize a Project
```bash
cd my-cool-app
acss init --name "SuperApp" --tech "Next.js, Supabase" --intent "Building MVP"
```
*Creates `.acss/session.acss.json`*

### 2. Work & Log
```bash
# Log a decision so the NEXT AI knows why you did this
acss log decision "Chose Zod for validation to ensure type safety"

# Log a blocker
acss log error "Database connection timeout in dev environment"

# Log what to do next
acss log next "Implement user profile page"
```

### 3. The "Handoff" (Magic Moment) 🪄
When you switch to a new AI chat:
```bash
# Generates a perfect context prompt
acss load --for chatgpt > handoff.txt
```
**Paste `handoff.txt` into ChatGPT.** It will say:
> *"I see we're building SuperApp with Next.js. I blocked on the DB connection. I see you chose Zod. Let's work on the profile page."*

## 📦 Monorepo Structure

-   `packages/core`: The pure TypeScript library for ACSS logic (Parsing, Validation, Compression).
-   `cli`: The command-line interface (uses `core`).
-   `vscode-extension`: The editor companion (uses `core` type definitions).

## 🛠️ Advanced Usage

### Local LLM Compression
Running out of context window? Compress your session history using a local model (Ollama):
```bash
acss compress --model llama3
```

### Live Stream to IDE
Connect your CLI to the VS Code extension:
```bash
acss stream
```
*Your decisions appear in the sidebar instantly.*

---

*Verified Hackathon Submission - 2026*
