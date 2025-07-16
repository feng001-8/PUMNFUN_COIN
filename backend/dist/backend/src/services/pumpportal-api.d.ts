import { DatabaseManager } from '../database/schema.js';
import type { TokenInfo, TradingData } from '../../../shared/types/index.ts';
interface PumpPortalTradeEvent {
    mint: string;
    solAmount: number;
    tokenAmount: number;
    isBuy: boolean;
    user: string;
    timestamp: number;
    signature: string;
}
export declare class PumpPortalAPI {
    private ws;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private isConnecting;
    private db;
    private newTokens;
    private tokenTrades;
    private maxCacheSize;
    private tokenListeners;
    private tradeListeners;
    constructor(db: DatabaseManager);
    /**
     * 连接到 PumpPortal WebSocket
     */
    private connect;
    /**
     * 订阅事件
     */
    private subscribeToEvents;
    /**
     * 处理 WebSocket 消息
     */
    private handleMessage;
    /**
     * 转换 PumpPortal 事件为 TokenInfo
     */
    private transformTokenEvent;
    /**
     * 添加新代币到缓存
     */
    private addNewToken;
    /**
     * 添加交易到缓存
     */
    private addTrade;
    /**
     * 保存交易数据到数据库
     */
    private saveTradeToDatabase;
    /**
     * 计划重连
     */
    private scheduleReconnect;
    /**
     * 获取最新代币列表
     */
    getNewTokens(limit?: number, offset?: number): Promise<TokenInfo[]>;
    /**
     * 获取特定代币信息
     */
    getTokenInfo(address: string): Promise<TokenInfo | null>;
    /**
     * 获取代币交易数据
     */
    getTokenTrades(address: string, limit?: number): Promise<PumpPortalTradeEvent[]>;
    /**
     * 计算交易数据指标
     */
    calculateTradingData(address: string): Promise<TradingData | null>;
    /**
     * 订阅特定代币的交易事件
     */
    subscribeTokenTrades(tokenAddress: string): void;
    /**
     * 添加代币监听器
     */
    onNewToken(listener: (token: TokenInfo) => void): void;
    /**
     * 添加交易监听器
     */
    onTrade(listener: (trade: PumpPortalTradeEvent) => void): void;
    /**
     * 检查连接状态
     */
    isConnected(): boolean;
    /**
     * 关闭连接
     */
    disconnect(): void;
    /**
     * 检查金狗条件（使用缓存数据）
     */
    checkGoldenDogCriteria(address: string): Promise<{
        isGoldenDog: boolean;
        score: number;
        reasons: string[];
    }>;
}
export declare const createPumpPortalAPI: (db: DatabaseManager) => PumpPortalAPI;
export declare const getPumpPortalAPI: () => PumpPortalAPI;
export declare const initializePumpPortalAPI: (db: DatabaseManager) => PumpPortalAPI;
export declare const pumpPortalAPI: {
    readonly instance: PumpPortalAPI;
};
export {};
