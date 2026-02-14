import { AcssSession } from './acss-schema';
import { LLMService } from './llm/LLMService';

export async function compressSession(
    session: AcssSession,
    llm: LLMService
): Promise<AcssSession> {
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
        const compressedJsonText = await llm.generate(prompt, "You are a session compression expert. Output ONLY valid JSON in ACSS format.", {
            maxTokens: 2048, // Increased for large sessions
            customEndpoint: '/compress'
        });

        // Robust JSON Extraction
        let cleanJson = compressedJsonText.trim();

        // Remove markdown backticks if present
        const jsonMatch = cleanJson.match(/```json\n?([\s\S]*?)\n?```/) ||
            cleanJson.match(/```\n?([\s\S]*?)\n?```/) ||
            cleanJson.match(/{[\s\S]*}/);

        if (jsonMatch) {
            cleanJson = jsonMatch[1] || jsonMatch[0];
        }

        let compressedSession;
        try {
            compressedSession = JSON.parse(cleanJson);
        } catch (parseError: any) {
            console.error('❌ Failed to parse LLM compressed JSON. Raw response partially shown below:');
            console.error(compressedJsonText.substring(0, 500) + '...');
            throw parseError;
        }

        // Ensure all required ACSS fields are present, even if LLM omitted them
        return {
            ...session, // Fallback fields
            ...compressedSession,
            updatedAt: new Date().toISOString(),
            sessionId: session.sessionId,
            projectRoot: session.projectRoot,
            createdAt: session.createdAt,
            projectMetadata: session.projectMetadata,
            sources: [...(session.sources || []), {
                tool: 'other',
                note: 'Compressed via LLM'
            }]
        };
    } catch (error: any) {
        console.warn(`⚠️  LLM compression failed (${error.message}). Falling back to heuristic summary.`);

        // Heuristic Fallback: Keep recent logic, truncate older stuff
        const heuristicSession: AcssSession = {
            ...session,
            updatedAt: new Date().toISOString(),
            decisions: session.decisions.slice(-10), // Keep last 10 decisions
            errorsEncountered: session.errorsEncountered.filter(e => !e.resolved), // Keep only unresolved errors
            nextSteps: session.nextSteps.slice(0, 10),
            sources: [...(session.sources || []), {
                tool: 'other',
                note: 'Compressed via Heuristic Fallback'
            }]
        };

        return heuristicSession;
    }
}
