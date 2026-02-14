import { createEmptySession, mergeSessions } from '../index';
import { AcssSession } from '../acss-schema';

describe('mergeSessions Advanced Rules', () => {
    const projectRoot = '/test/project';
    const metadata = {
        name: 'Base Project',
        techStack: ['TypeScript'],
        entryPoints: ['src/index.ts'],
    };

    test('Rule: projectMetadata takes from first session', () => {
        const s1 = createEmptySession('s1', projectRoot, { ...metadata, name: 'First' });
        const s2 = createEmptySession('s2', projectRoot, { ...metadata, name: 'Second' });

        const merged = mergeSessions([s1, s2]);
        expect(merged.projectMetadata.name).toBe('First');
    });

    test('Rule: currentTask picks the most recent lastUpdatedAt', () => {
        const s1 = createEmptySession('s1', projectRoot, metadata);
        const s2 = createEmptySession('s2', projectRoot, metadata);

        s1.currentTask.lastUpdatedAt = '2026-02-14T01:00:00Z';
        s1.currentTask.intent = 'Older Intent';

        s2.currentTask.lastUpdatedAt = '2026-02-14T02:00:00Z'; // Newer
        s2.currentTask.intent = 'Newer Intent';

        const merged = mergeSessions([s1, s2]);
        expect(merged.currentTask.intent).toBe('Newer Intent');
        expect(merged.currentTask.lastUpdatedAt).toBe('2026-02-14T02:00:00Z');
    });

    test('Rule: filesModified union and dedupe by path+changeType', () => {
        const s1 = createEmptySession('s1', projectRoot, metadata);
        const s2 = createEmptySession('s2', projectRoot, metadata);

        const changeA = { path: 'file1.ts', changeType: 'modified' as const, summary: 'A' };
        const changeB = { path: 'file1.ts', changeType: 'modified' as const, summary: 'B' }; // Exact same path+type
        const changeC = { path: 'file1.ts', changeType: 'created' as const, summary: 'C' }; // Different type

        s1.filesModified.push(changeA);
        s2.filesModified.push(changeB, changeC);

        const merged = mergeSessions([s1, s2]);

        // Should have 2 entries: file1.ts:modified (deduped) and file1.ts:created
        expect(merged.filesModified.length).toBe(2);
        expect(merged.filesModified.find(f => f.changeType === 'modified')?.summary).toBe('B'); // Last one wins for summary
        expect(merged.filesModified.find(f => f.changeType === 'created')?.summary).toBe('C');
    });

    test('Rule: mark important = true if path appears in >1 session', () => {
        const s1 = createEmptySession('s1', projectRoot, metadata);
        const s2 = createEmptySession('s2', projectRoot, metadata);

        const changeS1 = { path: 'shared.ts', changeType: 'modified' as const, summary: 'S1' };
        const changeS2 = { path: 'shared.ts', changeType: 'created' as const, summary: 'S2' };
        const changeUnique = { path: 'unique.ts', changeType: 'modified' as const, summary: 'U' };

        s1.filesModified.push(changeS1);
        s2.filesModified.push(changeS2, changeUnique);

        const merged = mergeSessions([s1, s2]);

        const sharedEntries = merged.filesModified.filter(f => f.path === 'shared.ts');
        const uniqueEntries = merged.filesModified.filter(f => f.path === 'unique.ts');

        expect(sharedEntries.every(f => f.important === true)).toBe(true);
        expect(uniqueEntries[0].important).toBeFalsy();
    });

    test('Rule: decisions, errors, nextSteps concatenate and dedupe text', () => {
        const s1 = createEmptySession('s1', projectRoot, metadata);
        const s2 = createEmptySession('s2', projectRoot, metadata);

        s1.decisions.push('D1', 'D2');
        s2.decisions.push('D2', 'D3');

        s1.nextSteps.push('Step 1');
        s2.nextSteps.push('Step 1', 'Step 2');

        s1.errorsEncountered.push({ message: 'Err1', resolved: false });
        s2.errorsEncountered.push({ message: 'Err1', resolved: false }, { message: 'Err2', resolved: true });

        const merged = mergeSessions([s1, s2]);

        expect(merged.decisions).toEqual(['D1', 'D2', 'D3']);
        expect(merged.nextSteps).toEqual(['Step 1', 'Step 2']);
        expect(merged.errorsEncountered.length).toBe(2);
        expect(merged.errorsEncountered.map(e => e.message)).toContain('Err1');
        expect(merged.errorsEncountered.map(e => e.message)).toContain('Err2');
    });
});
