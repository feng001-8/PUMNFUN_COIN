import { logger } from '../utils/logger.js';
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js';
/**
 * 价格计算服务 - 根据交易数据计算价格变化和技术指标
 */
export class PriceCalculator {
    db;
    isRunning = false;
    calculationInterval;
    constructor(db) {
        this.db = db;
        logger.info('📊 价格计算服务已初始化');
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        logger.info('📊 价格计算服务启动');
        // 立即执行一次计算
        await this.calculateAllPriceData();
        // 每分钟计算一次价格数据
        this.calculationInterval = setInterval(async () => {
            try {
                await this.calculateAllPriceData();
            }
            catch (error) {
                await enhancedErrorHandler.handleError(error, 'calculateAllPriceData定时任务');
            }
        }, 60000); // 1分钟
    }
    async stop() {
        this.isRunning = false;
        if (this.calculationInterval) {
            clearInterval(this.calculationInterval);
        }
        logger.info('📊 价格计算服务停止');
    }
    /**
     * 计算所有活跃代币的价格数据
     */
    async calculateAllPriceData() {
        try {
            const db = this.db.getDb();
            // 获取所有活跃代币
            const tokensStmt = db.prepare('SELECT address FROM tokens WHERE is_active = 1');
            const tokens = tokensStmt.all();
            logger.debug(`📊 开始计算 ${tokens.length} 个代币的价格数据`);
            for (const token of tokens) {
                await this.calculateTokenPriceData(token.address);
                await this.calculateTokenTradingData(token.address);
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'calculateAllPriceData');
        }
    }
    /**
     * 计算单个代币的价格数据
     */
    async calculateTokenPriceData(tokenAddress) {
        try {
            const db = this.db.getDb();
            // 获取最近的交易数据
            const tradesStmt = db.prepare(`
        SELECT price_per_token, timestamp 
        FROM trades 
        WHERE token_address = ? 
        ORDER BY timestamp DESC 
        LIMIT 100
      `);
            const trades = tradesStmt.all(tokenAddress);
            if (trades.length === 0)
                return;
            const currentPrice = trades[0].price_per_token;
            const now = new Date();
            // 计算不同时间段的价格变化
            const priceChange1m = this.calculatePriceChange(trades, 1); // 1分钟
            const priceChange5m = this.calculatePriceChange(trades, 5); // 5分钟
            const priceChange15m = this.calculatePriceChange(trades, 15); // 15分钟
            const priceChange1h = this.calculatePriceChange(trades, 60); // 1小时
            const priceChange24h = this.calculatePriceChange(trades, 1440); // 24小时
            // 插入或更新价格数据
            const priceStmt = db.prepare(`
        INSERT OR REPLACE INTO price_data (
          token_address, price, price_change_1m, price_change_5m,
          price_change_15m, price_change_1h, price_change_24h, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            priceStmt.run(tokenAddress, currentPrice, priceChange1m, priceChange5m, priceChange15m, priceChange1h, priceChange24h, now.toISOString());
            logger.debug(`📊 更新价格数据: ${tokenAddress}, 当前价格: ${currentPrice}, 5分钟变化: ${priceChange5m?.toFixed(2)}%`);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'calculateTokenPriceData', { tokenAddress });
        }
    }
    /**
     * 计算单个代币的交易数据
     */
    async calculateTokenTradingData(tokenAddress) {
        try {
            const db = this.db.getDb();
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            // 获取24小时内的交易数据
            const tradesStmt = db.prepare(`
        SELECT sol_amount, token_amount, trader_address, timestamp
        FROM trades 
        WHERE token_address = ? AND timestamp > ?
        ORDER BY timestamp DESC
      `);
            const trades = tradesStmt.all(tokenAddress, oneDayAgo.toISOString());
            if (trades.length === 0)
                return;
            // 计算24小时交易量
            const volume24h = trades.reduce((sum, trade) => sum + trade.sol_amount, 0);
            // 计算交易笔数
            const txCount24h = trades.length;
            // 计算活跃交易者数量
            const uniqueTraders = new Set(trades.map(t => t.trader_address));
            const activeTraders = uniqueTraders.size;
            // 计算交易量变化（与前一天比较）
            const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            const previousDayTradesStmt = db.prepare(`
        SELECT sol_amount FROM trades 
        WHERE token_address = ? AND timestamp BETWEEN ? AND ?
      `);
            const previousDayTrades = previousDayTradesStmt.all(tokenAddress, twoDaysAgo.toISOString(), oneDayAgo.toISOString());
            const previousVolume = previousDayTrades.reduce((sum, trade) => sum + trade.sol_amount, 0);
            const volumeChange = previousVolume > 0 ? ((volume24h - previousVolume) / previousVolume) * 100 : 0;
            // 估算流动性（基于最近交易的平均规模）
            const avgTradeSize = volume24h / Math.max(txCount24h, 1);
            const liquidity = avgTradeSize * 10; // 简单估算
            // 插入或更新交易数据
            const tradingStmt = db.prepare(`
        INSERT OR REPLACE INTO trading_data (
          token_address, volume_24h, volume_change, tx_count_24h,
          active_traders, liquidity, liquidity_change, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            tradingStmt.run(tokenAddress, volume24h, volumeChange, txCount24h, activeTraders, liquidity, 0, // 流动性变化暂时设为0
            now.toISOString());
            logger.debug(`📊 更新交易数据: ${tokenAddress}, 24h交易量: ${volume24h.toFixed(2)} SOL, 交易量变化: ${volumeChange.toFixed(2)}%`);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'calculateTokenTradingData', { tokenAddress });
        }
    }
    /**
     * 计算价格变化百分比
     */
    calculatePriceChange(trades, minutesAgo) {
        if (trades.length < 2)
            return null;
        const now = new Date();
        const targetTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
        const currentPrice = trades[0].price_per_token;
        // 找到最接近目标时间的交易
        let closestTrade = trades[0];
        let minTimeDiff = Math.abs(new Date(trades[0].timestamp).getTime() - targetTime.getTime());
        for (const trade of trades) {
            const tradeTime = new Date(trade.timestamp);
            const timeDiff = Math.abs(tradeTime.getTime() - targetTime.getTime());
            if (timeDiff < minTimeDiff && tradeTime <= targetTime) {
                minTimeDiff = timeDiff;
                closestTrade = trade;
            }
        }
        if (closestTrade.price_per_token === 0)
            return null;
        const priceChange = ((currentPrice - closestTrade.price_per_token) / closestTrade.price_per_token) * 100;
        return priceChange;
    }
    /**
     * 手动触发价格计算
     */
    async triggerCalculation() {
        logger.info('📊 手动触发价格计算');
        await this.calculateAllPriceData();
    }
    /**
     * 更新单个代币的价格（由交易事件触发）
     */
    async updatePrice(tokenAddress, price) {
        try {
            // 触发该代币的价格数据计算
            await this.calculateTokenPriceData(tokenAddress);
            await this.calculateTokenTradingData(tokenAddress);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'updatePrice', { tokenAddress, price });
        }
    }
}
//# sourceMappingURL=price-calculator.js.map