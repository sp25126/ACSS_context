
export interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

export interface ChatThread {
    title: string;
    turns: ChatTurn[];
    createTime: number;
}

export abstract class ChatParser {
    abstract parse(rawData: any): ChatThread[];
}

export class ChatGPTParser extends ChatParser {
    parse(rawData: any): ChatThread[] {
        if (!Array.isArray(rawData)) {
            // Might be a single conversation object
            rawData = [rawData];
        }

        return rawData.map((conv: any) => {
            const thread: ChatThread = {
                title: conv.title || 'Untitled Conversation',
                createTime: conv.create_time ? conv.create_time * 1000 : Date.now(),
                turns: []
            };

            if (conv.mapping) {
                // ChatGPT export format has a 'mapping' of message nodes
                // We need to walk them in chronological order.
                // Naive approach: filter for nodes with messages and sort by time if available
                const nodes = Object.values(conv.mapping)
                    .filter((node: any) => node.message && node.message.content)
                    .sort((a: any, b: any) => (a.message.create_time || 0) - (b.message.create_time || 0));

                thread.turns = nodes.map((node: any) => ({
                    role: node.message.author.role === 'user' ? 'user' : 'assistant',
                    content: node.message.content.parts.join('\n')
                }));
            }

            return thread;
        });
    }
}
