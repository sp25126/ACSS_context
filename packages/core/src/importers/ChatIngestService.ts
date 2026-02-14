
import { LLMService } from '../llm/LLMService';
import { ChatGPTParser, ChatThread } from './ChatParser';
import { AcssSession } from '../acss-schema';

export class ChatIngestService {
    private llm: LLMService;

    constructor(llm: LLMService) {
        this.llm = llm;
    }

    async ingestChat(rawData: any, currentSession: AcssSession, fileList: string[] = []): Promise<Partial<AcssSession>> {
        const parser = new ChatGPTParser(); // Currently only ChatGPT supported, can add autodetection later
        const threads = parser.parse(rawData);

        if (threads.length === 0) return {};

        // Prepare transcript for LLM
        // We'll focus on the first thread for simplicity, or we could join them
        const thread = threads[0];
        const transcript = thread.turns.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n');

        const systemPrompt = `Analyze the following chat conversation between a developer and an AI assistant.
Extract the core technical intent, decisions made, and next steps for the project.

IMPORTANT: Cross-reference the chat interaction with the current project file structure:
${fileList.length > 0 ? fileList.join('\n') : 'No file data provided.'}

If a chat decision relates to creating or modifying specific files listed above, prioritize that in the output.

Format the output as a JSON object with the following structure:
{
  "intent": "Short summary of what is being built",
  "techStack": ["list", "of", "technologies"],
  "decisions": ["list", "of", "key", "architectural", "choices"],
  "nextSteps": ["list", "of", "concrete", "roadmap", "items"]
}
If a field is not found, leave it as an empty array or string. Do not hallucinate.`;

        try {
            console.log('🤖 Analyzing chat interaction with LLM...');
            // DEBUG LOGS
            console.log('--- PROMPT START ---');
            console.log(transcript.substring(0, 500) + '...');
            console.log('--- PROMPT END ---');

            const response = await this.llm.generate(transcript, systemPrompt);

            console.log('--- RAW LLM RESPONSE START ---');
            console.log(response);
            console.log('--- RAW LLM RESPONSE END ---');

            // Basic JSON extraction from LLM response (handling potential markdown blocks)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('⚠️ LLM response did not contain clear JSON. Response:', response);
                return {};
            }

            const extracted = JSON.parse(jsonMatch[0]);

            return {
                projectMetadata: {
                    ...currentSession.projectMetadata,
                    name: extracted.intent || currentSession.projectMetadata.name,
                    techStack: Array.from(new Set([
                        ...(currentSession.projectMetadata.techStack || []),
                        ...(extracted.techStack || [])
                    ]))
                },
                currentTask: {
                    ...currentSession.currentTask,
                    intent: extracted.intent || currentSession.currentTask.intent
                },
                decisions: Array.from(new Set([
                    ...(currentSession.decisions || []),
                    ...(extracted.decisions || [])
                ])),
                nextSteps: Array.from(new Set([
                    ...(currentSession.nextSteps || []),
                    ...(extracted.nextSteps || [])
                ]))
            };
        } catch (error) {
            console.error('Failed to ingest chat:', error);
            return {};
        }
    }
}
