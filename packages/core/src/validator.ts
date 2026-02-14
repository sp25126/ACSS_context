import { AcssSession } from './acss-schema';

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
