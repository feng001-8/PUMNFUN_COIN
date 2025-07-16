export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    retries?: number;
}
export declare class HttpClient {
    private config;
    private requestCounts;
    request<T>(url: string, options?: RequestOptions): Promise<T>;
    private checkRateLimit;
    private updateRequestCount;
    private sleep;
    buildUrl(baseUrl: string, endpoint: string, params?: Record<string, string>): string;
    buildQueryString(params: Record<string, any>): string;
}
export declare const httpClient: HttpClient;
