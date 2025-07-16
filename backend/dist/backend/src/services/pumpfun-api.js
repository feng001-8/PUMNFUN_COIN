import { httpClient } from '../utils/http-client.js';
import { getConfig } from '../config/api-config.js';
import { errorHandler } from '../utils/error-handler.js';
export class PumpFunAPI {
    config = getConfig();
    /**
     * 获取最新的代币列表
     */
    async getNewTokens(limit = 50, offset = 0) {
        try {
            const url = this.config.pumpfun.baseUrl + this.config.pumpfun.endpoints.newTokens;
            const queryParams = httpClient.buildQueryString({
                offset,
                limit,
                sort: 'created_timestamp',
                order: 'DESC',
                includeNsfw: false
            });
            const response = await httpClient.request(url + queryParams);
            return response.map(token => this.transformTokenResponse(token));
        }
        catch (error) {
            errorHandler.handleError(error, '获取最新代币');
            return [];
        }
    }
    /**
     * 获取特定代币信息
     */
    async getTokenInfo(address) {
        try {
            const url = httpClient.buildUrl(this.config.pumpfun.baseUrl, this.config.pumpfun.endpoints.tokenInfo, { address });
            const response = await httpClient.request(url);
            return this.transformTokenResponse(response);
        }
        catch (error) {
            errorHandler.handleError(error, `获取代币信息: ${address}`);
            return null;
        }
    }
    /**
     * 获取代币交易数据
     */
    async getTokenTrades(address, limit = 100) {
        try {
            const url = httpClient.buildUrl(this.config.pumpfun.baseUrl, this.config.pumpfun.endpoints.tradingData, { address });
            const queryParams = httpClient.buildQueryString({ limit });
            const response = await httpClient.request(url + queryParams);
            return response;
        }
        catch (error) {
            errorHandler.handleError(error, `获取交易数据: ${address}`);
            return [];
        }
    }
    /**
     * 计算交易数据指标
     */
    async calculateTradingData(address) {
        try {
            const trades = await this.getTokenTrades(address, 1000);
            const now = Date.now();
            const oneDayAgo = now - 24 * 60 * 60 * 1000;
            const oneHourAgo = now - 60 * 60 * 1000;
            // 过滤24小时内的交易
            const trades24h = trades.filter(trade => trade.timestamp * 1000 > oneDayAgo);
            const trades1h = trades.filter(trade => trade.timestamp * 1000 > oneHourAgo);
            // 计算24小时交易量
            const volume24h = trades24h.reduce((sum, trade) => {
                return sum + trade.sol_amount;
            }, 0);
            // 计算1小时前的交易量用于比较
            const volumePrevious = trades.filter(trade => {
                const tradeTime = trade.timestamp * 1000;
                return tradeTime > oneDayAgo - 60 * 60 * 1000 && tradeTime <= oneDayAgo;
            }).reduce((sum, trade) => sum + trade.sol_amount, 0);
            const volumeChange = volumePrevious > 0 ? ((volume24h - volumePrevious) / volumePrevious) * 100 : 0;
            // 计算活跃交易者
            const uniqueTraders = new Set(trades24h.map(trade => trade.user)).size;
            // 获取代币信息以计算流动性
            const tokenInfo = await this.getTokenInfo(address);
            const liquidity = tokenInfo ? this.calculateLiquidity(tokenInfo) : 0;
            return {
                tokenAddress: address,
                volume24h,
                volumeChange,
                txCount24h: trades24h.length,
                activeTraders: uniqueTraders,
                liquidity,
                liquidityChange: 0, // 需要历史数据来计算
                timestamp: new Date()
            };
        }
        catch (error) {
            errorHandler.handleError(error, `计算交易数据: ${address}`);
            return null;
        }
    }
    /**
     * 转换PumpFun API响应为内部TokenInfo格式
     */
    transformTokenResponse(token) {
        return {
            address: token.mint,
            name: token.name,
            symbol: token.symbol,
            decimals: 6, // PumpFun代币通常是6位小数
            totalSupply: token.total_supply.toString(),
            createdAt: new Date(token.created_timestamp),
            creatorAddress: token.creator,
            initialLiquidity: token.virtual_sol_reserves,
            socialLinks: {
                twitter: token.twitter,
                telegram: token.telegram,
                website: token.website
            },
            isActive: token.is_currently_live && !token.complete
        };
    }
    /**
     * 计算流动性（基于虚拟储备）
     */
    calculateLiquidity(token) {
        // PumpFun使用bonding curve，流动性基于虚拟SOL储备
        return token.virtual_sol_reserves || 0;
    }
    /**
     * 检查代币是否符合金狗条件
     */
    async checkGoldenDogCriteria(address) {
        try {
            const tokenInfo = await this.getTokenInfo(address);
            const tradingData = await this.calculateTradingData(address);
            if (!tokenInfo || !tradingData) {
                return { isGoldenDog: false, score: 0, reasons: ['数据获取失败'] };
            }
            const reasons = [];
            let score = 0;
            // 检查流动性（> 10 SOL）
            if (tradingData.liquidity > 10) {
                score += 20;
                reasons.push(`流动性充足: ${tradingData.liquidity.toFixed(2)} SOL`);
            }
            // 检查交易量增长（> 300%）
            if (tradingData.volumeChange > 300) {
                score += 30;
                reasons.push(`交易量暴增: ${tradingData.volumeChange.toFixed(2)}%`);
            }
            // 检查活跃交易者数量（> 50）
            if (tradingData.activeTraders > 50) {
                score += 25;
                reasons.push(`活跃交易者众多: ${tradingData.activeTraders}人`);
            }
            // 检查24小时交易量（> 100 SOL）
            if (tradingData.volume24h > 100) {
                score += 25;
                reasons.push(`24h交易量: ${tradingData.volume24h.toFixed(2)} SOL`);
            }
            const isGoldenDog = score >= 70;
            return {
                isGoldenDog,
                score,
                reasons
            };
        }
        catch (error) {
            errorHandler.handleError(error, `检查金狗条件: ${address}`);
            return { isGoldenDog: false, score: 0, reasons: ['检查失败'] };
        }
    }
}
// 单例实例
export const pumpFunAPI = new PumpFunAPI();
//# sourceMappingURL=pumpfun-api.js.map