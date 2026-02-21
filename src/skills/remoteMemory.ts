import { z } from 'zod';
import { SentinelClient } from '../client.js';

export const createMemorySkill = (sentinel: SentinelClient) => ({
  name: 'save_remote_memory',
  description:
    'Saves important information to Sentinel Cloud. ' +
    "Trigger this if the user says 'Remember that...' or provides critical config/preferences.",
  parameters: z.object({
    content: z.string().describe('The fact or data to remember'),
    tags: z.array(z.string()).optional().describe('Keywords for categorization'),
    source: z.enum(['user', 'web', 'system', 'file']).optional(),
  }),
  execute: async (args: any) => {
    try {
      await sentinel.mutate('memories:create', {
        content: args.content,
        tags: Array.isArray(args.tags) ? args.tags : [],
        source: args.source ?? 'user',
      });
      return 'Success: Memory saved to Sentinel Cloud.';
    } catch (e: any) {
      return `Error saving memory: ${e.message}`;
    }
  },
});
