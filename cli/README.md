
# @acss/cli

The command-line interface for the ACSS protocol. Use it to initialize sessions, log decisions, and generate handoff prompts.

## Installation

```bash
npm install -g @acss/cli
```

## Commands

### `acss init`
Initialize a new session in your current directory.
```bash
acss init --name "MyProject" --tech "Node, React" --intent "Feature X"
```

### `acss log`
Record your development journey. This is what the next AI reads.
-   `acss log decision "Chose MongoDB for flexibility"`
-   `acss log error "API rate limit hit on /users endpoint"`
-   `acss log next "Cache the user profile response"`

### `acss load`
The core feature. Generates a prompt for ChatGPT/Claude/Gemini.
```bash
# Print to stdout
acss load --for chatgpt

# Save to file (Windows safe!)
acss load --for claude --output handoff.txt
```

### `acss compress`
Use a local LLM (defaults to Ollama) to summarize long sessions.
```bash
acss compress --model llama3
```

### `acss stream`
Start a WebSocket server to broadcast session state to the VS Code Extension.
```bash
acss stream
```

## Configuration

ACSS uses the user's standard configuration directory logic (provided by `conf`).

### Locations
- **Windows**: `%APPDATA%\acss-tool\config.json`
- **Mac/Linux**: `~/.config/acss-tool/config.json`

### Managing Config
You can switch your local LLM model or endpoint globally:

```bash
# Change the model (default: gemma2:2b)
acss config model llama3

# Change the endpoint (default: http://localhost:11434/api/generate)
acss config endpoint http://my-ollama-server:11434/api/generate

# View current config
acss config

# Reset to defaults (if things break)
# Manually delete the config.json file listed above.
```
