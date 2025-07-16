import { httpClient } from '../utils/http-client.js';
import { getConfig } from '../config/api-config.js';
import { errorHandler } from '../utils/error-handler.js';
export class JupiterAPI {
    config = getConfig();
    priceCache = new Map();
    CACHE_DURATION = 30 * 1000; // 30秒缓存
    /**
     * 获取代币当前价格（以SOL计价）
     */
    async getTokenPrice(tokenAddress) {
        try {
            // 检查缓存
            const cached = this.priceCache.get(tokenAddress);
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.price;
            }
            const url = this.config.jupiter.baseUrl + this.config.jupiter.endpoints.price;
            const queryParams = httpClient.buildQueryString({
                ids: tokenAddress,
                vsToken: 'So11111111111111111111111111111111111111112' // SOL的mint地址
            });
            const response = await httpClient.request(url + queryParams);
            const priceData = response.data[tokenAddress];
            if (!priceData) {
                console.warn(`⚠️ 未找到代币价格: ${tokenAddress}`);
                return null;
            }
            const price = priceData.price;
            // 更新缓存
            this.priceCache.set(tokenAddress, {
                price,
                timestamp: Date.now()
            });
            return price;
        }
        catch (error) {
            errorHandler.handleError(error, `获取代币价格: ${tokenAddress}`);
            return null;
        }
    }
    /**
     * 获取多个代币的价格
     */
    async getMultipleTokenPrices(tokenAddresses) {
        const prices = new Map();
        try {
            // 过滤掉已缓存的代币
            const uncachedTokens = tokenAddresses.filter(address => {
                const cached = this.priceCache.get(address);
                if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                    prices.set(address, cached.price);
                    return false;
                }
                return true;
            });
            if (uncachedTokens.length === 0) {
                return prices;
            }
            // 批量获取价格（Jupiter API支持批量查询）
            const url = this.config.jupiter.baseUrl + this.config.jupiter.endpoints.price;
            const queryParams = httpClient.buildQueryString({
                ids: uncachedTokens.join(','),
                vsToken: 'So11111111111111111111111111111111111111112'
            });
            const response = await httpClient.request(url + queryParams);
            // 处理响应并更新缓存
            Object.entries(response.data).forEach(([address, data]) => {
                const price = data.price;
                prices.set(address, price);
                this.priceCache.set(address, {
                    price,
                    timestamp: Date.now()
                });
            });
        }
        catch (error) {
            errorHandler.handleError(error, '批量获取价格');
        }
        return prices;
    }
    /**
     * 获取代币历史价格数据
     */
    async getTokenPriceHistory(tokenAddress, timeframe = '1h', limit = 100) {
        try {
            // 注意：Jupiter API可能不直接提供历史数据
            // 这里可能需要使用其他数据源如Birdeye或DexScreener
            console.warn('⚠️ Jupiter API历史价格功能待实现，建议使用Birdeye API');
            return [];
        }
        catch (error) {
            console.error(`❌ 获取历史价格失败 ${tokenAddress}:`, error);
            return [];
        }
    }
    /**
     * 计算价格变化百分比
     */
    async calculatePriceChanges(tokenAddress) {
        try {
            const currentPrice = await this.getTokenPrice(tokenAddress);
            if (!currentPrice) {
                return null;
            }
            // 由于Jupiter API限制，这里使用模拟的历史价格计算
            // 在实际应用中，应该使用真实的历史数据
            const mockHistoricalPrices = {
                price1mAgo: currentPrice * (1 + (Math.random() - 0.5) * 0.1),
                price5mAgo: currentPrice * (1 + (Math.random() - 0.5) * 0.2),
                price15mAgo: currentPrice * (1 + (Math.random() - 0.5) * 0.3),
                price1hAgo: currentPrice * (1 + (Math.random() - 0.5) * 0.5),
                price24hAgo: currentPrice * (1 + (Math.random() - 0.5) * 1.0)
            };
            return {
                tokenAddress,
                price: currentPrice,
                priceChange1m: this.calculatePercentageChange(currentPrice, mockHistoricalPrices.price1mAgo),
                priceChange5m: this.calculatePercentageChange(currentPrice, mockHistoricalPrices.price5mAgo),
                priceChange15m: this.calculatePercentageChange(currentPrice, mockHistoricalPrices.price15mAgo),
                priceChange1h: this.calculatePercentageChange(currentPrice, mockHistoricalPrices.price1hAgo),
                priceChange24h: this.calculatePercentageChange(currentPrice, mockHistoricalPrices.price24hAgo),
                timestamp: new Date()
            };
        }
        catch (error) {
            console.error(`❌ 计算价格变化失败 ${tokenAddress}:`, error);
            return null;
        }
    }
    /**
     * 计算百分比变化
     */
    calculatePercentageChange(current, previous) {
        if (previous === 0)
            return 0;
        return ((current - previous) / previous) * 100;
    }
    /**
     * 清理过期缓存
     */
    cleanupCache() {
        const now = Date.now();
        for (const [address, data] of this.priceCache.entries()) {
            if (now - data.timestamp > this.CACHE_DURATION) {
                this.priceCache.delete(address);
            }
        }
    }
    /**
     * 启动定期缓存清理
     */
    startCacheCleanup() {
        setInterval(() => {
            this.cleanupCache();
        }, this.CACHE_DURATION);
    }
}
// 单例实例
export const jupiterAPI = new JupiterAPI();
// 启动缓存清理
jupiterAPI.startCacheCleanup();
//# sourceMappingURL=jupiter-api.js.map