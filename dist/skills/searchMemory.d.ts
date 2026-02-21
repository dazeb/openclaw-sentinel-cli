import { z } from 'zod';
import { SentinelClient } from '../client.js';
export declare const createMemorySearchSkill: (sentinel: SentinelClient) => {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        query: z.ZodString;
        limit: z.ZodOptional<z.ZodNumber>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        tags?: string[] | undefined;
        limit?: number | undefined;
    }, {
        query: string;
        tags?: string[] | undefined;
        limit?: number | undefined;
    }>;
    execute: (input: unknown) => Promise<{
        ok: boolean;
        count: number;
        results: Record<string, unknown>[];
    }>;
};
