export declare class Sentinel {
    private client;
    skills: any[];
    constructor(config: {
        apiKey?: string;
        baseUrl?: string;
        agentId?: string;
        workspaceDir?: string;
    });
}
