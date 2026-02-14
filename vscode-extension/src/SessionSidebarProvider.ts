import * as vscode from 'vscode';

export class SessionSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'acss.sessionView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css')
        );

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ACSS Live Session</title>
                <link href="${styleUri}" rel="stylesheet">
            </head>
            <body>
                <div class="header">
                    <div class="brand">
                        <span>🧠</span> ACSS
                    </div>
                    <div id="connection-badge" class="disconnected">Offline</div>
                </div>

                <div class="section">
                    <div class="label">Current Focus</div>
                    <div class="card">
                        <div id="task-intent" class="loading-pulse">Waiting for stream...</div>
                        <div style="margin-top: 8px;">
                             <span id="task-status"></span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="label">Decisions Log</div>
                    <div id="decisions-list"></div>
                </div>

                <div class="section">
                    <div class="label">Next Actions</div>
                    <div id="steps-list"></div>
                </div>

                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}
