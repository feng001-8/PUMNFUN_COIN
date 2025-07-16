import { logger } from './logger.js';
import { environment } from '../config/environment.js';
// 错误类型枚举
export var ErrorType;
(function (ErrorType) {
    ErrorType["API_ERROR"] = "API_ERROR";
    ErrorType["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorType["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorType["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    ErrorType["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorType || (ErrorType = {}));
// 错误严重级别
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (ErrorSeverity = {}));
class EnhancedErrorHandler {
    errorStats;
    errorHistory = [];
    retryConfig;
    io;
    constructor() {
        this.errorStats = {
            total: 0,
            byType: {},
            bySeverity: {},
            lastHour: 0,
            lastDay: 0
        };
        this.retryConfig = {
            maxRetries: environment.performance.httpMaxRetries,
            baseDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2,
            retryableErrors: [
                ErrorType.NETWORK_ERROR,
                ErrorType.TIMEOUT_ERROR,
                ErrorType.RATE_LIMIT_ERROR,
                ErrorType.API_ERROR
            ]
        };
        // 初始化错误统计
        Object.values(ErrorType).forEach(type => {
            this.errorStats.byType[type] = 0;
        });
        Object.values(ErrorSeverity).forEach(severity => {
            this.errorStats.bySeverity[severity] = 0;
        });
        // 定期清理错误历史
        setInterval(() => {
            this.cleanupErrorHistory();
        }, 60 * 60 * 1000); // 每小时清理一次
    }
    /**
     * 设置Socket.io实例用于实时错误通知
     */
    setSocketIO(io) {
        this.io = io;
    }
    /**
     * 创建增强错误
     */
    createError(message, type = ErrorType.UNKNOWN_ERROR, severity = ErrorSeverity.MEDIUM, context, originalError) {
        const error = new Error(message);
        error.type = type;
        error.severity = severity;
        error.context = context;
        error.timestamp = new Date();
        error.retryable = this.retryConfig.retryableErrors.includes(type);
        error.retryCount = 0;
        error.maxRetries = this.retryConfig.maxRetries;
        error.originalError = originalError;
        return error;
    }
    /**
     * 处理错误
     */
    async handleError(error, context, additionalContext) {
        let enhancedError;
        if (this.isEnhancedError(error)) {
            enhancedError = error;
        }
        else {
            enhancedError = this.createError(error.message, this.classifyError(error), this.determineSeverity(error), { context, ...additionalContext }, error);
        }
        // 记录错误
        this.recordError(enhancedError);
        // 日志记录
        this.logError(enhancedError, context);
        // 发送实时通知
        await this.notifyError(enhancedError);
        // 检查是否需要触发告警
        this.checkAlertThresholds();
    }
    /**
     * 带重试的操作执行
     */
    async withRetry(operation, context, customRetryConfig) {
        const config = { ...this.retryConfig, ...customRetryConfig };
        let lastError;
        let attempt = 0;
        while (attempt <= config.maxRetries) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                const enhancedError = this.isEnhancedError(error)
                    ? error
                    : this.createError(error.message, this.classifyError(error), this.determineSeverity(error), { context, attempt }, error);
                // 如果不可重试或达到最大重试次数，抛出错误
                if (!enhancedError.retryable || attempt >= config.maxRetries) {
                    enhancedError.retryCount = attempt;
                    await this.handleError(enhancedError, context);
                    throw enhancedError;
                }
                // 计算延迟时间
                const delay = Math.min(config.baseDelay * Math.pow(config.backoffMultiplier, attempt), config.maxDelay);
                logger.warn(`⏳ ${delay}ms后重试...`);
                await this.sleep(delay);
                attempt++;
            }
        }
        throw lastError;
    }
    /**
     * 获取错误统计
     */
    getErrorStats() {
        return { ...this.errorStats };
    }
    /**
     * 获取最近错误
     */
    getRecentErrors(limit = 50) {
        return this.errorHistory.slice(-limit);
    }
    /**
     * 清除错误统计
     */
    clearStats() {
        this.errorStats.total = 0;
        Object.keys(this.errorStats.byType).forEach(type => {
            this.errorStats.byType[type] = 0;
        });
        Object.keys(this.errorStats.bySeverity).forEach(severity => {
            this.errorStats.bySeverity[severity] = 0;
        });
        this.errorStats.lastHour = 0;
        this.errorStats.lastDay = 0;
        this.errorHistory = [];
    }
    // 私有方法
    isEnhancedError(error) {
        return error && typeof error === 'object' && 'type' in error && 'severity' in error;
    }
    classifyError(error) {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';
        if (message.includes('fetch failed') || message.includes('network') || message.includes('enotfound')) {
            return ErrorType.NETWORK_ERROR;
        }
        if (message.includes('timeout') || message.includes('timed out')) {
            return ErrorType.TIMEOUT_ERROR;
        }
        if (message.includes('rate limit') || message.includes('too many requests')) {
            return ErrorType.RATE_LIMIT_ERROR;
        }
        if (message.includes('database') || message.includes('sqlite') || stack.includes('database')) {
            return ErrorType.DATABASE_ERROR;
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return ErrorType.VALIDATION_ERROR;
        }
        if (message.includes('unauthorized') || message.includes('forbidden')) {
            return ErrorType.AUTHENTICATION_ERROR;
        }
        if (message.includes('api') || stack.includes('api')) {
            return ErrorType.API_ERROR;
        }
        return ErrorType.UNKNOWN_ERROR;
    }
    determineSeverity(error) {
        const message = error.message.toLowerCase();
        if (message.includes('critical') || message.includes('fatal') || message.includes('crash')) {
            return ErrorSeverity.CRITICAL;
        }
        if (message.includes('database') || message.includes('authentication')) {
            return ErrorSeverity.HIGH;
        }
        if (message.includes('api') || message.includes('network')) {
            return ErrorSeverity.MEDIUM;
        }
        return ErrorSeverity.LOW;
    }
    recordError(error) {
        this.errorStats.total++;
        this.errorStats.byType[error.type]++;
        this.errorStats.bySeverity[error.severity]++;
        // 记录到历史
        this.errorHistory.push(error);
        // 限制历史记录数量
        if (this.errorHistory.length > 1000) {
            this.errorHistory = this.errorHistory.slice(-500);
        }
        // 更新时间窗口统计
        this.updateTimeWindowStats();
    }
    logError(error, context) {
        const logData = {
            type: error.type,
            severity: error.severity,
            message: error.message,
            context: context || error.context,
            timestamp: error.timestamp,
            retryCount: error.retryCount,
            stack: error.stack
        };
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                logger.error('🚨 CRITICAL ERROR:', logData);
                break;
            case ErrorSeverity.HIGH:
                logger.error('❌ HIGH SEVERITY ERROR:', logData);
                break;
            case ErrorSeverity.MEDIUM:
                logger.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
                break;
            case ErrorSeverity.LOW:
                logger.info('ℹ️ LOW SEVERITY ERROR:', logData);
                break;
        }
    }
    async notifyError(error) {
        if (this.io && error.severity === ErrorSeverity.CRITICAL) {
            this.io.emit('critical_error', {
                type: error.type,
                message: error.message,
                timestamp: error.timestamp,
                context: error.context
            });
        }
    }
    checkAlertThresholds() {
        const criticalErrors = this.errorStats.bySeverity[ErrorSeverity.CRITICAL];
        const highErrors = this.errorStats.bySeverity[ErrorSeverity.HIGH];
        if (criticalErrors >= 5) {
            logger.error('🚨 ALERT: 检测到过多严重错误！');
        }
        if (highErrors >= 10) {
            logger.warn('⚠️ ALERT: 检测到过多高级错误！');
        }
        if (this.errorStats.lastHour >= 50) {
            logger.warn('⚠️ ALERT: 过去一小时错误率过高！');
        }
    }
    updateTimeWindowStats() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        this.errorStats.lastHour = this.errorHistory.filter(error => error.timestamp.getTime() > oneHourAgo).length;
        this.errorStats.lastDay = this.errorHistory.filter(error => error.timestamp.getTime() > oneDayAgo).length;
    }
    cleanupErrorHistory() {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.errorHistory = this.errorHistory.filter(error => error.timestamp.getTime() > oneDayAgo);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// 导出单例
export const enhancedErrorHandler = new EnhancedErrorHandler();
export default enhancedErrorHandler;
//# sourceMappingURL=enhanced-error-handler.js.map