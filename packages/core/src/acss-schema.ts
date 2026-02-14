export interface AcssSession {
  sessionId: string;
  projectRoot: string;
  createdAt: string;
  updatedAt: string;

  projectMetadata: {
    name: string;
    techStack: string[];
    entryPoints: string[];
  };

  context?: {
    gitBranch?: string;
    nodeVersion?: string;
    platform?: string;
  };

  currentTask: {
    intent: string;
    status: 'not_started' | 'in_progress' | 'blocked' | 'done';
    startedAt: string;
    lastUpdatedAt: string;
  };

  filesModified: Array<{
    path: string;
    changeType: 'created' | 'modified' | 'deleted';
    summary?: string;      // optional: short human explanation
    important?: boolean;   // allow user marking
  }>;

  decisions: string[];     // “Switched from OAuth to JWT because...”
  errorsEncountered: Array<{
    message: string;
    file?: string;
    line?: number;
    resolved: boolean;
  }>;

  nextSteps: string[];
  chatHistorySummary?: string;

  sources: Array<{
    tool: 'cursor' | 'gemini' | 'chatgpt' | 'claude' | 'other';
    note: string;
  }>;
}
