import fs from 'fs-extra';
import path from 'path';
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

export class DocumentLoader {
    async load(filePath: string): Promise<string> {
        const ext = path.extname(filePath).toLowerCase();

        if (!await fs.pathExists(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        try {
            switch (ext) {
                case '.pdf':
                    return await this.loadPdf(filePath);
                case '.docx':
                    return await this.loadDocx(filePath);
                case '.md':
                case '.txt':
                case '.json':
                case '.js':
                case '.ts':
                    return await this.loadText(filePath);
                default:
                    throw new Error(`Unsupported file type: ${ext}`);
            }
        } catch (error: any) {
            throw new Error(`Failed to load document ${filePath}: ${error.message}`);
        }
    }

    private async loadPdf(filePath: string): Promise<string> {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    }

    private async loadDocx(filePath: string): Promise<string> {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    }

    private async loadText(filePath: string): Promise<string> {
        return await fs.readFile(filePath, 'utf-8');
    }
}
