export const CHATGPT_TEMPLATE = `You are taking over an existing coding session from another AI assistant.

Here is the project and session context in ACSS format:

\`\`\`json
[ACSS_JSON_HERE]
\`\`\`

## Your Mission
1.  **Restate the Goal**: In 1 sentence, what are we building?
2.  **Status Check**: What is the immediate blocker or next step?
3.  **Execute**: Continue from the first unresolved item in "nextSteps". 
    *   Do NOT deviate from the "decisions" listed.
    *   If you encounter the "blocker" listed in "errorsEncountered", fix that first.

Respond with your analysis and the next code block.`;

export const CLAUDE_TEMPLATE = `You are a senior full-stack developer acting as a continuity engine.

<context>
[ACSS_JSON_HERE]
</context>

<instructions>
1.  Analyze the <currentTask> and <decisions> tags to understand the architectural constraints.
2.  Identify the first unresolved item in <nextSteps>.
3.  If there are unresolved <errorsEncountered>, formulate a fix for them immediately.
4.  Provide your response in a clear, step-by-step format, thinking through the implications of the existing stack choices.
</instructions>

Begin by briefly summarizing the project state, then provide the code for the next step.`;

export const GEMINI_TEMPLATE = `System Context: Developer Handoff
Project State (ACSS):
[ACSS_JSON_HERE]

Task:
- Analyze the session state provided above.
- Restate the current intent of the user.
- Proceed with implementing the next steps or resolving the noted errors.
- Ensure consistency with the project's tech stack and previous architectural decisions.

Awaiting your next contribution to the codebase.`;

export const LOCAL_TEMPLATE = `Continuing coding session...

Session Context:
[ACSS_JSON_HERE]

Rules:
- Focus on the "currentTask".
- Implement the "nextSteps" in order.
- Do not deviate from the "decisions" already made.

What is the next step?`;
