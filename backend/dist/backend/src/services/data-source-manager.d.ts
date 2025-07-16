import type { TokenInfo, TradingData } from '../../../shared/types/index.ts';
import type { Server } from 'socket.io';
/**
 * 数据源管理器 - 使用 PumpPortal 作为唯一数据源
 */
export declare class DataSourceManager {
    private config;
    private io?;
    private isRunning;
    constructor();
    /**
     * 设置Socket.IO实例
     */
    setSocketIO(io: Server): void;
    /**
     * 启动数据源管理器
     */
    start(): Promise<void>;
    /**
     * 停止数据源管理器
     */
    stop(): Promise<void>;
    /**
     * 初始化数据源
     */
    private initializeDataSource;
    /**
     * 获取最新代币列表
     */
    getNewTokens(limit?: number, offset?: number): Promise<TokenInfo[]>;
    /**
     * 获取特定代币信息
     */
    getTokenInfo(address: string): Promise<TokenInfo | null>;
    /**
     * 计算交易数据
     */
    calculateTradingData(address: string): Promise<TradingData | null>;
    /**
     * 检查金狗条件
     */
    checkGoldenDogCriteria(address: string): Promise<{
        isGoldenDog: boolean;
        score: number;
        reasons: string[];
    }>;
    /**
     * 订阅新代币事件
     */
    onNewToken(listener: (token: TokenInfo) => void): void;
    /**
     * 订阅交易事件
     */
    onTrade(listener: (trade: any) => void): void;
    /**
     * 订阅特定代币交易
     */
    subscribeTokenTrades(tokenAddress: string): void;
    /**
     * 获取当前数据源
     */
    getCurrentDataSource(): string;
    /**
     * 获取数据源状态
     */
    getDataSourceStatus(): {
        current: string;
        pumpPortalConnected: boolean;
    };
}
export declare const dataSourceManager: DataSourceManager;
