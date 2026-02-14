import chokidar from 'chokidar';
import path from 'path';
import { ContextEvent } from '@acss/core';

export class FileWatcher {
    private watcher: any = null; // using any to avoid namespace issues with chokidar versions
    private projectRoot: string;
    private onEvent: (event: ContextEvent) => Promise<void>;

    constructor(
        projectRoot: string,
        onEvent: (event: ContextEvent) => Promise<void>
    ) {
        this.projectRoot = projectRoot;
        this.onEvent = onEvent;
    }

    start() {
        console.log('👀 Starting File Watcher...');
        this.watcher = chokidar.watch(this.projectRoot, {
            ignored: [
                /(^|[\/\\])\../, // ignore dotfiles
                '**/node_modules/**',
                '**/.git/**',
                '**/.acss/**',
                '**/dist/**',
                '**/coverage/**'
            ],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this.watcher
            .on('add', (path: string) => this.handleFileChange('add', path))
            .on('change', (path: string) => this.handleFileChange('change', path))
            .on('unlink', (path: string) => this.handleFileChange('unlink', path));
    }

    private async handleFileChange(event: 'add' | 'change' | 'unlink', filePath: string) {
        try {
            const relativePath = path.relative(this.projectRoot, filePath);
            await this.onEvent({
                type: 'file',
                payload: {
                    path: relativePath,
                    changeType: event === 'add' ? 'created' : event === 'unlink' ? 'deleted' : 'modified',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error handling file change:', error);
        }
    }

    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
    }
}
