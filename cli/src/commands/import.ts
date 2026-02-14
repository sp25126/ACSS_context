import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { DocumentLoader, LLMService, saveSession, createEmptySession, mergeSessions } from '@acss/core';
import { AcssSession } from '@acss/core';
import dotenv from 'dotenv';
import ora from 'ora';

export function registerImportCommand(program: Command) {
    program
        .command('import <file>')
        .description('Import context from a file (PDF, DOCX, MD, TXT) using AI')
        .option('-m, --model <model>', 'LLM Model to use (default: gemma2:2b)')
        .action(async (file, options) => {
            // Load .env
            dotenv.config();

            const filePath = path.resolve(process.cwd(), file);
            if (!fs.existsSync(filePath)) {
                console.error(chalk.red(`✘ File not found: ${filePath}`));
                process.exit(1);
            }

            const spinner = ora(`Analyzing input: ${file}...`).start();

            try {
                // Determine Mode: Chat Ingest vs Doc Import
                let isChatExport = false;
                let chatData: any = null;

                if (path.extname(filePath).toLowerCase() === '.json') {
                    try {
                        const json = await fs.readJson(filePath);
                        // Heuristic: Is this a chat?
                        // ChatGPT export usually has 'conversation_id' or is an array of messages
                        // Simple check: is array and has 'role'/'content' OR has 'mapping' (chatgpt specific)
                        if (Array.isArray(json) && json.some(m => m.role && m.content)) {
                            isChatExport = true;
                            chatData = json;
                        } else if (json.mapping && json.title) {
                            // ChatGPT official export structure
                            isChatExport = true;
                            chatData = json;
                        }
                    } catch (e) {
                        // Not valid JSON, treat as text doc
                    }
                }

                // 1.5 Setup LLM Configuration
                const { getConfig } = require('../config-manager');
                const config = getConfig();
                const model = process.env.ACSS_MODEL || options.model || config.model || 'gemma2:2b';
                const endpoint = config.endpoint || 'http://localhost:11434';
                const cloudUrl = config.cloudUrl;
                const brainMode = config.brainMode || 'hybrid';

                // Ensure LLM Service is ready (Local/Cloud)
                if (brainMode !== 'cloud' && !cloudUrl) {
                    try {
                        await fetch(`${endpoint.replace('/api/generate', '')}/api/tags`);
                    } catch (e) {
                        spinner.text = 'Local AI service not running. Starting Ollama...';
                        const { spawn } = require('child_process');
                        const ollama = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' });
                        ollama.unref();

                        let retries = 0;
                        while (retries < 20) {
                            await new Promise(r => setTimeout(r, 1000));
                            try {
                                await fetch(`${endpoint.replace('/api/generate', '')}/api/tags`);
                                break;
                            } catch (err) {
                                retries++;
                            }
                        }
                    }
                }

                const llm = new LLMService({
                    cloudUrl: cloudUrl,
                    model: model,
                    brainMode: brainMode
                });

                if (isChatExport) {
                    spinner.text = 'Detected Chat Export. Fusing with project context...';

                    const { ChatIngestService } = require('@acss/core');
                    const { globby } = await import('globby');

                    // Get recursive file list for context fusion
                    const fileList = await globby(['**/*', '!node_modules', '!.git', '!.acss'], {
                        cwd: process.cwd(),
                        onlyFiles: true
                    });

                    const ingestService = new ChatIngestService(llm);

                    // Allow ingestService to handle the specific JSON structure
                    const { session, sessionPath } = await require('../index').loadSession();
                    const updates = await ingestService.ingestChat(chatData, session, fileList);

                    if (Object.keys(updates).length === 0) {
                        spinner.warn('Chat analysis completed but no clear code updates were found.');
                    } else {
                        const updatedSession = { ...session, ...updates, updatedAt: new Date().toISOString() };
                        await saveSession(sessionPath, updatedSession);
                        spinner.succeed('Chat fused into session successfully.');
                    }
                    return; // Done
                }

                // --- Standard Document Import Path ---
                spinner.text = 'Detected Document. Extracting context...';

                // 1. Load Document
                const loader = new DocumentLoader();
                const text = await loader.load(filePath);

                // 3. Construct Prompt
                const systemPrompt = `You are an expert software architect. Your goal is to extract structured coding context from unstructured text.
                
                You must output valid JSON matching this schema:
                {
                  "intent": "string (high-level goal)",
                  "decisions": ["string", "string"],
                  "techStack": ["string", "string"],
                  "blockers": ["string"],
                  "nextSteps": ["string"],
                  "summary": "string (short conversation overview)",
                  "keyInsights": ["string"]
                }
                
                Rules:
                - Extract specific technology choices into 'techStack'.
                - Extract agreed-upon architectural decisions into 'decisions'.
                - Extract any unsolved problems into 'blockers'.
                - Extract planned tasks into 'nextSteps'.
                - Return ONLY JSON. No markdown formatting.`;

                const userPrompt = `Here is the document content:\n\n${text}\n\nExtract the ACSS context.`;

                // 4. Generate
                const response = await llm.generate(userPrompt, systemPrompt);
                let cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();

                // Simple JSON Repair for truncated outputs
                if (!cleanJson.endsWith('}') && cleanJson.includes('{')) {
                    // Try to close open arrays/objects
                    const openBrackets = (cleanJson.match(/\[/g) || []).length;
                    const closeBrackets = (cleanJson.match(/\]/g) || []).length;
                    const openBraces = (cleanJson.match(/\{/g) || []).length;
                    const closeBraces = (cleanJson.match(/\}/g) || []).length;

                    for (let i = 0; i < (openBrackets - closeBrackets); i++) cleanJson += ']';
                    for (let i = 0; i < (openBraces - closeBraces); i++) cleanJson += '}';
                }

                let extractedData: any;
                try {
                    extractedData = JSON.parse(cleanJson);
                } catch (e) {
                    // Fallback: try to find the last complete JSON block
                    try {
                        const lastBrace = cleanJson.lastIndexOf('}');
                        if (lastBrace !== -1) {
                            extractedData = JSON.parse(cleanJson.substring(0, lastBrace + 1));
                        } else {
                            throw new Error('No JSON block found');
                        }
                    } catch (innerError) {
                        spinner.fail('AI returned invalid JSON (and repair failed).');
                        console.log(chalk.dim('--- RAW LLM OUTPUT ---'));
                        console.log(response);
                        console.log(chalk.dim('----------------------'));
                        process.exit(1);
                    }
                }

                spinner.succeed('Context extracted successfully.');

                // 5. Merge into current session
                const sessionPath = path.join(process.cwd(), '.acss', 'session.acss.json');
                let currentSession: AcssSession;

                if (fs.existsSync(sessionPath)) {
                    currentSession = await fs.readJson(sessionPath);
                } else {
                    // Auto-init if missing
                    currentSession = createEmptySession(
                        Math.random().toString(36).substring(7),
                        process.cwd(),
                        {
                            name: path.basename(process.cwd()),
                            techStack: [],
                            entryPoints: []
                        }
                    );
                }

                // Update Session Robustly
                if (extractedData.intent) currentSession.currentTask.intent = extractedData.intent;

                if (Array.isArray(extractedData.techStack)) {
                    currentSession.projectMetadata.techStack = [...new Set([...currentSession.projectMetadata.techStack, ...extractedData.techStack])];
                }
                if (Array.isArray(extractedData.decisions)) {
                    currentSession.decisions = [...new Set([...currentSession.decisions, ...extractedData.decisions])];
                }
                if (Array.isArray(extractedData.nextSteps)) {
                    currentSession.nextSteps = [...new Set([...currentSession.nextSteps, ...extractedData.nextSteps])];
                }

                // Handle Blockers
                if (Array.isArray(extractedData.blockers)) {
                    extractedData.blockers.forEach((msg: string) => {
                        currentSession.errorsEncountered.push({
                            message: msg,
                            file: file,
                            line: 0,
                            resolved: false
                        });
                    });
                } else if (typeof extractedData.blockers === 'string' && extractedData.blockers.length > 0) {
                    currentSession.errorsEncountered.push({
                        message: extractedData.blockers,
                        file: file,
                        resolved: false
                    });
                }

                // Populate chatContext
                currentSession.chatContext = {
                    importedFrom: file,
                    conversationSummary: extractedData.summary || 'Imported conversation context.',
                    keyInsights: Array.isArray(extractedData.keyInsights) ? extractedData.keyInsights : []
                };

                await fs.ensureDir(path.dirname(sessionPath));
                await saveSession(sessionPath, currentSession);
                console.log(chalk.green('✔ Session updated with imported context.'));
                console.log(chalk.dim(`  Intent: ${extractedData.intent}`));
                console.log(chalk.dim(`  Decisions Added: ${extractedData.decisions?.length || 0}`));
                console.log(chalk.dim(`  Insights Added: ${extractedData.keyInsights?.length || 0}`));

            } catch (error: any) {
                spinner.fail(`Import failed: ${error.message}`);
                process.exit(1);
            }
        });
}
