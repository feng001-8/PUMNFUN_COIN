import type { PriceData } from '../../../shared/types/index.ts';
export declare class JupiterAPI {
    private config;
    private priceCache;
    private readonly CACHE_DURATION;
    /**
     * 获取代币当前价格（以SOL计价）
     */
    getTokenPrice(tokenAddress: string): Promise<number | null>;
    /**
     * 获取多个代币的价格
     */
    getMultipleTokenPrices(tokenAddresses: string[]): Promise<Map<string, number>>;
    /**
     * 获取代币历史价格数据
     */
    getTokenPriceHistory(tokenAddress: string, timeframe?: '1m' | '5m' | '15m' | '1h' | '24h', limit?: number): Promise<Array<{
        timestamp: Date;
        price: number;
    }>>;
    /**
     * 计算价格变化百分比
     */
    calculatePriceChanges(tokenAddress: string): Promise<PriceData | null>;
    /**
     * 计算百分比变化
     */
    private calculatePercentageChange;
    /**
     * 清理过期缓存
     */
    private cleanupCache;
    /**
     * 启动定期缓存清理
     */
    startCacheCleanup(): void;
}
export declare const jupiterAPI: JupiterAPI;
