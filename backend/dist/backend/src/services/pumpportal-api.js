import WebSocket from 'ws';
import { logger } from '../utils/logger.js';
import { errorHandler } from '../utils/error-handler.js';
export class PumpPortalAPI {
    ws = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 5000;
    isConnecting = false;
    db;
    // 数据缓存
    newTokens = [];
    tokenTrades = new Map();
    maxCacheSize = 1000;
    // 事件监听器
    tokenListeners = [];
    tradeListeners = [];
    constructor(db) {
        this.db = db;
        this.connect();
    }
    /**
     * 连接到 PumpPortal WebSocket
     */
    async connect() {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }
        this.isConnecting = true;
        try {
            logger.info('正在连接 PumpPortal WebSocket...');
            this.ws = new WebSocket('wss://pumpportal.fun/api/data');
            this.ws.on('open', () => {
                logger.info('PumpPortal WebSocket 连接成功');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.subscribeToEvents();
            });
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                }
                catch (error) {
                    logger.error('解析 PumpPortal 消息失败:', error);
                }
            });
            this.ws.on('close', () => {
                logger.warn('PumpPortal WebSocket 连接关闭');
                this.isConnecting = false;
                this.scheduleReconnect();
            });
            this.ws.on('error', (error) => {
                logger.error('PumpPortal WebSocket 错误:', error);
                this.isConnecting = false;
                this.scheduleReconnect();
            });
        }
        catch (error) {
            logger.error('连接 PumpPortal WebSocket 失败:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }
    /**
     * 订阅事件
     */
    subscribeToEvents() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        // 订阅新代币创建事件
        this.ws.send(JSON.stringify({
            method: 'subscribeNewToken'
        }));
        // 订阅所有交易事件
        this.ws.send(JSON.stringify({
            method: 'subscribeAccountTrade',
            keys: ['all']
        }));
        logger.info('已订阅 PumpPortal 新代币事件和交易事件');
    }
    /**
     * 处理 WebSocket 消息
     */
    handleMessage(message) {
        try {
            // 添加INFO级别日志来查看消息格式
            logger.info('🔍 收到 PumpPortal 消息:', {
                hasFields: {
                    mint: !!message.mint,
                    name: !!message.name,
                    symbol: !!message.symbol,
                    solAmount: message.solAmount !== undefined,
                    isBuy: message.isBuy !== undefined,
                    sol_amount: message.sol_amount !== undefined,
                    token_amount: message.token_amount !== undefined
                },
                messageKeys: Object.keys(message || {})
            });
            // 处理新代币事件
            if (message.mint && message.name && message.symbol) {
                const tokenInfo = this.transformTokenEvent(message);
                this.addNewToken(tokenInfo);
                // 自动订阅新代币的交易事件
                this.subscribeTokenTrades(tokenInfo.address);
                // 通知监听器
                this.tokenListeners.forEach(listener => {
                    try {
                        listener(tokenInfo);
                    }
                    catch (error) {
                        logger.error('代币监听器执行失败:', error);
                    }
                });
            }
            // 判断是否为交易事件（基于实际消息格式）
            if (message.mint && message.solAmount !== undefined && message.tokenAmount !== undefined && message.txType) {
                // 根据txType判断买卖方向：'buy' 为买入，'sell' 为卖出
                const isBuy = message.txType === 'buy';
                const tradeEvent = {
                    ...message,
                    isBuy: isBuy
                };
                logger.info('📈 收到交易事件:', {
                    mint: message.mint,
                    solAmount: message.solAmount,
                    tokenAmount: message.tokenAmount,
                    txType: message.txType,
                    isBuy: isBuy,
                    trader: message.traderPublicKey
                });
                this.addTrade(tradeEvent);
                // 通知监听器
                this.tradeListeners.forEach(listener => {
                    try {
                        listener(tradeEvent);
                    }
                    catch (error) {
                        logger.error('交易监听器执行失败:', error);
                    }
                });
            }
        }
        catch (error) {
            logger.error('处理 PumpPortal 消息失败:', error);
        }
    }
    /**
     * 转换 PumpPortal 事件为 TokenInfo
     */
    transformTokenEvent(event) {
        // 安全处理时间戳
        let createdAt;
        try {
            if (event.timestamp && typeof event.timestamp === 'number' && event.timestamp > 0) {
                // 如果时间戳是秒级，转换为毫秒级
                const timestamp = event.timestamp < 1e12 ? event.timestamp * 1000 : event.timestamp;
                createdAt = new Date(timestamp);
                // 验证日期是否有效
                if (isNaN(createdAt.getTime())) {
                    createdAt = new Date();
                }
            }
            else {
                createdAt = new Date();
            }
        }
        catch (error) {
            createdAt = new Date();
        }
        return {
            address: event.mint,
            name: event.name || 'Unknown Token',
            symbol: event.symbol || 'UNKNOWN',
            decimals: 6,
            totalSupply: event.totalSupply?.toString() || '1000000000',
            createdAt,
            creatorAddress: event.creator || '',
            initialLiquidity: event.virtualSolReserves || 0,
            socialLinks: {
                twitter: event.twitter,
                telegram: event.telegram,
                website: event.website
            },
            isActive: true
        };
    }
    /**
     * 添加新代币到缓存
     */
    addNewToken(token) {
        this.newTokens.unshift(token);
        // 限制缓存大小
        if (this.newTokens.length > this.maxCacheSize) {
            this.newTokens = this.newTokens.slice(0, this.maxCacheSize);
        }
    }
    /**
     * 添加交易到缓存
     */
    addTrade(trade) {
        // 添加到内存缓存
        if (!this.tokenTrades.has(trade.mint)) {
            this.tokenTrades.set(trade.mint, []);
        }
        const trades = this.tokenTrades.get(trade.mint);
        trades.unshift(trade);
        // 限制每个代币的交易记录数量
        if (trades.length > 500) {
            trades.splice(500);
        }
        // 保存到数据库
        this.saveTradeToDatabase(trade);
    }
    /**
     * 保存交易数据到数据库
     */
    saveTradeToDatabase(trade) {
        try {
            const db = this.db.getDb();
            // 计算每代币价格
            const pricePerToken = trade.tokenAmount > 0 ? trade.solAmount / trade.tokenAmount : 0;
            // 验证必填字段
            const tokenAddress = trade.mint;
            const signature = trade.signature || `${trade.mint}_${Date.now()}_${Math.random()}`;
            const traderAddress = trade.user || 'unknown';
            const isBuy = trade.isBuy ? 1 : 0;
            const solAmount = trade.solAmount || 0;
            const tokenAmount = trade.tokenAmount || 0;
            // 检查必填字段是否为空
            if (!tokenAddress) {
                throw new Error('token_address is required but is null/undefined');
            }
            if (!signature) {
                throw new Error('transaction_signature is required but is null/undefined');
            }
            if (!traderAddress) {
                throw new Error('trader_address is required but is null/undefined');
            }
            if (solAmount === null || solAmount === undefined) {
                throw new Error('sol_amount is required but is null/undefined');
            }
            if (tokenAmount === null || tokenAmount === undefined) {
                throw new Error('token_amount is required but is null/undefined');
            }
            if (pricePerToken === null || pricePerToken === undefined) {
                throw new Error('price_per_token is required but is null/undefined');
            }
            const stmt = db.prepare(`
        INSERT OR IGNORE INTO trades (
          token_address, transaction_signature, trader_address, 
          is_buy, sol_amount, token_amount, price_per_token, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(tokenAddress, signature, traderAddress, isBuy, solAmount, tokenAmount, pricePerToken, new Date().toISOString());
            if (result.changes > 0) {
                logger.info('✅ 交易数据已保存到数据库');
            }
        }
        catch (error) {
            const calculatedPrice = trade.tokenAmount > 0 ? trade.solAmount / trade.tokenAmount : 0;
            // 使用console.log确保错误信息能够输出
            console.log('❌ 保存交易数据失败 - 详细信息:');
            console.log('错误代码:', error.code);
            console.log('错误消息:', error.message);
            console.log('完整错误对象:', error);
            console.log('交易数据:', {
                mint: trade.mint,
                signature: trade.signature,
                user: trade.user,
                solAmount: trade.solAmount,
                tokenAmount: trade.tokenAmount,
                isBuy: trade.isBuy,
                pricePerToken: calculatedPrice
            });
            console.log('SQL参数值:', {
                token_address: trade.mint,
                transaction_signature: trade.signature || `${trade.mint}_${Date.now()}_${Math.random()}`,
                trader_address: trade.user || 'unknown',
                is_buy: trade.isBuy ? 1 : 0,
                sol_amount: trade.solAmount,
                token_amount: trade.tokenAmount,
                price_per_token: calculatedPrice,
                timestamp: new Date().toISOString()
            });
            // 同时使用logger
            logger.error('❌ 保存交易数据失败:', {
                code: error.code
            });
        }
    }
    /**
     * 计划重连
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('PumpPortal WebSocket 重连次数已达上限，停止重连');
            return;
        }
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        logger.info(`${delay}ms 后尝试重连 PumpPortal WebSocket (第 ${this.reconnectAttempts} 次)`);
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    /**
     * 获取最新代币列表
     */
    async getNewTokens(limit = 50, offset = 0) {
        const start = offset;
        const end = offset + limit;
        return this.newTokens.slice(start, end);
    }
    /**
     * 获取特定代币信息
     */
    async getTokenInfo(address) {
        // 从缓存中查找
        const token = this.newTokens.find(t => t.address === address);
        return token || null;
    }
    /**
     * 获取代币交易数据
     */
    async getTokenTrades(address, limit = 100) {
        const trades = this.tokenTrades.get(address) || [];
        return trades.slice(0, limit);
    }
    /**
     * 计算交易数据指标
     */
    async calculateTradingData(address) {
        try {
            const trades = await this.getTokenTrades(address, 1000);
            const now = Date.now();
            const oneDayAgo = now - 24 * 60 * 60 * 1000;
            // 过滤24小时内的交易
            const trades24h = trades.filter(trade => trade.timestamp * 1000 > oneDayAgo);
            // 计算24小时交易量
            const volume24h = trades24h.reduce((sum, trade) => {
                return sum + trade.solAmount;
            }, 0);
            // 计算活跃交易者
            const uniqueTraders = new Set(trades24h.map(trade => trade.user)).size;
            // 获取代币信息以计算流动性
            const tokenInfo = await this.getTokenInfo(address);
            const liquidity = tokenInfo?.initialLiquidity || 0;
            return {
                tokenAddress: address,
                volume24h,
                volumeChange: 0, // 需要历史数据来计算
                txCount24h: trades24h.length,
                activeTraders: uniqueTraders,
                liquidity,
                liquidityChange: 0,
                timestamp: new Date()
            };
        }
        catch (error) {
            errorHandler.handleError(error, `计算交易数据: ${address}`);
            return null;
        }
    }
    /**
     * 订阅特定代币的交易事件
     */
    subscribeTokenTrades(tokenAddress) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            logger.warn('WebSocket 未连接，无法订阅代币交易');
            return;
        }
        this.ws.send(JSON.stringify({
            method: 'subscribeTokenTrade',
            keys: [tokenAddress]
        }));
        logger.info(`已订阅代币 ${tokenAddress} 的交易事件`);
    }
    /**
     * 添加代币监听器
     */
    onNewToken(listener) {
        this.tokenListeners.push(listener);
    }
    /**
     * 添加交易监听器
     */
    onTrade(listener) {
        this.tradeListeners.push(listener);
    }
    /**
     * 检查连接状态
     */
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    /**
     * 关闭连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    /**
     * 检查金狗条件（使用缓存数据）
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
            // 检查交易次数（> 100）
            if (tradingData.txCount24h > 100) {
                score += 30;
                reasons.push(`24h交易次数: ${tradingData.txCount24h}次`);
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
// 导出工厂函数来创建实例
export const createPumpPortalAPI = (db) => new PumpPortalAPI(db);
// 临时变量用于存储实例
let pumpPortalAPIInstance = null;
// 导出获取实例的函数
export const getPumpPortalAPI = () => {
    if (!pumpPortalAPIInstance) {
        throw new Error('PumpPortal API 尚未初始化，请先调用 initializePumpPortalAPI');
    }
    return pumpPortalAPIInstance;
};
// 导出初始化函数
export const initializePumpPortalAPI = (db) => {
    if (!pumpPortalAPIInstance) {
        pumpPortalAPIInstance = new PumpPortalAPI(db);
    }
    return pumpPortalAPIInstance;
};
// 为了向后兼容，导出一个getter
export const pumpPortalAPI = {
    get instance() {
        return getPumpPortalAPI();
    }
};
//# sourceMappingURL=pumpportal-api.js.map