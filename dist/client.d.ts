export declare class SentinelClient {
    apiKey: string;
    baseUrl: string;
    agentId: string;
    constructor(options: {
        apiKey: string;
        agentId: string;
        baseUrl?: string;
    });
    private getRequestDetails;
    private appendQueryParams;
    private request;
    mutate(path: string, args: any): Promise<any>;
    query(path: string, args: any): Promise<any>;
}
