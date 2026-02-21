export class SentinelClient {
    apiKey;
    baseUrl;
    agentId;
    constructor(options) {
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl ?? 'https://api.openclawsentinel.com';
        this.agentId = options.agentId;
    }
    getRequestDetails(path) {
        switch (path) {
            case 'health:get':
                return { method: 'GET', endpoint: '/v1/health' };
            case 'agents:getHeartbeatStatus':
                return { method: 'GET', endpoint: '/v1/agents/heartbeat' };
            case 'memories:create':
            case 'memories:saveThought':
                return { method: 'POST', endpoint: '/v1/memories' };
            case 'memories:search':
                return { method: 'GET', endpoint: '/v1/memories/search' };
            case 'backups:create':
            case 'backups:createSnapshot':
                return { method: 'POST', endpoint: '/v1/backups' };
            case 'backups:list':
                return { method: 'GET', endpoint: '/v1/backups' };
            case 'audit_logs:ingest':
                return { method: 'POST', endpoint: '/v1/audit-logs' };
            case 'secrets:store':
                return { method: 'POST', endpoint: '/v1/secrets/store' };
            case 'secrets:retrieveAll':
                return { method: 'POST', endpoint: '/v1/secrets/retrieve' };
            default:
                throw new Error(`Unsupported Sentinel API path: ${path}`);
        }
    }
    appendQueryParams(url, args) {
        for (const [key, value] of Object.entries(args)) {
            if (value === undefined || value === null) {
                continue;
            }
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                url.searchParams.set(key, String(value));
            }
        }
    }
    async request(path, args) {
        const { method, endpoint } = this.getRequestDetails(path);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        const payload = { ...args };
        const url = new URL(endpoint, this.baseUrl);
        if (method === 'GET') {
            this.appendQueryParams(url, payload);
        }
        try {
            const response = await fetch(url.toString(), {
                method,
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: method === 'GET' ? undefined : JSON.stringify(payload),
                signal: controller.signal,
            });
            const text = await response.text();
            const result = text ? JSON.parse(text) : null;
            if (!response.ok) {
                const detail = typeof result?.error === 'string'
                    ? result.error
                    : `HTTP ${response.status} from Sentinel API`;
                throw new Error(detail);
            }
            return result;
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Sentinel API request timed out after 10 seconds');
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async mutate(path, args) {
        return this.request(path, args ?? {});
    }
    async query(path, args) {
        return this.request(path, args ?? {});
    }
}
//# sourceMappingURL=client.js.map