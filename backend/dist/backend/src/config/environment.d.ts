export interface EnvironmentConfig {
    server: {
        port: number;
        host: string;
        nodeEnv: 'development' | 'production' | 'test';
    };
    database: {
        path: string;
        backupInterval: number;
    };
    api: {
        jupiter: {
            baseUrl: string;
            cacheDuration: number;
        };
        solana: {
            rpcUrl: string;
            commitment: string;
        };
    };
    monitoring: {
        scanNewTokensInterval: number;
        updatePriceInterval: number;
        updateTradingInterval: number;
        checkAlertsInterval: number;
    };
    alerts: {
        goldenDog: {
            priceChange5m: number;
            volumeChange: number;
            minLiquidity: number;
            minScore: number;
        };
        risk: {
            priceDrop5m: number;
            volumeDrop: number;
            liquidityDrop: number;
        };
    };
    logging: {
        level: string;
        filePath: string;
        maxFiles: number;
        maxSize: string;
    };
    cors: {
        origins: string[];
    };
    socket: {
        corsOrigins: string[];
    };
    performance: {
        httpTimeout: number;
        httpMaxRetries: number;
        cacheMaxSize: number;
        cacheTtl: number;
    };
    development: {
        enableMockData: boolean;
        enableVerboseLogging: boolean;
        enablePerformanceMonitoring: boolean;
    };
    twitter?: {
        bearerToken?: string;
        apiKey?: string;
        apiSecret?: string;
        accessToken?: string;
        accessSecret?: string;
        searchInterval: number;
        maxTweets: number;
        influencerMonitorInterval: number;
        enableSentimentAnalysis: boolean;
    };
}
export declare const environment: EnvironmentConfig;
export declare function validateConfig(): void;
export declare function printConfig(): void;
export default environment;
