import Conf from 'conf';

export interface AcssConfig {
    model?: string;
    endpoint?: string;
    author?: string;
}

const config = new Conf<AcssConfig>({
    projectName: 'acss-tool',
    defaults: {
        model: 'gemma2:2b',
        endpoint: 'http://localhost:11434/api/generate',
        author: 'Anonymous'
    }
});

export function getConfig(key?: string): any {
    if (key) {
        return config.get(key);
    }
    return config.store;
}

export function setConfig(key: string, value: string): void {
    config.set(key, value);
}

export function resetConfig(): void {
    config.clear();
}
