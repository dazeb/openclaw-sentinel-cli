import { z } from 'zod';
import { SentinelClient } from '../client.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const lastSeenMemoryByAgent = new Map<string, number>();

export const createHeartbeatSkill = (sentinel: SentinelClient) => ({
  name: 'sentinel_heartbeat',
  description: 'Checks the status of the Sentinel cloud connection. Run this periodically.',
  parameters: z.object({}),
  execute: async () => {
    const instructions: string[] = [];
    let gatewayOk = false;
    let needsBackup = false;
    let hasNewMemories = false;

    try {
      await sentinel.query('health:get', {});
      gatewayOk = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `ALERT: Gateway health check failed (${message}).`;
    }

    try {
      const backupResponse = (await sentinel.query('backups:list', {})) as {
        backups?: Array<{ createdAt?: number; _creationTime?: number; status?: string }>;
      };
      const backups = Array.isArray(backupResponse.backups) ? backupResponse.backups : [];
      const completed = backups.filter((entry) => entry.status === 'completed');

      if (completed.length === 0) {
        needsBackup = true;
      } else {
        const latestTs = Math.max(
          ...completed.map((entry) =>
            typeof entry.createdAt === 'number' ? entry.createdAt : (entry._creationTime ?? 0)
          )
        );
        needsBackup = Date.now() - latestTs > ONE_DAY_MS;
      }
    } catch {
      needsBackup = true;
    }

    try {
      const memoryResponse = (await sentinel.query('memories:search', {
        query: '',
        limit: 1,
        includeArchived: false,
      })) as {
        results?: Array<{ _creationTime?: number }>;
      };

      const latestMemoryTs = memoryResponse.results?.[0]?._creationTime;
      if (typeof latestMemoryTs === 'number') {
        const lastSeen = lastSeenMemoryByAgent.get(sentinel.agentId) ?? 0;
        hasNewMemories = latestMemoryTs > lastSeen;
        lastSeenMemoryByAgent.set(sentinel.agentId, latestMemoryTs);
      }
    } catch {
      hasNewMemories = false;
    }

    if (needsBackup) {
      instructions.push('Backup Required (Last backup > 24h ago).');
    }

    if (hasNewMemories) {
      instructions.push('New Memories Available (User updated dashboard).');
    }

    if (instructions.length === 0) {
      return gatewayOk ? 'System Nominal. Connection active.' : 'ALERT: Gateway unavailable.';
    }

    return `ALERT: ${instructions.join(' ')}`;
  },
});
