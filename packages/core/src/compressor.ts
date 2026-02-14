import axios from 'axios';
import { AcssSession } from './acss-schema';

export interface CompressionConfig {
    model?: string;
    endpoint?: string;
}

export async function compressSession(
    session: AcssSession,
    config: CompressionConfig = {}
): Promise<AcssSession> {
    let {
        model = 'llama3',
        endpoint = 'http://localhost:11434/api/generate'
    } = config;

    // Robustness: ensure endpoint ends with /api/generate if it looks like a base Ollama URL
    if (endpoint.endsWith(':11434') || endpoint.endsWith('localhost:11434/')) {
        endpoint = endpoint.replace(/\/$/, '') + '/api/generate';
    }

    const prompt = `You are compressing an AI coding session state for later handoff.

Input JSON:
${JSON.stringify(session, null, 2)}

Task:
- Reduce the length by ~70% while preserving:
  - currentTask.intent
  - key decisions
  - critical errors
  - nextSteps
- Remove trivial details and redundant phrasing.
- Output valid JSON in the same ACSS structure.

Output ONLY the compressed JSON.`;

    try {
        const response = await axios.post(endpoint, {
            model: model,
            prompt: prompt,
            stream: false,
            format: 'json'
        }, { timeout: 10000 }); // Add timeout to avoid hanging

        // Ollama specific response format handling
        const responseData = response.data;
        const compressedJsonText = responseData.response || responseData.text || JSON.stringify(responseData);

        const compressedSession = JSON.parse(compressedJsonText);

        // Ensure all required ACSS fields are present, even if LLM omitted them
        return {
            sessionId: session.sessionId,
            projectRoot: session.projectRoot,
            createdAt: session.createdAt,
            updatedAt: new Date().toISOString(),
            projectMetadata: session.projectMetadata,
            currentTask: session.currentTask,
            filesModified: [],
            decisions: [],
            errorsEncountered: [],
            nextSteps: [],
            sources: session.sources,
            ...compressedSession
        };
    } catch (error) {
        console.warn('⚠️  LLM compression failed (offline or timeout). Falling back to heuristic summary.');

        // Heuristic Fallback: Keep recent logic, truncate older stuff
        const heuristicSession: AcssSession = {
            ...session,
            updatedAt: new Date().toISOString(),
            decisions: session.decisions.slice(-5), // Keep last 5 decisions
            errorsEncountered: session.errorsEncountered.filter(e => !e.resolved), // Keep only unresolved errors
            // If nextSteps is huge, maybe slice it, but usually it's small
        };

        // Mark as heuristic for advanced users/debugging
        (heuristicSession as any)._compressionMode = 'heuristic_fallback';

        return heuristicSession;
    }
}
