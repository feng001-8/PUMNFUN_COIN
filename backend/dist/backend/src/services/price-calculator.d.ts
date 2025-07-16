import { DatabaseManager } from '../database/schema.js';
/**
 * 价格计算服务 - 根据交易数据计算价格变化和技术指标
 */
export declare class PriceCalculator {
    private db;
    private isRunning;
    private calculationInterval?;
    constructor(db: DatabaseManager);
    start(): Promise<void>;
    stop(): Promise<void>;
    /**
     * 计算所有活跃代币的价格数据
     */
    private calculateAllPriceData;
    /**
     * 计算单个代币的价格数据
     */
    private calculateTokenPriceData;
    /**
     * 计算单个代币的交易数据
     */
    private calculateTokenTradingData;
    /**
     * 计算价格变化百分比
     */
    private calculatePriceChange;
    /**
     * 手动触发价格计算
     */
    triggerCalculation(): Promise<void>;
    /**
     * 更新单个代币的价格（由交易事件触发）
     */
    updatePrice(tokenAddress: string, price: number): Promise<void>;
}
