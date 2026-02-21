import { z } from 'zod';
import { SentinelClient } from '../client.js';
export declare const createMemorySkill: (sentinel: SentinelClient) => {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        content: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        source: z.ZodOptional<z.ZodEnum<["user", "web", "system", "file"]>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        tags?: string[] | undefined;
        source?: "user" | "web" | "system" | "file" | undefined;
    }, {
        content: string;
        tags?: string[] | undefined;
        source?: "user" | "web" | "system" | "file" | undefined;
    }>;
    execute: (args: any) => Promise<string>;
};
