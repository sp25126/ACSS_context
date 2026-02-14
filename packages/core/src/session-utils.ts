import fs from 'fs-extra';
import { AcssSession } from './acss-schema';
import { validateSession } from './validator';

export async function saveSession(outputPath: string, session: AcssSession): Promise<void> {
    const validation = validateSession(session);
    if (!validation.valid) {
        throw new Error(`Invalid session state: ${validation.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }
    await fs.writeJson(outputPath, session, { spaces: 2 });
}
