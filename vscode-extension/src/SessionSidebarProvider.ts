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

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ACSS Live Session</title>
                <style>
                    body { font-family: sans-serif; padding: 10px; color: var(--vscode-foreground); }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .header h3 { margin: 0; }
                    #connection-badge { font-size: 0.7em; padding: 2px 6px; border-radius: 4px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
                    #connection-badge.connected { background: #4ec9b0; color: #000; }
                    #connection-badge.disconnected { background: var(--vscode-errorForeground); color: var(--vscode-button-foreground); }
                    .section { margin-bottom: 15px; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 10px; }
                    .label { font-weight: bold; font-size: 0.8em; opacity: 0.7; text-transform: uppercase; margin-bottom: 5px; }
                    .status { font-weight: bold; color: var(--vscode-peekViewResult-matchForeground); }
                    .decision-item, .step-item { font-size: 0.9em; margin-bottom: 4px; padding-left: 10px; border-left: 2px solid var(--vscode-button-background); }
                    .empty { opacity: 0.5; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>ACSS Overview</h3>
                    <div id="connection-badge" class="disconnected">Disconnected</div>
                </div>
                <div class="section">
                    <div class="label">Current Task</div>
                    <div id="task-intent">Waiting for stream...</div>
                    <div id="task-status" class="status"></div>
                </div>

                <div class="section">
                    <div class="label">Last Decisions</div>
                    <div id="decisions-list"></div>
                </div>

                <div class="section">
                    <div class="label">Next Steps</div>
                    <div id="steps-list"></div>
                </div>

                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}
