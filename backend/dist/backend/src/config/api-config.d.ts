export interface APIConfig {
    pumpportal: {
        websocketUrl: string;
        enabled: boolean;
        reconnectAttempts: number;
        reconnectDelay: number;
    };
    jupiter: {
        baseUrl: string;
        endpoints: {
            price: string;
            quote: string;
        };
    };
    solana: {
        rpcUrl: string;
        commitment: string;
    };
}
export declare const defaultConfig: APIConfig;
export declare const getConfig: () => APIConfig;
