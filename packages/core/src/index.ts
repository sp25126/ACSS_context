export * from './acss-schema';
export * from './prompt-generator';
export * from './compressor';
import { AcssSession } from './acss-schema';

export function createEmptySession(
    sessionId: string,
    projectRoot: string,
    metadata: { name: string; techStack: string[]; entryPoints: string[] }
): AcssSession {
    const now = new Date().toISOString();
    return {
        sessionId,
        projectRoot,
        createdAt: now,
        updatedAt: now,
        projectMetadata: metadata,
        currentTask: {
            intent: 'Initial setup',
            status: 'not_started',
            startedAt: now,
            lastUpdatedAt: now,
        },
        filesModified: [],
        decisions: [],
        errorsEncountered: [],
        nextSteps: [],
        sources: [
            {
                tool: 'other',
                note: 'Initialized via core library',
            },
        ],
    };
}

export function updateTask(
    session: AcssSession,
    updates: Partial<AcssSession['currentTask']>
): AcssSession {
    const now = new Date().toISOString();
    return {
        ...session,
        updatedAt: now,
        currentTask: {
            ...session.currentTask,
            ...updates,
            lastUpdatedAt: now,
        },
    };
}

export function addFileChange(
    session: AcssSession,
    change: AcssSession['filesModified'][number]
): AcssSession {
    const now = new Date().toISOString();
    return {
        ...session,
        updatedAt: now,
        filesModified: [...session.filesModified, change],
    };
}

export function addDecision(session: AcssSession, decision: string): AcssSession {
    const now = new Date().toISOString();
    return {
        ...session,
        updatedAt: now,
        decisions: [...session.decisions, decision],
    };
}

export function addError(
    session: AcssSession,
    error: AcssSession['errorsEncountered'][number]
): AcssSession {
    const now = new Date().toISOString();
    return {
        ...session,
        updatedAt: now,
        errorsEncountered: [...session.errorsEncountered, error],
    };
}

export function addNextStep(session: AcssSession, step: string): AcssSession {
    const now = new Date().toISOString();
    return {
        ...session,
        updatedAt: now,
        nextSteps: [...session.nextSteps, step],
    };
}

export function mergeSessions(sessions: AcssSession[]): AcssSession {
    if (sessions.length === 0) {
        throw new Error('No sessions to merge');
    }

    if (sessions.length === 1) {
        return sessions[0];
    }

    // projectMetadata: take from first session
    const base = sessions[0];

    // currentTask: pick the most recent lastUpdatedAt
    let currentTask = base.currentTask;
    sessions.slice(1).forEach(s => {
        if (new Date(s.currentTask.lastUpdatedAt) > new Date(currentTask.lastUpdatedAt)) {
            currentTask = s.currentTask;
        }
    });

    const merged: AcssSession = {
        ...base,
        updatedAt: new Date().toISOString(),
        currentTask,
        filesModified: [],
        decisions: [],
        errorsEncountered: [],
        nextSteps: [],
        sources: [],
    };

    const fileMap = new Map<string, AcssSession['filesModified'][number]>();
    const fileAppearanceCount = new Map<string, number>();

    const decisionsSet = new Set<string>();
    const stepsSet = new Set<string>();
    const errorMap = new Map<string, AcssSession['errorsEncountered'][number]>();

    sessions.forEach((s) => {
        // filesModified: union, dedupe by path + changeType
        s.filesModified.forEach((f) => {
            const key = `${f.path}:${f.changeType}`;
            fileMap.set(key, f);
            fileAppearanceCount.set(f.path, (fileAppearanceCount.get(f.path) || 0) + 1);
        });

        // decisions: concatenate and dedupe
        s.decisions.forEach(d => decisionsSet.add(d));

        // nextSteps: concatenate and dedupe
        s.nextSteps.forEach(step => stepsSet.add(step));

        // errorsEncountered: dedupe by message
        s.errorsEncountered.forEach(e => errorMap.set(e.message, e));

        // sources: concatenate
        merged.sources.push(...s.sources);
    });

    // Finalize files: mark important if appears in >1 session
    fileMap.forEach((f, key) => {
        const path = key.split(':')[0];
        if ((fileAppearanceCount.get(path) || 0) > 1) {
            f.important = true;
        }
        merged.filesModified.push(f);
    });

    merged.decisions = Array.from(decisionsSet);
    merged.nextSteps = Array.from(stepsSet);
    merged.errorsEncountered = Array.from(errorMap.values());

    return merged;
}

export function validateSession(session: any): { valid: boolean; errors: { message: string }[] } {
    const errors: { message: string }[] = [];
    const requiredFields = [
        'sessionId',
        'projectRoot',
        'projectMetadata',
        'currentTask',
        'filesModified',
    ];

    requiredFields.forEach((f) => {
        if (!session[f]) {
            errors.push({ message: `Missing required field: ${f}` });
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
