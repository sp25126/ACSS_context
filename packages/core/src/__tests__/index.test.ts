import { createEmptySession, mergeSessions, addFileChange } from '../index';

describe('ACSS Core Utilities', () => {
    const projectRoot = '/test/project';
    const metadata = {
        name: 'Test Project',
        techStack: ['TypeScript'],
        entryPoints: ['src/index.ts'],
    };

    test('createEmptySession returns valid default structure', () => {
        const session = createEmptySession('session-123', projectRoot, metadata);
        expect(session.sessionId).toBe('session-123');
        expect(session.projectRoot).toBe(projectRoot);
        expect(session.projectMetadata.name).toBe('Test Project');
        expect(session.filesModified).toEqual([]);
        expect(session.currentTask.status).toBe('not_started');
    });

    test('mergeSessions follows priority rules', () => {
        const s1 = createEmptySession('s1', projectRoot, metadata);
        const s2 = createEmptySession('s2', projectRoot, { ...metadata, name: 'S2 Name' });

        // Metadata priority (S1 wins)
        // Task priority (S2 is newer)
        s1.currentTask.lastUpdatedAt = '2026-01-01T00:00:00Z';
        s2.currentTask.lastUpdatedAt = '2026-01-02T00:00:00Z';
        s2.currentTask.intent = 'S2 Intent';

        const change1 = { path: 'shared.ts', changeType: 'created' as const, summary: 'S1 change' };
        const change2 = { path: 'shared.ts', changeType: 'modified' as const, summary: 'S2 change' };
        const change3 = { path: 'unique.ts', changeType: 'created' as const, summary: 'Unique change' };

        s1.filesModified.push(change1);
        s2.filesModified.push(change2, change3);

        const merged = mergeSessions([s1, s2]);

        expect(merged.projectMetadata.name).toBe('Test Project');
        expect(merged.currentTask.intent).toBe('S2 Intent');

        // filesModified check
        expect(merged.filesModified.length).toBe(3); // shared:created, shared:modified, unique:created
        const sharedCreated = merged.filesModified.find(f => f.path === 'shared.ts' && f.changeType === 'created');
        const sharedModified = merged.filesModified.find(f => f.path === 'shared.ts' && f.changeType === 'modified');
        const unique = merged.filesModified.find(f => f.path === 'unique.ts');

        expect(sharedCreated?.important).toBe(true);
        expect(sharedModified?.important).toBe(true);
        expect(unique?.important).toBeUndefined(); // or false
    });

    test('mergeSessions merges collections uniquely', () => {
        const s1 = createEmptySession('s1', projectRoot, metadata);
        const s2 = createEmptySession('s2', projectRoot, metadata);

        s1.decisions.push('Decision A');
        s2.decisions.push('Decision A', 'Decision B');

        s1.errorsEncountered.push({ message: 'Error 1', resolved: false });
        s2.errorsEncountered.push({ message: 'Error 1', resolved: false }, { message: 'Error 2', resolved: true });

        const merged = mergeSessions([s1, s2]);

        expect(merged.decisions).toEqual(['Decision A', 'Decision B']);
        expect(merged.errorsEncountered.length).toBe(2);
        expect(merged.errorsEncountered.map(e => e.message)).toContain('Error 1');
        expect(merged.errorsEncountered.map(e => e.message)).toContain('Error 2');
    });
});
