import { z } from 'zod';
import { SentinelClient } from '../client.js';
export declare const createHeartbeatSkill: (sentinel: SentinelClient) => {
    name: string;
    description: string;
    parameters: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
    execute: () => Promise<string>;
};
