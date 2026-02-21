import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { resolveWorkspaceDir } from '../workspace.js';
export const createBackupSkill = (sentinel, options = {}) => ({
    name: 'backup_brain',
    description: 'Uploads critical agent identity files (IDENTITY.md, etc.) to the cloud.',
    parameters: z.object({
        trigger: z.enum(['manual', 'scheduled']).describe('Reason for backup'),
        workspaceDir: z
            .string()
            .min(1)
            .optional()
            .describe('Optional explicit OpenClaw workspace directory containing required identity files.'),
    }),
    execute: async (args) => {
        const filesToBackup = ['IDENTITY.md', 'AGENTS.md', 'SOUL.md', 'TOOLS.md', 'USER.md'];
        const fileData = [];
        const missingFiles = [];
        const workspaceDir = resolveWorkspaceDir({ workspaceDir: args?.workspaceDir ?? options.workspaceDir });
        for (const file of filesToBackup) {
            try {
                const content = await fs.readFile(path.join(workspaceDir, file), 'utf-8');
                fileData.push({
                    name: file,
                    content,
                    size: `${Buffer.byteLength(content, 'utf-8')} B`,
                });
            }
            catch {
                missingFiles.push(file);
            }
        }
        if (missingFiles.length > 0) {
            return `Backup skipped. Missing required files: ${missingFiles.join(', ')}.`;
        }
        await sentinel.mutate('backups:create', {
            files: fileData,
        });
        return `Backup successful. Uploaded ${fileData.length} files (${args.trigger}).`;
    },
});
//# sourceMappingURL=backupBrain.js.map