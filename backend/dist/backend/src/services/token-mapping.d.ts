import { DatabaseManager } from '../database/schema.js';
export interface TokenMapping {
    symbol: string;
    address: string;
    name: string;
    isVerified: boolean;
}
export interface TokenInfo {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    totalSupply: string;
    createdAt: Date;
}
export declare class TokenMappingService {
    private db;
    private symbolToAddressCache;
    private addressToSymbolCache;
    private lastCacheUpdate;
    private readonly CACHE_DURATION;
    constructor(db: DatabaseManager);
    start(): Promise<void>;
    private initializeMappings;
    private syncTokensToMapping;
    private addCommonTokenMappings;
    private updateMappings;
    private updateCache;
    getAddressBySymbol(symbol: string): Promise<string | null>;
    getSymbolByAddress(address: string): Promise<string | null>;
    getAddressesBySymbols(symbols: string[]): Promise<Map<string, string>>;
    addTokenMapping(symbol: string, address: string, name: string, isVerified?: boolean): Promise<void>;
    verifyTokenMapping(symbol: string, address: string): Promise<void>;
    getMappingStats(): Promise<{
        totalMappings: number;
        verifiedMappings: number;
        unverifiedMappings: number;
        recentlyAdded: number;
    }>;
    searchTokenMappings(query: string, limit?: number): Promise<TokenMapping[]>;
}
