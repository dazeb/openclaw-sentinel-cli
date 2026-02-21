import { SentinelClient } from './client.js';
import { createBackupSkill } from './skills/backupBrain.js';
import { createHeartbeatSkill } from './skills/sentinelHeartbeat.js';
import { createMemorySkill } from './skills/remoteMemory.js';
import { createMemorySearchSkill } from './skills/searchMemory.js';
const toolSchemas = {
    save_remote_memory: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The fact or data to remember',
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Keywords for categorization',
            },
            source: {
                type: 'string',
                enum: ['user', 'web', 'system', 'file'],
                description: 'Optional memory source',
            },
        },
        required: ['content'],
        additionalProperties: false,
    },
    search_remote_memory: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                minLength: 1,
                description: 'Search phrase for memory retrieval',
            },
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 20,
                description: 'Maximum number of results to return (default 5)',
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tag filters',
            },
        },
        required: ['query'],
        additionalProperties: false,
    },
    backup_brain: {
        type: 'object',
        properties: {
            trigger: {
                type: 'string',
                enum: ['manual', 'scheduled'],
                description: 'Reason for backup',
            },
            workspaceDir: {
                type: 'string',
                minLength: 1,
                description: 'Optional explicit OpenClaw workspace directory containing AGENTS.md/IDENTITY.md/SOUL.md/TOOLS.md/USER.md',
            },
        },
        required: ['trigger'],
        additionalProperties: false,
    },
    sentinel_heartbeat: {
        type: 'object',
        properties: {},
        additionalProperties: false,
    },
};
export async function register(api) {
    const configGetter = api.getConfig;
    const config = typeof configGetter === 'function' ? (configGetter.call(api) ?? {}) : {};
    const apiKey = config.apiKey ?? process.env.SENTINEL_API_KEY;
    const baseUrl = config.baseUrl ?? process.env.SENTINEL_API_BASE_URL;
    const agentId = config.agentId ?? process.env.SENTINEL_AGENT_ID ?? process.env.AGENT_ID ?? 'default-agent';
    const workspaceDir = config.workspaceDir ?? process.env.OPENCLAW_WORKSPACE_DIR;
    const notConfiguredMessage = "Sentinel API key is not configured. Set plugin config 'apiKey' or SENTINEL_API_KEY, then reload plugins.";
    const client = apiKey ? new SentinelClient({ apiKey, baseUrl, agentId }) : null;
    const skills = client
        ? [
            createMemorySkill(client),
            createMemorySearchSkill(client),
            createBackupSkill(client, { workspaceDir }),
            createHeartbeatSkill(client),
        ]
        : [
            {
                name: 'save_remote_memory',
                description: "Saves important information to Sentinel Cloud. Trigger this if the user says 'Remember that...' or provides critical config/preferences.",
                execute: async () => notConfiguredMessage,
            },
            {
                name: 'search_remote_memory',
                description: 'Searches saved Sentinel memories by query and optional tags.',
                execute: async () => notConfiguredMessage,
            },
            {
                name: 'backup_brain',
                description: 'Uploads critical agent identity files (IDENTITY.md, etc.) to the cloud.',
                execute: async () => notConfiguredMessage,
            },
            {
                name: 'sentinel_heartbeat',
                description: 'Checks the status of the Sentinel cloud connection. Run this periodically.',
                execute: async () => notConfiguredMessage,
            },
        ];
    const registerToolFn = api.registerTool ??
        api.tool?.register;
    if (typeof registerToolFn !== 'function') {
        throw new Error('Unsupported OpenClaw PluginAPI: registerTool is unavailable.');
    }
    for (const skill of skills) {
        registerToolFn({
            name: skill.name,
            description: skill.description,
            annotations: {
                readOnlyHint: skill.name === 'sentinel_heartbeat' || skill.name === 'search_remote_memory',
                destructiveHint: false,
                idempotentHint: skill.name === 'sentinel_heartbeat',
                openWorldHint: false,
            },
            inputSchema: toolSchemas[skill.name] ?? {
                type: 'object',
                properties: {},
                additionalProperties: false,
            },
            execute: async (params) => {
                try {
                    return await skill.execute(params ?? {});
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    return `Sentinel tool '${skill.name}' failed: ${message}. Verify SENTINEL_API_KEY, baseUrl, and gateway scope.`;
                }
            },
        });
    }
}
//# sourceMappingURL=openclaw.js.map