import path from 'path';
import fs from 'fs-extra';

export interface FileTreeSummary {
    structure: Record<string, string[]>;
    totalFiles: number;
    totalLines: number;
}

export class DirectoryScanner {
    async scan(root: string): Promise<FileTreeSummary> {
        // Dynamic import for ESM-only globby
        const { globby } = await import('globby');

        // Use globby to find all files, respecting gitignore if present
        const files = await globby(['**/*'], {
            cwd: root,
            gitignore: true,
            ignore: ['node_modules', '.git', '.acss', 'dist', 'build', 'coverage'],
            onlyFiles: true
        });

        const structure: Record<string, string[]> = {};
        let totalLines = 0;

        for (const file of files) {
            const dir = path.dirname(file);
            const base = path.basename(file);

            if (!structure[dir]) {
                structure[dir] = [];
            }
            structure[dir].push(base);

            // Estimate lines (skip binary/large files check for speed, just try/catch read)
            try {
                const fullPath = path.join(root, file);
                const content = await fs.readFile(fullPath, 'utf-8');
                totalLines += content.split('\n').length;
            } catch (e) {
                // Ignore binary read errors
            }
        }

        return {
            structure,
            totalFiles: files.length,
            totalLines
        };
    }
}
