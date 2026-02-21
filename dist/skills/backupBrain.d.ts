import { z } from 'zod';
import { SentinelClient } from '../client.js';
type BackupSkillOptions = {
    workspaceDir?: string;
};
export declare const createBackupSkill: (sentinel: SentinelClient, options?: BackupSkillOptions) => {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        trigger: z.ZodEnum<["manual", "scheduled"]>;
        workspaceDir: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        trigger: "manual" | "scheduled";
        workspaceDir?: string | undefined;
    }, {
        trigger: "manual" | "scheduled";
        workspaceDir?: string | undefined;
    }>;
    execute: (args: any) => Promise<string>;
};
export {};
