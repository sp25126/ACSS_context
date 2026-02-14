import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import { ContextEvent } from '@acss/core';

export class GitObserver {
    private projectRoot: string;
    private onEvent: (event: ContextEvent) => Promise<void>;
    private watcher: any = null;
    private lastCommitHash: string = '';

    constructor(
        projectRoot: string,
        onEvent: (event: ContextEvent) => Promise<void>
    ) {
        this.projectRoot = projectRoot;
        this.onEvent = onEvent;
    }

    async start() {
        const gitDir = path.join(this.projectRoot, '.git');
        const gitHeadPath = path.join(gitDir, 'logs', 'HEAD');

        // Check every 2 seconds for git init if it doesn't exist
        if (!await fs.pathExists(gitHeadPath)) {
            console.log('⏳ Waiting for Git initialization...');
            const interval = setInterval(async () => {
                if (await fs.pathExists(gitHeadPath)) {
                    console.log('✅ Git detected! Starting observer.');
                    clearInterval(interval);
                    this.initWatcher(gitHeadPath);
                }
            }, 2000);
            return;
        }

        this.initWatcher(gitHeadPath);
    }

    private initWatcher(gitHeadPath: string) {
        console.log('👀 Starting Git Observer (Chokidar)...');

        this.watcher = chokidar.watch(gitHeadPath, {
            persistent: true,
            ignoreInitial: false,
            awaitWriteFinish: {
                stabilityThreshold: 1000,
                pollInterval: 100
            }
        });

        this.watcher.on('all', async (event: string) => {
            if (event === 'add' || event === 'change') {
                console.log(`[GitObserver] Event: ${event}`);
                await this.checkNewCommit(gitHeadPath);
            }
        });
    }

    private async getLastCommitHash(logPath: string): Promise<string> {
        try {
            if (!await fs.pathExists(logPath)) return '';
            const logs = await fs.readFile(logPath, 'utf8');
            const lines = logs.trim().split('\n').filter(l => l.trim() !== '');
            if (lines.length === 0) return '';
            const lastLine = lines[lines.length - 1];
            const parts = lastLine.split(' ');
            return parts[1] || '';
        } catch (e) {
            return '';
        }
    }

    private async checkNewCommit(logPath: string) {
        try {
            const logs = await fs.readFile(logPath, 'utf8');
            const lines = logs.trim().split('\n').filter(l => l.trim() !== '');
            if (lines.length === 0) return;
            const lastLine = lines[lines.length - 1];

            // Format: old_hash new_hash Name <email> timestamp timezone message
            const match = lastLine.match(/^(\S+) (\S+) .*? \d+ [+-]\d+\t(.*)$/);
            if (!match) return;

            const newHash = match[2];
            const message = match[3];

            if (newHash !== this.lastCommitHash) {
                console.log(`📝 Detected new commit: ${message} (Hash: ${newHash})`);
                this.lastCommitHash = newHash;

                await this.onEvent({
                    type: 'git',
                    payload: { message }
                });
            }
        } catch (error) {
            console.error('Error reading git logs:', error);
        }
    }

    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
    }
}
