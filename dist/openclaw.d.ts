type SentinelPluginConfig = {
    apiKey?: string;
    baseUrl?: string;
    agentId?: string;
    workspaceDir?: string;
};
type ToolRegistration = {
    name: string;
    description: string;
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
    inputSchema: Record<string, unknown>;
    execute: (params: Record<string, unknown>) => Promise<unknown>;
};
type PluginAPI = {
    getConfig: <T = SentinelPluginConfig>() => T;
    registerTool: (tool: ToolRegistration) => void;
};
export declare function register(api: PluginAPI): Promise<void>;
export {};
