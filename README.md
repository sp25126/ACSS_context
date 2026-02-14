# ACSS: AI Coding Session State Protocol 🧠💾

> **"Stop repeating yourself to every new AI agent."**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)

ACSS is a lightweight, portable protocol that captures the *intent*, *decisions*, and *context* of a coding session. It bridges the gap between human developers and AI assistants (or between two AI assistants), preventing "Context Rot" when switching tools.

---

## 🚀 Quick Start (Watch the Demo)

I have included a full demo video 

```batch
https://youtu.be/GgGUTj-WXK8
```

This script simulates a full development lifecycle:
1.  **Project Initialization**: Auto-detects tech stack.
2.  **Context Logging**: captures decisions & errors.
3.  **Chat Import**: Ingests ChatGPT/Claude conversations.
4.  **Instant Handoff**: Transfers context between AIs.
5.  **Watch Mode**: Real-time file tracking.

---

## 🏗️ What is ACSS?

ACSS captures your development flow by combining:
1.  **Complete Project Analysis**: Directory structure, file tree, and tech stack detection.
2.  **AI Conversation History**: Imports chats from ChatGPT, Claude, etc.
3.  **Real-time Context**: Watches file changes and git commits as you work.

The output is a structured, AI-optimized context (`.acss/session.acss.json`) that can be handed to *any* AI coding assistant.

---

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   npm (v8+)
*   Git

### Step 1: Install
Clone the repository and install dependencies:

```bash
git clone https://github.com/sp25126/ACSS_context.git
cd ACSS_context

# Install Core Logic
cd packages/core
npm install
npm run build

# Install CLI Tool
cd ../../cli
npm install
npm run build
npm link
```

### Step 2: Verification
Verify the installation by running:
```bash
acss --help
```

---

## 🔄 Core Workflows

### 1. Initialize a Project
Go to any project directory and run:
```bash
acss init
# ACSS will scan your project and create a session file.
```

### 2. Import Chat Context
Export your conversation from ChatGPT or Claude and import it:
```bash
acss import ./chat-export.json
```

### 3. Generate Handoff
Create a context-rich prompt for your next AI assistant:
```bash
acss load --for claude > handoff_claude.txt
```

### 4. Watch Mode (Real-time)
Automatically track file changes and git commits:
```bash
acss watch
```

---

## 📦 Data Structure

Your session state is stored in `.acss/session.acss.json`. It includes:
*   **Project Metadata**: `fileTree`, `techStack`, `totalFiles`.
*   **Current Task**: `intent`, `status`.
*   **History**: `decisions` (manual + git), `errorsEncountered`.
*   **Context**: `chatContext` (imported insights), `filesModified` (watch logs).

---

## 📬 Contact & Opportunities

**I am currently looking for Job / Internship opportunities.**

If you are interested in my work or would like to discuss potential collaborations, please reach out!

📧 **Email**: [saumyavishwam@gmail.com](mailto:saumyavishwam@gmail.com)
🔗 **GitHub**: [https://github.com/sp25126](https://github.com/sp25126)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
