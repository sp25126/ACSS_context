import { AcssSession } from './acss-schema';
import { addFileChange, addDecision } from './index';

export interface ContextEvent {
    type: 'file' | 'git' | 'chat';
    payload: any;
}

export class LiveContextManager {
    private session: AcssSession;
    private onUpdate: (session: AcssSession) => Promise<void>;

    constructor(initialSession: AcssSession, onUpdate: (session: AcssSession) => Promise<void>) {
        this.session = initialSession;
        this.onUpdate = onUpdate;
    }

    async handleEvent(event: ContextEvent) {
        console.log(`[LiveContext] Processing ${event.type} event...`);

        let shouldUpdate = false;

        switch (event.type) {
            case 'file':
                this.session = addFileChange(this.session, event.payload);
                shouldUpdate = true;
                break;
            case 'git':
                this.session = addDecision(this.session, `Git commit: ${event.payload.message}`);
                shouldUpdate = true;
                break;
            case 'chat':
                // Merge chat updates
                this.session = {
                    ...this.session,
                    ...event.payload,
                    updatedAt: new Date().toISOString()
                };
                shouldUpdate = true;
                break;
        }

        if (shouldUpdate) {
            await this.onUpdate(this.session);
        }
    }

    getSession(): AcssSession {
        return this.session;
    }
}
