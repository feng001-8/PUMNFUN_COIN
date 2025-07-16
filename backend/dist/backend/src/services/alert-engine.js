import { AlertType } from '../../../shared/types/index.js';
import { logger } from '../utils/logger.js';
import { errorHandler } from '../utils/error-handler.js';
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js';
export class AlertEngine {
    db;
    io;
    isRunning = false;
    constructor(db) {
        this.db = db;
        logger.info('🚨 预警引擎已初始化');
    }
    setSocketIO(io) {
        this.io = io;
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        logger.info('🚨 预警引擎启动');
        try {
            // 启动定时任务
            logger.info('✅ 预警引擎启动完成，开始监控预警条件');
            // 立即执行一次检查
            await this.checkAlertConditions();
            // 每30秒检查一次预警条件
            setInterval(() => {
                this.checkAlertConditions().catch(error => {
                    errorHandler.handleError(error, 'checkAlertConditions定时任务');
                });
            }, 30000);
        }
        catch (error) {
            errorHandler.handleError(error, '预警引擎启动');
            throw error;
        }
    }
    async stop() {
        this.isRunning = false;
        logger.info('🛑 预警引擎停止');
    }
    async checkAlertConditions() {
        try {
            logger.debug('🔍 检查预警条件...');
            // 检查金狗预警
            await this.checkGoldenDogAlerts();
            // 检查风险预警
            await this.checkRiskAlerts();
            // 检查异常交易预警
            await this.checkAbnormalTradingAlerts();
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'checkAlertConditions');
        }
    }
    async checkGoldenDogAlerts() {
        const db = this.db.getDb();
        try {
            // 查询符合金狗条件的代币
            const query = `
        SELECT 
          t.address, t.name, t.symbol,
          p.price_change_5m, p.price_change_1h,
          td.volume_24h, td.volume_change, td.liquidity
        FROM tokens t
        LEFT JOIN price_data p ON t.address = p.token_address
        LEFT JOIN trading_data td ON t.address = td.token_address
        WHERE t.is_active = 1
          AND p.timestamp > datetime('now', '-10 minutes')
          AND td.timestamp > datetime('now', '-10 minutes')
          AND p.price_change_5m > 10  -- 5分钟涨幅 > 10% (降低阈值)
          AND td.volume_change > 50   -- 交易量增长 > 50% (降低阈值)
          AND td.liquidity > 1        -- 流动性 > 1 SOL (降低阈值)
        ORDER BY p.price_change_5m DESC
      `;
            const stmt = db.prepare(query);
            const candidates = stmt.all();
            for (const token of candidates) {
                await this.createGoldenDogAlert(token);
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'checkGoldenDogAlerts');
        }
    }
    async checkRiskAlerts() {
        // TODO: 实现风险预警检查
        logger.debug('🔍 检查风险预警...');
    }
    async checkAbnormalTradingAlerts() {
        // TODO: 实现异常交易预警检查
        logger.debug('🔍 检查异常交易预警...');
    }
    async createGoldenDogAlert(tokenData) {
        const alert = {
            id: `golden_dog_${tokenData.address}_${Date.now()}`,
            tokenAddress: tokenData.address,
            type: AlertType.SUPER_GOLDEN_DOG,
            title: `🔥 金狗预警: ${tokenData.symbol}`,
            message: `${tokenData.name} (${tokenData.symbol}) 检测到金狗信号！\n` +
                `5分钟涨幅: ${tokenData.price_change_5m?.toFixed(2)}%\n` +
                `交易量增长: ${tokenData.volume_change?.toFixed(2)}%\n` +
                `当前流动性: ${tokenData.liquidity?.toFixed(2)} SOL`,
            score: this.calculateGoldenDogScore(tokenData),
            conditions: [
                `5分钟涨幅: ${tokenData.price_change_5m?.toFixed(2)}%`,
                `交易量增长: ${tokenData.volume_change?.toFixed(2)}%`,
                `流动性: ${tokenData.liquidity?.toFixed(2)} SOL`
            ],
            timestamp: new Date(),
            isRead: false
        };
        await this.saveAlert(alert);
        await this.broadcastAlert(alert);
    }
    calculateGoldenDogScore(tokenData) {
        let score = 0;
        // 价格涨幅评分 (0-40分)
        if (tokenData.price_change_5m > 100)
            score += 40;
        else if (tokenData.price_change_5m > 50)
            score += 30;
        else
            score += 20;
        // 交易量增长评分 (0-30分)
        if (tokenData.volume_change > 500)
            score += 30;
        else if (tokenData.volume_change > 300)
            score += 20;
        else
            score += 10;
        // 流动性评分 (0-30分)
        if (tokenData.liquidity > 50)
            score += 30;
        else if (tokenData.liquidity > 20)
            score += 20;
        else if (tokenData.liquidity > 10)
            score += 10;
        return Math.min(score, 100);
    }
    async saveAlert(alert) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        INSERT INTO alerts (
          id, token_address, type, title, message, 
          score, conditions, timestamp, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(alert.id, alert.tokenAddress, alert.type, alert.title, alert.message, alert.score, JSON.stringify(alert.conditions), alert.timestamp.toISOString(), alert.isRead ? 1 : 0);
            logger.info(`✅ 保存预警: ${alert.title}`);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'saveAlert', { alertType: alert.type, tokenAddress: alert.tokenAddress });
        }
    }
    async broadcastAlert(alert) {
        try {
            // 通过Socket.io广播预警
            if (this.io) {
                this.io.emit('new_alert', alert);
                logger.info(`📡 广播预警: ${alert.title}`);
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'broadcastAlert', { alertType: alert.type, tokenAddress: alert.tokenAddress });
        }
    }
}
//# sourceMappingURL=alert-engine.js.map