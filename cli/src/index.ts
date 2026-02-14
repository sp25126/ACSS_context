#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { createEmptySession, addDecision, addError, addNextStep, updateTask, generatePrompt, PromptTarget, compressSession, mergeSessions, AcssSession } from '@acss/core';
import { startStreamServer } from './stream-server';
import { getConfig, setConfig } from './config-manager';

const program = new Command();
const ACSS_DIR = '.acss';
const SESSION_FILE = 'session.acss.json';

program
    .name('acss')
    .description('AI Coding Session State (ACSS) Capture Tool')
    .version('0.1.0');

async function loadSession() {
    const sessionPath = path.join(process.cwd(), ACSS_DIR, SESSION_FILE);
    if (!(await fs.pathExists(sessionPath))) {
        console.error(chalk.red('✘ No ACSS session found. Run "acss init" first.'));
        process.exit(1);
    }
    return { session: await fs.readJson(sessionPath), sessionPath };
}

async function saveSession(sessionPath: string, session: any) {
    const { validateSession } = require('@acss/core');
    const validation = validateSession(session);
    if (!validation.valid) {
        console.error(chalk.red('✖ Session validation failed:'));
        validation.errors.forEach((err: any) => console.error(chalk.yellow(`  - ${err.message}`)));
        throw new Error('Invalid ACSS session state');
    }
    await fs.writeJson(sessionPath, session, { spaces: 2 });
}

program
    .command('init')
    .description('Initialize ACSS session in current project')
    .option('-n, --name <name>', 'Project name')
    .option('-t, --tech <stack>', 'Tech stack (comma-separated)')
    .option('-e, --entry <paths>', 'Entry points (comma-separated)')
    .option('-i, --intent <text>', 'Current intent')
    .action(async (options) => {
        const projectRoot = process.cwd();
        let answers: any = {};

        if (options.name && options.tech && options.entry && options.intent) {
            answers = {
                name: options.name,
                techStack: options.tech.split(',').map((s: string) => s.trim()),
                entryPoints: options.entry.split(',').map((s: string) => s.trim()),
                intent: options.intent
            };
        } else {
            const { default: inquirer } = await import('inquirer');
            answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Project name:',
                    default: options.name || path.basename(projectRoot),
                },
                {
                    type: 'input',
                    name: 'techStack',
                    message: 'Tech stack (comma-separated):',
                    default: options.tech,
                    filter: (input: string) => input.split(',').map(s => s.trim()).filter(s => s !== ''),
                },
                {
                    type: 'input',
                    name: 'entryPoints',
                    message: 'Entry points (comma-separated paths):',
                    default: options.entry,
                    filter: (input: string) => input.split(',').map(s => s.trim()).filter(s => s !== ''),
                },
                {
                    type: 'input',
                    name: 'intent',
                    message: 'Current task intent:',
                    default: options.intent || 'Starting development',
                }
            ]);
        }

        const sessionId = Math.random().toString(36).substring(7);
        let session = createEmptySession(sessionId, projectRoot, {
            name: answers.name,
            techStack: answers.techStack,
            entryPoints: answers.entryPoints,
        });

        session = updateTask(session, {
            intent: answers.intent,
            status: 'in_progress'
        });

        const sessionDirPath = path.join(projectRoot, ACSS_DIR);
        await fs.ensureDir(sessionDirPath);

        const sessionFilePath = path.join(sessionDirPath, SESSION_FILE);
        await saveSession(sessionFilePath, session);

        console.log(chalk.green(`✔ Initialized ACSS session in ${path.join(ACSS_DIR, SESSION_FILE)}`));
    });

const log = program.command('log').description('Log session events');

log
    .command('decision')
    .description('Log a technical decision')
    .argument('<text>', 'The decision description')
    .action(async (text) => {
        const { session, sessionPath } = await loadSession();
        const updated = addDecision(session, text);
        await saveSession(sessionPath, updated);
        console.log(chalk.blue(`✔ Decision logged: ${text}`));
    });

log
    .command('error')
    .description('Log an error encountered')
    .argument('<message>', 'Error message')
    .option('-f, --file <path>', 'File where error occurred')
    .option('-l, --line <number>', 'Line number', parseInt)
    .option('-r, --resolved <boolean>', 'Current resolution status', (v) => v === 'true', false)
    .action(async (message, options) => {
        const { session, sessionPath } = await loadSession();
        const updated = addError(session, {
            message,
            file: options.file,
            line: options.line,
            resolved: options.resolved
        });
        await saveSession(sessionPath, updated);
        console.log(chalk.red(`✔ Error logged: ${message}`));
    });

log
    .command('next')
    .description('Log a next step')
    .argument('<text>', 'Description of the next step')
    .action(async (text) => {
        const { session, sessionPath } = await loadSession();
        const updated = addNextStep(session, text);
        await saveSession(sessionPath, updated);
        console.log(chalk.cyan(`✔ Next step logged: ${text}`));
    });

