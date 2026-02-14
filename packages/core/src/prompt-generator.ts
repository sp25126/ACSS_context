import { AcssSession } from './acss-schema';
import * as templates from './prompts';

export type PromptTarget = 'chatgpt' | 'claude' | 'gemini' | 'local' | 'other';

export function generatePrompt(
    session: AcssSession,
    target: PromptTarget = 'other',
    maxTokens?: number
): string {
    let template = templates.LOCAL_TEMPLATE;

    if (target === 'chatgpt') template = templates.CHATGPT_TEMPLATE;
    else if (target === 'claude') template = templates.CLAUDE_TEMPLATE;
    else if (target === 'gemini') template = templates.GEMINI_TEMPLATE;

    // Create a human-readable summary
    const stackSnippet = session.projectMetadata.techStack.length > 0
        ? `\n- **Stack**: ${session.projectMetadata.techStack.join(', ')}`
        : '';
    const decisionSnippet = session.decisions.length > 0
        ? `\n- **Recent Decisions**:\n  ${session.decisions.slice(-3).reverse().map(d => `* ${d}`).join('\n  ')}`
        : '';
    const errorSnippet = session.errorsEncountered.filter(e => !e.resolved).length > 0
        ? `\n- **Open Blockers**:\n  ${session.errorsEncountered.filter(e => !e.resolved).slice(-3).map(e => `* ${e.message}`).join('\n  ')}`
        : '';

    const summary = `
## Session Summary: ${session.projectMetadata.name}
- **Current Intent**: ${session.currentTask.intent}
- **Status**: ${session.currentTask.status}${stackSnippet}${decisionSnippet}${errorSnippet}
- **Next Steps**:
  ${session.nextSteps.length > 0 ? session.nextSteps.map(s => `* ${s}`).join('\n  ') : 'Internalizing details...'}
`.trim();

    const sessionJson = JSON.stringify(session, null, 2);
    let result = template.replace('[ACSS_JSON_HERE]', sessionJson);

    // Inject summary at the top if we recognized the intro sentence
    const introSentence = 'You are taking over an existing coding session from another AI assistant.';
    if (result.startsWith(introSentence)) {
        result = result.replace(introSentence, `You are taking over an existing coding session.\n\n${summary}`);
    } else {
        // Fallback for other templates - prepend summary before the JSON section
        result = result.replace('Here is the project and session context', `${summary}\n\nHere is the project and session context`);
    }

    if (maxTokens && result.length > maxTokens * 4) {
        // Try to keep the summary and truncate the JSON if needed, but for now simple truncate
        result = result.substring(0, maxTokens * 4) + "\n\n[Prompt truncated due to length limits]";
    }

    return result;
}
