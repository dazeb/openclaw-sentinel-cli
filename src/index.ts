import { SentinelClient } from './client.js';
import { createMemorySkill } from './skills/remoteMemory.js';
import { createMemorySearchSkill } from './skills/searchMemory.js';
import { createBackupSkill } from './skills/backupBrain.js';
import { createHeartbeatSkill } from './skills/sentinelHeartbeat.js';

export class Sentinel {
  private client: SentinelClient;
  public skills: any[];

  constructor(config: { apiKey?: string; baseUrl?: string; agentId?: string; workspaceDir?: string }) {
    const apiKey = config.apiKey || process.env.SENTINEL_API_KEY;
    const baseUrl = config.baseUrl || process.env.SENTINEL_API_BASE_URL;
    const agentId = config.agentId || process.env.SENTINEL_AGENT_ID || process.env.AGENT_ID || 'default-agent';
    const workspaceDir = config.workspaceDir || process.env.OPENCLAW_WORKSPACE_DIR;

    if (!apiKey) {
      throw new Error('Sentinel Error: SENTINEL_API_KEY is not set.');
    }

    this.client = new SentinelClient({ apiKey, baseUrl, agentId });

    this.skills = [
      createMemorySkill(this.client),
      createMemorySearchSkill(this.client),
      createBackupSkill(this.client, { workspaceDir }),
      createHeartbeatSkill(this.client),
    ];
  }
}
