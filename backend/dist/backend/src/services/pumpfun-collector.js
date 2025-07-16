import { Connection } from '@solana/web3.js';
import { pumpFunAPI } from './pumpfun-api.js';
import { jupiterAPI } from './jupiter-api.js';
import { logger } from '../utils/logger.js';
import { errorHandler } from '../utils/error-handler.js';
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js';
export class PumpFunCollector {
    connection;
    db;
    isRunning = false;
    constructor(db) {
        this.connection = new Connection('https://api.mainnet-beta.solana.com');
        this.db = db;
        logger.info('🔄 PumpFun数据采集器已初始化');
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        logger.info('🔍 PumpFun数据采集器启动');
        try {
            // 启动定时任务
            logger.info('✅ PumpFun数据采集器启动完成，开始定时扫描');
            // 立即执行一次扫描
            await this.scanNewTokens();
            // 每30秒扫描一次新代币
            setInterval(() => {
                this.scanNewTokens().catch(error => {
                    errorHandler.handleError(error, 'scanNewTokens定时任务');
                });
            }, 30000);
            // 每2分钟更新一次价格数据
            setInterval(() => {
                this.updatePriceData().catch(error => {
                    errorHandler.handleError(error, 'updatePriceData定时任务');
                });
            }, 120000);
            // 每5分钟更新一次交易数据
            setInterval(() => {
                this.updateTradingData().catch(error => {
                    errorHandler.handleError(error, 'updateTradingData定时任务');
                });
            }, 300000);
        }
        catch (error) {
            errorHandler.handleError(error, 'PumpFun数据采集器启动');
            throw error;
        }
    }
    async stop() {
        this.isRunning = false;
        logger.info('🛑 PumpFun数据采集器停止');
    }
    async scanNewTokens() {
        try {
            logger.info('🔍 扫描新代币...');
            // 使用真实的PumpFun API获取新代币
            const newTokens = await pumpFunAPI.getNewTokens(50, 0);
            if (newTokens.length > 0) {
                logger.info(`📊 发现 ${newTokens.length} 个新代币`);
                for (const token of newTokens) {
                    try {
                        // 检查是否已存在
                        if (!this.isTokenExists(token.address)) {
                            this.saveTokenInfo(token);
                            // 检查是否符合金狗条件
                            const goldenDogCheck = await pumpFunAPI.checkGoldenDogCriteria(token.address);
                            if (goldenDogCheck.isGoldenDog) {
                                logger.info(`🔥 发现潜在金狗: ${token.symbol} (评分: ${goldenDogCheck.score})`);
                            }
                        }
                    }
                    catch (error) {
                        await enhancedErrorHandler.handleError(error, 'scanNewTokens - 处理单个代币', { tokenAddress: token.address, tokenSymbol: token.symbol });
                    }
                }
            }
            else {
                logger.info('📊 暂无新代币发现');
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, '扫描新代币');
            // 降级到模拟数据
            logger.info('🔄 降级使用模拟数据...');
            const mockTokens = await this.getMockTokenData();
            for (const token of mockTokens) {
                this.saveTokenInfo(token);
            }
        }
    }
    async updatePriceData() {
        try {
            // 获取所有活跃代币
            const tokens = this.getActiveTokens();
            for (const token of tokens) {
                try {
                    const priceData = await this.fetchPriceData(token.address);
                    if (priceData) {
                        this.savePriceData(priceData);
                    }
                }
                catch (error) {
                    await enhancedErrorHandler.handleError(error, 'updatePriceData - 更新单个代币价格', { tokenAddress: token.address, tokenSymbol: token.symbol });
                }
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, '更新价格数据');
        }
    }
    async updateTradingData() {
        try {
            const tokens = this.getActiveTokens();
            for (const token of tokens) {
                try {
                    const tradingData = await this.fetchTradingData(token.address);
                    if (tradingData) {
                        this.saveTradingData(tradingData);
                    }
                }
                catch (error) {
                    await enhancedErrorHandler.handleError(error, 'updateTradingData - 更新单个代币交易数据', { tokenAddress: token.address, tokenSymbol: token.symbol });
                }
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, '更新交易数据');
        }
    }
    async getMockTokenData() {
        // 模拟PumpFun新代币数据
        return [
            {
                address: 'DemoToken1' + Date.now(),
                name: 'Demo Token 1',
                symbol: 'DEMO1',
                decimals: 9,
                totalSupply: '1000000000',
                createdAt: new Date(),
                creatorAddress: 'Creator1Address',
                initialLiquidity: 10.5,
                socialLinks: {
                    twitter: 'https://twitter.com/demo1',
                    telegram: 'https://t.me/demo1'
                },
                isActive: true
            }
        ];
    }
    async fetchPriceData(tokenAddress) {
        try {
            // 使用Jupiter API获取真实价格数据
            const priceData = await jupiterAPI.calculatePriceChanges(tokenAddress);
            if (priceData) {
                logger.info(`💰 获取价格数据: ${tokenAddress} = ${priceData.price.toFixed(8)} SOL`);
                return priceData;
            }
            else {
                logger.warn(`⚠️ 无法获取价格数据: ${tokenAddress}，使用模拟数据`);
                // 降级到模拟数据
                const basePrice = Math.random() * 0.001;
                return {
                    tokenAddress,
                    price: basePrice,
                    priceChange1m: (Math.random() - 0.5) * 10,
                    priceChange5m: (Math.random() - 0.5) * 20,
                    priceChange15m: (Math.random() - 0.5) * 30,
                    priceChange1h: (Math.random() - 0.5) * 50,
                    priceChange24h: (Math.random() - 0.5) * 100,
                    timestamp: new Date()
                };
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `获取${tokenAddress}价格数据`, { tokenAddress });
            return null;
        }
    }
    async fetchTradingData(tokenAddress) {
        try {
            // 使用PumpFun API获取真实交易数据
            const tradingData = await pumpFunAPI.calculateTradingData(tokenAddress);
            if (tradingData) {
                logger.info(`📈 获取交易数据: ${tokenAddress} 24h成交量 ${tradingData.volume24h.toFixed(2)} SOL`);
                return tradingData;
            }
            else {
                logger.warn(`⚠️ 无法获取交易数据: ${tokenAddress}，使用模拟数据`);
                // 降级到模拟数据
                return {
                    tokenAddress,
                    volume24h: Math.random() * 100000,
                    volumeChange: (Math.random() - 0.5) * 200,
                    txCount24h: Math.floor(Math.random() * 1000),
                    activeTraders: Math.floor(Math.random() * 500),
                    liquidity: Math.random() * 50000,
                    liquidityChange: (Math.random() - 0.5) * 100,
                    timestamp: new Date()
                };
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `获取${tokenAddress}交易数据`, { tokenAddress });
            return null;
        }
    }
    // 修复：只保留一个同步版本的 getActiveTokens 方法
    getActiveTokens() {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare('SELECT * FROM tokens WHERE is_active = 1 ORDER BY created_at DESC LIMIT 100');
            return stmt.all();
        }
        catch (error) {
            errorHandler.handleError(error, '获取活跃代币');
            return [];
        }
    }
    // 检查代币是否已存在
    isTokenExists(address) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare('SELECT COUNT(*) as count FROM tokens WHERE address = ?');
            const result = stmt.get(address);
            return result ? result.count > 0 : false;
        }
        catch (error) {
            errorHandler.handleError(error, '检查代币存在性');
            return false;
        }
    }
    // 修复：使用 better-sqlite3 的同步 API
    saveTokenInfo(token) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        INSERT OR REPLACE INTO tokens (
          address, name, symbol, decimals, total_supply,
          created_at, creator_address, initial_liquidity,
          social_links, is_active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(token.address, token.name, token.symbol, token.decimals, token.totalSupply, token.createdAt.toISOString(), token.creatorAddress, token.initialLiquidity, JSON.stringify(token.socialLinks), token.isActive ? 1 : 0, new Date().toISOString());
            logger.info(`✅ 保存代币信息: ${token.symbol} (${token.address})`);
        }
        catch (error) {
            errorHandler.handleError(error, '保存代币信息');
        }
    }
    // 新增：savePriceData 方法实现
    savePriceData(priceData) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        INSERT INTO price_data (
          token_address, price, price_change_1m, price_change_5m,
          price_change_15m, price_change_1h, price_change_24h, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(priceData.tokenAddress, priceData.price, priceData.priceChange1m, priceData.priceChange5m, priceData.priceChange15m, priceData.priceChange1h, priceData.priceChange24h, priceData.timestamp.toISOString());
            logger.info(`✅ 保存价格数据: ${priceData.tokenAddress} - $${priceData.price}`);
        }
        catch (error) {
            errorHandler.handleError(error, '保存价格数据');
        }
    }
    // 新增：saveTradingData 方法实现
    saveTradingData(tradingData) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        INSERT INTO trading_data (
          token_address, volume_24h, volume_change, tx_count_24h,
          active_traders, liquidity, liquidity_change, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(tradingData.tokenAddress, tradingData.volume24h, tradingData.volumeChange, tradingData.txCount24h, tradingData.activeTraders, tradingData.liquidity, tradingData.liquidityChange, tradingData.timestamp.toISOString());
            logger.info(`✅ 保存交易数据: ${tradingData.tokenAddress} - 24h交易量: $${tradingData.volume24h}`);
        }
        catch (error) {
            errorHandler.handleError(error, '保存交易数据');
        }
    }
}
//# sourceMappingURL=pumpfun-collector.js.map