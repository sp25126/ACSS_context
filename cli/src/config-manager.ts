import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Support local directory .env
const envPath = path.join(process.cwd(), '.env');

export interface AcssConfig {
    model?: string;
    endpoint?: string;
    author?: string;
    cloudUrl?: string;
    brainMode?: 'hybrid' | 'cloud' | 'local';
}

const KEY_MAP: Record<string, string> = {
    model: 'ACSS_MODEL',
    endpoint: 'ACSS_ENDPOINT',
    author: 'ACSS_AUTHOR',
    cloudUrl: 'ACSS_CLOUD_URL',
    brainMode: 'ACSS_BRAIN_MODE'
};

const DEFAULTS: AcssConfig = {
    model: 'gemma2:2b',
    endpoint: 'http://localhost:11434/api/generate',
    author: 'Anonymous',
    brainMode: 'hybrid'
};

export function getConfig(key?: keyof AcssConfig): any {
    dotenv.config({ path: envPath });

    if (key) {
        const envKey = KEY_MAP[key];
        return process.env[envKey] || (DEFAULTS as any)[key];
    }

    const current: any = {};
    for (const [configKey, envKey] of Object.entries(KEY_MAP)) {
        current[configKey] = process.env[envKey] || (DEFAULTS as any)[configKey];
    }
    return current;
}

export function setConfig(key: string, value: string): void {
    const envKey = KEY_MAP[key] || key.toUpperCase();
    let content = '';

    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    const lines = content.split('\n');
    let found = false;
    const newLines = lines.map(line => {
        if (line.trim().startsWith(`${envKey}=`)) {
            found = true;
            return `${envKey}=${value}`;
        }
        return line;
    });

    if (!found) {
        newLines.push(`${envKey}=${value}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n').trim() + '\n');
    // Refresh process.env for the current session
    process.env[envKey] = value;
}

export function resetConfig(): void {
    if (fs.existsSync(envPath)) {
        fs.removeSync(envPath);
    }
}
