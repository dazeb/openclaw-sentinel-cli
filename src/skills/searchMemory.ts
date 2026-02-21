import { z } from 'zod';
import { SentinelClient } from '../client.js';

const SearchArgs = z.object({
  query: z.string().min(1).describe('Search phrase for memory retrieval'),
  limit: z.number().int().min(1).max(20).optional(),
  tags: z.array(z.string()).optional(),
});

export const createMemorySearchSkill = (sentinel: SentinelClient) => ({
  name: 'search_remote_memory',
  description: 'Searches saved Sentinel memories by query and optional tags.',
  parameters: SearchArgs,
  execute: async (input: unknown) => {
    const args = SearchArgs.parse(input ?? {});

    const response = (await sentinel.query('memories:search', {
      query: args.query,
      limit: args.limit ?? 5,
      tags: args.tags,
      includeArchived: false,
    })) as { results?: Array<Record<string, unknown>> };

    const results = Array.isArray(response?.results) ? response.results : [];

    return {
      ok: true,
      count: results.length,
      results: results.slice(0, args.limit ?? 5),
    };
  },
});
