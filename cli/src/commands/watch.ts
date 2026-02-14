import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import { saveSession, loadSession, ACSS_DIR, SESSION_FILE } from '../index';
import { FileWatcher } from '../services/FileWatcher';
import { GitObserver } from '../services/GitObserver';

const PID_FILE = 'watch.pid';

export function registerWatchCommand(program: Command) {
    const watch = program
        .command('watch')
        .description('Start auto-context logger (File Watcher + Git Observer)');

    watch
        .command('start')
        .description('Start the watcher in the background')
        .action(async () => {
            const projectRoot = process.cwd();
            const pidPath = path.join(projectRoot, ACSS_DIR, PID_FILE);

            if (await fs.pathExists(pidPath)) {
                const pid = await fs.readFile(pidPath, 'utf8');
                try {
                    process.kill(parseInt(pid), 0);
                    console.log(chalk.yellow(`⚠ Watcher is already running (PID: ${pid})`));
                    return;
                } catch (e) {
                    // Process doesn't exist, clean up stale PID file
                    await fs.remove(pidPath);
                }
            }

            console.log(chalk.cyan('🚀 Starting Auto Context Logger in background...'));

            const logPath = path.join(projectRoot, ACSS_DIR, 'watch.log');
            await fs.ensureDir(path.dirname(logPath));
            const logStream = fs.openSync(logPath, 'a');

            // Spawn detached process
            const child = spawn(process.argv[0], [process.argv[1], 'watch', 'service'], {
                cwd: projectRoot,
                detached: true,
                stdio: ['ignore', logStream, logStream]
            });

            child.unref();

            if (child.pid) {
                await fs.ensureDir(path.join(projectRoot, ACSS_DIR));
                await fs.writeFile(pidPath, child.pid.toString());
                console.log(chalk.green('✓ Watch mode started'));
                console.log(chalk.dim(`👁️  Monitoring: ${projectRoot}`));
                console.log(chalk.dim(`📝 Tracking: file changes, git commits`));
                console.log(chalk.dim(`💾 Session: ${path.join(ACSS_DIR, SESSION_FILE)}`));
            } else {
                console.error(chalk.red('✖ Failed to start background worker.'));
            }
        });

    watch
        .command('stop')
        .description('Stop the background watcher')
        .action(async () => {
            const projectRoot = process.cwd();
            const pidPath = path.join(projectRoot, ACSS_DIR, PID_FILE);

            if (!(await fs.pathExists(pidPath))) {
                console.log(chalk.yellow('⚠ No active watcher found.'));
                return;
            }

            const pid = parseInt(await fs.readFile(pidPath, 'utf8'));
            try {
                process.kill(pid, 'SIGINT');
                console.log(chalk.green('✓ Watch mode stopped'));
                // The service command handles PID file removal on SIGINT
            } catch (e) {
                console.error(chalk.red(`✖ Failed to stop process ${pid}. It might have already exited.`));
                await fs.remove(pidPath);
            }
        });

    watch
        .command('service', { hidden: true })
        .description('The actual watcher service (foreground)')
        .action(async () => {
            const projectRoot = process.cwd();
            const pidPath = path.join(projectRoot, ACSS_DIR, PID_FILE);

            const { session, sessionPath: currentSessionPath } = await loadSession();
            const { LiveContextManager } = require('@acss/core');

            const contextManager = new LiveContextManager(
                session,
                async (updated: any) => {
                    await saveSession(currentSessionPath, updated);
                }
            );

            const fileWatcher = new FileWatcher(projectRoot, (e) => contextManager.handleEvent(e));
            const gitObserver = new GitObserver(projectRoot, (e) => contextManager.handleEvent(e));

            fileWatcher.start();
            await gitObserver.start();

            process.stdin.resume();

            const cleanup = async () => {
                await fileWatcher.stop();
                gitObserver.stop();
                await fs.remove(pidPath);
                process.exit(0);
            };

            process.on('SIGINT', cleanup);
            process.on('SIGTERM', cleanup);
        });
}
