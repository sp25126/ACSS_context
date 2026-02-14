import axios from 'axios';
import chalk from 'chalk';

export interface LLMConfig {
    cloudUrl?: string; // If set, use this (e.g., ngrok URL to Colab)
    model?: string;    // e.g., "gemma2:2b", "llama3"
    localUrl?: string; // Defaults to http://localhost:11434
    brainMode?: 'hybrid' | 'cloud' | 'local';
}

export class LLMService {
    private config: LLMConfig;

    constructor(config: LLMConfig = {}) {
        this.config = {
            localUrl: 'http://localhost:11434',
            model: 'gemma2:2b',
            brainMode: 'hybrid',
            ...config,
        };
    }

    async generate(prompt: string, systemPrompt?: string, options: { customEndpoint?: string, maxTokens?: number } = {}): Promise<string> {
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser Input:\n${prompt}` : prompt;

        // Strict Local Mode
        if (this.config.brainMode === 'local') {
            return this.generateLocal(fullPrompt, options);
        }

        // Strict Cloud Mode
        if (this.config.brainMode === 'cloud') {
            if (!this.config.cloudUrl) {
                throw new Error('Cloud Brain URL is not configured. Use "acss config cloudUrl <url>"');
            }
            return this.generateCloud(fullPrompt, systemPrompt, options);
        }

        // Hybrid Mode (Default): Prefer Cloud, fallback to Local
        if (this.config.cloudUrl) {
            try {
                return await this.generateCloud(fullPrompt, systemPrompt, options);
            } catch (error: any) {
                console.warn(chalk.yellow(`⚠️ Cloud Brain failed, falling back to Local: ${error.message}`));
                return this.generateLocal(fullPrompt, options);
            }
        } else {
            return this.generateLocal(fullPrompt, options);
        }
    }

    private async generateCloud(prompt: string, systemPrompt?: string, options: { customEndpoint?: string, maxTokens?: number } = {}): Promise<string> {
        try {
            const endpoint = options.customEndpoint || '/generate';
            console.log(chalk.cyan(`☁️ Sending to Cloud Brain (${endpoint}): ${this.config.cloudUrl}`));
            const response = await axios.post(`${this.config.cloudUrl}${endpoint}`, {
                prompt: prompt,
                system_prompt: systemPrompt || "You are a helpful coding assistant.",
                model: this.config.model,
                max_tokens: options.maxTokens || 512
            }, { timeout: 60000 }); // Increase to 60s for complex tasks

            return response.data.response;
        } catch (error: any) {
            throw new Error(`Cloud Brain request failed: ${error.message}`);
        }
    }

    private async generateLocal(prompt: string, options: { maxTokens?: number } = {}): Promise<string> {
        try {
            console.log(chalk.blue(`💻 Sending to Local Ollama (${this.config.model})...`));
            const response = await axios.post(`${this.config.localUrl}/api/generate`, {
                model: this.config.model,
                prompt: prompt,
                stream: false,
                options: {
                    num_predict: options.maxTokens || 512
                }
            });
            return response.data.response;
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error(`Could not connect to Ollama at ${this.config.localUrl}. Is it running?`);
            }
            throw new Error(`Ollama request failed: ${error.message}`);
        }
    }
}