program
    .command('merge')
    .argument('<files...>', 'ACSS session files to merge')
    .description('Merge multiple ACSS session files')
    .option('-o, --output <path>', 'Output file path', 'merged.acss.json')
    .action(async (files, options) => {
        try {
            const sessions: AcssSession[] = [];
            for (const file of files) {
                const filePath = path.resolve(process.cwd(), file);
                if (await fs.pathExists(filePath)) {
                    const session = await fs.readJson(filePath);
                    sessions.push(session);
                } else {
                    console.warn(chalk.yellow(`⚠ File not found: ${file}`));
                }
            }

            if (sessions.length === 0) {
                console.error(chalk.red('✖ No valid session files found to merge.'));
                process.exit(1);
            }

            console.log(chalk.blue(`ℹ Merging ${sessions.length} sessions...`));
            const merged = mergeSessions(sessions);
            const outputPath = path.resolve(process.cwd(), options.output);

            // Re-use saveSession to enforce validation
            await saveSession(outputPath, merged);

            console.log(chalk.green(`✔ Merged session saved to ${options.output}`));
        } catch (error) {
            console.error(chalk.red(`✖ Merge failed: ${error instanceof Error ? error.message : String(error)}`));
            if (process.env.DEBUG) {
                console.error(error);
            }
            process.exit(1);
        }
    });

program
    .command('stream')
    .description('Start a live session streaming server')
    .option('-p, --port <number>', 'Port to run the WebSocket server on', '3000')
    .action(async (options) => {
        const sessionPath = path.resolve(process.cwd(), ACSS_DIR, SESSION_FILE);
        const port = parseInt(options.port);

        if (!await fs.pathExists(sessionPath)) {
            console.error(chalk.red(`✖ Session file not found at ${sessionPath}. Run 'acss init' first.`));
            process.exit(1);
        }

        startStreamServer(sessionPath, port);
    });

program
    .command('config')
    .description('Manage ACSS configuration (get/set defaults)')
    .argument('[key]', 'Configuration key (model, endpoint, author)')
    .argument('[value]', 'Value to set')
    .action((key, value) => {
        if (!key) {
            console.log(chalk.bold('Current Configuration:'));
            console.log(getConfig());
            return;
        }
        if (value) {
            setConfig(key, value);
            console.log(chalk.green(`✔ Set ${key} to ${value}`));
        } else {
            console.log(chalk.blue(`${key}: ${getConfig(key)}`));
        }
    });

program
    .command('export')
    .description('Export session state (prints to stdout by default)')
    .argument('[output]', 'Output file path (optional)')
    .option('-p, --pretty', 'Pretty-print the JSON output', false)
    .action(async (output, options) => {
        const { session } = await loadSession();

        // Validate session
        const { validateSession } = require('@acss/core');
        const validation = validateSession(session);
        if (!validation.valid) {
            console.error(chalk.red('✘ Invalid session state detected.'));
            validation.errors.forEach((err: any) => console.error(chalk.yellow(`  - ${err.message}`)));
            process.exit(1);
        }

        const outputJson = JSON.stringify(session, null, options.pretty ? 2 : 0);

        if (output) {
            const outputPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);
            await fs.writeFile(outputPath, outputJson);
            console.log(chalk.green(`✔ Session exported to ${output}`));
        } else {
            process.stdout.write(outputJson + '\n');
        }
    });

program
    .command('load')
    .description('Load session and generate LLM handoff prompt')
    .option('-f, --for <target>', 'Target LLM (chatgpt, claude, gemini, local, other)', 'other')
    .option('-m, --max-tokens <number>', 'Maximum prompt length in tokens (approximate)', parseInt)
    .option('-o, --output <path>', 'Output file path')
    .action(async (options) => {
        try {
            const { session } = await loadSession();
            const prompt = generatePrompt(session, options.for as PromptTarget, options.maxTokens);

            if (options.output) {
                const outputPath = path.isAbsolute(options.output) ? options.output : path.join(process.cwd(), options.output);
                await fs.writeFile(outputPath, prompt);
                console.log(chalk.green(`✔ Handoff prompt saved to ${options.output}`));
            } else {
                process.stdout.write(prompt + '\n');
            }
        } catch (error) {
            console.error(chalk.red(`✖ Failed to load session or generate prompt: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

program
    .command('compress')
    .description('Generate compressed session summary using local LLM')
    .option('-m, --model <name>', 'Local LLM model name', getConfig('model'))
    .option('-e, --endpoint <url>', 'Local LLM API endpoint', getConfig('endpoint'))
    .action(async (options) => {
        const { session, sessionPath } = await loadSession();
        console.log(chalk.blue('ℹ Compressing session using local LLM...'));
        try {
            const compressed = await compressSession(session, {
                model: options.model,
                endpoint: options.endpoint
            });
            await saveSession(sessionPath, compressed);
            console.log(chalk.green('✔ Session compressed successfully.'));
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                console.error(chalk.red(`✖ Connection refused to local LLM at ${options.endpoint}.`));
                console.error(chalk.yellow('  ➜ Make sure Ollama/Local LLM is running (e.g., "ollama serve").'));
                console.error(chalk.yellow('  ➜ Or update config with "acss config endpoint <url>".'));
            } else {
                console.error(chalk.red(`✖ Compression failed: ${error instanceof Error ? error.message : String(error)}`));
            }
            process.exit(1);
        }
    });

program.parse();
