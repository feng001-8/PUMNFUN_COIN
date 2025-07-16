import { Router } from 'express';
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js';
import { logger } from '../utils/logger.js';
import { environment } from '../config/environment.js';
const router = Router();
/**
 * 获取错误统计信息
 */
router.get('/errors/stats', async (req, res) => {
    try {
        const stats = enhancedErrorHandler.getErrorStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        await enhancedErrorHandler.handleError(error, 'GET /monitoring/errors/stats');
        res.status(500).json({
            success: false,
            error: 'Failed to get error statistics'
        });
    }
});
/**
 * 获取最近的错误列表
 */
router.get('/errors/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const errors = enhancedErrorHandler.getRecentErrors(limit);
        // 过滤敏感信息
        const sanitizedErrors = errors.map(error => ({
            type: error.type,
            severity: error.severity,
            message: error.message,
            timestamp: error.timestamp,
            retryCount: error.retryCount,
            context: error.context ? {
                ...error.context,
                // 移除可能的敏感信息
                password: undefined,
                token: undefined,
                key: undefined
            } : undefined
        }));
        res.json({
            success: true,
            data: sanitizedErrors,
            total: sanitizedErrors.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        await enhancedErrorHandler.handleError(error, 'GET /monitoring/errors/recent');
        res.status(500).json({
            success: false,
            error: 'Failed to get recent errors'
        });
    }
});
/**
 * 清除错误统计
 */
router.post('/errors/clear', async (req, res) => {
    try {
        enhancedErrorHandler.clearStats();
        logger.info('📊 错误统计已清除');
        res.json({
            success: true,
            message: 'Error statistics cleared successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        await enhancedErrorHandler.handleError(error, 'POST /monitoring/errors/clear');
        res.status(500).json({
            success: false,
            error: 'Failed to clear error statistics'
        });
    }
});
/**
 * 获取系统健康状态
 */
router.get('/health', async (req, res) => {
    try {
        const stats = enhancedErrorHandler.getErrorStats();
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        // 计算健康分数 (0-100)
        let healthScore = 100;
        // 根据错误率降低分数
        if (stats.lastHour > 0) {
            healthScore -= Math.min(stats.lastHour * 2, 50); // 每个错误扣2分，最多扣50分
        }
        // 根据严重错误降低分数
        const criticalErrors = stats.bySeverity.CRITICAL || 0;
        const highErrors = stats.bySeverity.HIGH || 0;
        healthScore -= criticalErrors * 10; // 每个严重错误扣10分
        healthScore -= highErrors * 5; // 每个高级错误扣5分
        healthScore = Math.max(0, healthScore);
        // 确定健康状态
        let status;
        if (healthScore >= 80) {
            status = 'healthy';
        }
        else if (healthScore >= 50) {
            status = 'warning';
        }
        else {
            status = 'critical';
        }
        res.json({
            success: true,
            data: {
                status,
                healthScore,
                errorStats: stats,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        await enhancedErrorHandler.handleError(error, 'GET /monitoring/health');
        res.status(500).json({
            success: false,
            error: 'Failed to get health status'
        });
    }
});
/**
 * 获取配置信息（非敏感部分）
 */
router.get('/config', async (req, res) => {
    try {
        const config = {
            server: {
                port: environment.server.port,
                nodeEnv: environment.server.nodeEnv
            },
            monitoring: {
                scanNewTokensInterval: environment.monitoring.scanNewTokensInterval,
                updatePriceInterval: environment.monitoring.updatePriceInterval,
                updateTradingInterval: environment.monitoring.updateTradingInterval,
                checkAlertsInterval: environment.monitoring.checkAlertsInterval
            },
            alerts: {
                goldenDog: environment.alerts.goldenDog,
                risk: environment.alerts.risk
            },
            performance: {
                httpTimeout: environment.performance.httpTimeout,
                httpMaxRetries: environment.performance.httpMaxRetries,
                cacheMaxSize: environment.performance.cacheMaxSize,
                cacheTtl: environment.performance.cacheTtl
            }
        };
        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        await enhancedErrorHandler.handleError(error, 'GET /monitoring/config');
        res.status(500).json({
            success: false,
            error: 'Failed to get configuration'
        });
    }
});
export default router;
//# sourceMappingURL=monitoring.js.map