import { DatabaseManager } from '../database/schema.js';
export declare class PumpFunCollector {
    private connection;
    private db;
    private isRunning;
    constructor(db: DatabaseManager);
    start(): Promise<void>;
    stop(): Promise<void>;
    private scanNewTokens;
    private updatePriceData;
    private updateTradingData;
    private getMockTokenData;
    private fetchPriceData;
    private fetchTradingData;
    private getActiveTokens;
    private isTokenExists;
    private saveTokenInfo;
    private savePriceData;
    private saveTradingData;
}
