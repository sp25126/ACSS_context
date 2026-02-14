
import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { LLMService, ChatIngestService } from '@acss/core';
import { loadSession, saveSession } from '../index';

export function registerIngestCommand(program: Command) {
    program
        .command('ingest <filePath>')
        .description('Ingest a chat export (e.g., ChatGPT JSON) into the current session')
        .option('--model <name>', 'Ollama model to use', 'gemma2:2b')
        .action(async (filePath: string, options) => {
            const absolutePath = path.resolve(process.cwd(), filePath);

            if (!fs.existsSync(absolutePath)) {
                console.error(chalk.red(`❌ File not found: ${absolutePath}`));
                process.exit(1);
            }

            try {
                const { session, sessionPath } = await loadSession();
                const rawChatData = await fs.readJson(absolutePath);

                // Get recursive file list for context fusion
                const { globby } = await import('globby');
                const fileList = await globby(['**/*', '!node_modules', '!.git', '!.acss'], {
                    cwd: process.cwd()
                });

                const { getConfig } = require('../config-manager');
                const config = getConfig();

                const llm = new LLMService({
                    model: options.model || config.model,
                    cloudUrl: config.cloudUrl,
                    brainMode: config.brainMode
                });
                const ingestService = new ChatIngestService(llm);

                console.log(chalk.blue(`ℹ Ingesting full chat from: ${path.basename(absolutePath)}`));
                console.log(chalk.dim(`ℹ Fusing with ${fileList.length} local files...`));

                const updates = await ingestService.ingestChat(rawChatData, session, fileList);
                console.log('DEBUG RAW UPDATES:', JSON.stringify(updates, null, 2));

                if (Object.keys(updates).length === 0) {
                    console.error(chalk.red('❌ Failed to extract any useful data from the chat interaction.'));
                    return;
                }

                const updatedSession = {
                    ...session,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };

                // Use exported saveSession which handles validation
                await saveSession(sessionPath, updatedSession);
                console.log(chalk.green('✔ Chat ingestion and IDE context fusion complete. Session updated.'));

            } catch (error: any) {
                console.error(chalk.red(`❌ Error during ingestion: ${error.message}`));
                process.exit(1);
            }
        });
}
