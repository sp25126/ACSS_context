import { WebSocketServer, WebSocket } from 'ws';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export function startStreamServer(sessionPath: string, port: number = 3000) {
    let wss: WebSocketServer;

    try {
        wss = new WebSocketServer({ port });
    } catch (error: any) {
        if (error.code === 'EADDRINUSE') {
            console.error(chalk.red(`✖ Port ${port} is already in use.`));
            console.error(chalk.yellow(`  ➜ Try a different port with: acss stream -p <number>`));
        } else {
            console.error(chalk.red(`✖ Failed to start WebSocket server: ${error.message}`));
        }
        process.exit(1);
    }

    // Also handle async errors
    wss.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
            console.error(chalk.red(`✖ Port ${port} is already in use.`));
            console.error(chalk.yellow(`  ➜ Try a different port with: acss stream -p <number>`));
        } else {
            console.error(chalk.red(`✖ WebSocket server error: ${error.message}`));
        }
        process.exit(1);
    });

    console.log(chalk.blue(`📡 WebSocket server started on ws://localhost:${port}`));
    console.log(chalk.gray(`👀 Watching ${sessionPath} for changes...`));

    const broadcast = async () => {
        try {
            if (await fs.pathExists(sessionPath)) {
                const sessionData = await fs.readJson(sessionPath);
                const message = JSON.stringify(sessionData);

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
                console.log(chalk.green(`📢 Broadcasted update at ${new Date().toLocaleTimeString()}`));
            }
        } catch (error) {
            console.error(chalk.red(`✖ Failed to broadcast update: ${error}`));
        }
    };

    // Watch the file for changes
    fs.watch(path.dirname(sessionPath), (eventType, filename) => {
        if (filename === path.basename(sessionPath) && (eventType === 'change' || eventType === 'rename')) {
            broadcast();
        }
    });

    wss.on('connection', (ws) => {
        console.log(chalk.cyan('🔌 New client connected'));
        // Send initial state
        broadcast();

        ws.on('close', () => {
            console.log(chalk.yellow('🔌 Client disconnected'));
        });
    });

    return wss;
}
