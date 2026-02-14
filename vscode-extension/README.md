# ACSS Companion for VS Code

The official VS Code extension for **ACSS (AI Coding Session State)**. It visualizes your current session state directly in the editor, ensuring you never lose context.

![Connected State](../.gemini/antigravity/brain/c04f2bec-603b-4e20-9a8d-9b1ec9bb0faa/clean_install_success_1771038250734.png)

## ⚡ Features

-   **Real-Time Sync**: Connects to the ACSS CLI via WebSocket (`ws://localhost:3000`).
-   **Always-On Context**: Keeps your "Current Intent", "Decisions", and "Next Steps" pinned to the sidebar.
-   **Resilient**: Handles disconnections and server restarts gracefully with visual status indicators.

## 🚀 How to Run (Development)

Since this is currently part of the monorepo, follow these steps to run it:

1.  **Build Core**: Ensure `@acss/core` is built.
    ```bash
    cd ../packages/core
    npm run build
    ```
2.  **Open in VS Code**: Open the **root** of the monorepo in VS Code.
3.  **Launch**:
    -   Press `F5` (or go to **Run and Debug** > **Extension**).
    -   A new "Extension Development Host" window will open.

## 📖 Usage Guide

Once the extension is running in the host window:

1.  **Open a Project**: Open any folder where you want to work.
2.  **Initialize ACSS**:
    ```bash
    # In the integrated terminal
    acss init --name "MyProject"
    ```
3.  **Start the Stream**:
    ```bash
    acss stream
    ```
    *This starts the WebSocket server on port 3000.*

4.  **Open the Sidebar**:
    -   Click the **ACSS** icon in the Activity Bar.
    -   You will see the status turn **Green (Connected)**.
    -   Your session data will appear instantly.

## 📸 Functionality

### Connected State
When `acss stream` is running:
-   **Badge**: `Connected` (Green).
-   **Data**: Live updates from `session.acss.json`.
-   **Latency**: < 50ms.

### Disconnected State
If you stop `acss stream` or the server crashes:
-   **Badge**: `Disconnected` (Red) or `Offline` (Dimmed).
-   **UI**: Shows a "Retry Connection" button.
-   **Action**: Click "Retry" once you restart the CLI stream.

![Disconnected State](../.gemini/antigravity/brain/c04f2bec-603b-4e20-9a8d-9b1ec9bb0faa/sidebar_disconnected_state_1771036886257.png)

## 🔧 Troubleshooting

-   **"Connection Refused"**: Ensure `acss stream` is running in your terminal.
-   **"No Data"**: Make sure you ran `acss init` in the project root.
