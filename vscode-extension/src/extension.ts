import * as vscode from 'vscode';
import { SessionSidebarProvider } from './SessionSidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new SessionSidebarProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SessionSidebarProvider.viewType,
            provider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('acss.showSessionView', () => {
            vscode.commands.executeCommand('workbench.view.extension.acss-session-explorer');
        })
    );
}

export function deactivate() { }
