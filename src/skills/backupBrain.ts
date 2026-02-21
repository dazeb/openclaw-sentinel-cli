import { z } from 'zod';
import { SentinelClient } from '../client.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { resolveWorkspaceDir } from '../workspace.js';

type BackupSkillOptions = {
  workspaceDir?: string;
};

export const createBackupSkill = (sentinel: SentinelClient, options: BackupSkillOptions = {}) => ({
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
  execute: async (args: any) => {
    const filesToBackup = ['IDENTITY.md', 'AGENTS.md', 'SOUL.md', 'TOOLS.md', 'USER.md'];
    const fileData: Array<{ name: string; content: string; size: string }> = [];
    const missingFiles: string[] = [];
    const workspaceDir = resolveWorkspaceDir({ workspaceDir: args?.workspaceDir ?? options.workspaceDir });

    for (const file of filesToBackup) {
      try {
        const content = await fs.readFile(path.join(workspaceDir, file), 'utf-8');
        fileData.push({
          name: file,
          content,
          size: `${Buffer.byteLength(content, 'utf-8')} B`,
        });
      } catch {
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
