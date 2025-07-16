import { DatabaseManager } from '../database/schema.js';
import type { Server } from 'socket.io';
export interface KOLInfo {
    id?: number;
    walletAddress: string;
    name?: string;
    category: 'trader' | 'influencer' | 'institution';
    influenceScore: number;
    successRate: number;
    totalTrades: number;
    profitableTrades: number;
    avgProfitRate: number;
    followersCount: number;
    verified: boolean;
    tags: string[];
    socialLinks: {
        twitter?: string;
        telegram?: string;
        discord?: string;
        website?: string;
    };
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface KOLTransaction {
    id?: number;
    kolWalletAddress: string;
    tokenAddress: string;
    transactionHash: string;
    action: 'buy' | 'sell';
    amount: number;
    price: number;
    valueSol: number;
    timestamp: Date;
    profitLoss?: number;
    holdingPeriod?: number;
    createdAt?: Date;
}
export interface KOLSignal {
    kolWalletAddress: string;
    kolName: string;
    tokenAddress: string;
    tokenSymbol: string;
    action: 'buy' | 'sell';
    amount: number;
    price: number;
    valueSol: number;
    confidence: number;
    reasoning: string;
    timestamp: Date;
}
export declare class KOLTracker {
    private db;
    private io?;
    private isRunning;
    private monitoredKOLs;
    constructor(db: DatabaseManager);
    setSocketIO(io: Server): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    addKOL(kolInfo: Omit<KOLInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>;
    recordKOLTransaction(transaction: Omit<KOLTransaction, 'id' | 'createdAt'>): Promise<void>;
    private generateKOLSignal;
    private calculateSignalConfidence;
    private generateSignalReasoning;
    private getKOLInfo;
    private getTokenInfo;
    private loadActiveKOLs;
    private initializeDefaultKOLs;
    private updateKOLStatistics;
    getAllKOLs(limit?: number, offset?: number): Promise<KOLInfo[]>;
    getKOLTransactions(walletAddress: string, limit?: number): Promise<KOLTransaction[]>;
}
