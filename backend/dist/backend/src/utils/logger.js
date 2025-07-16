import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    logLevel;
    logDir;
    enableConsole;
    enableFile;
    constructor(options = {}) {
        this.logLevel = options.logLevel ?? LogLevel.INFO;
        this.logDir = options.logDir ?? './logs';
        this.enableConsole = options.enableConsole ?? true;
        this.enableFile = options.enableFile ?? true;
        // 确保日志目录存在
        if (this.enableFile && !existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }
    }
    log(level, message, data, error) {
        if (level > this.logLevel)
            return;
        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level];
        const logEntry = {
            timestamp,
            level: levelName,
            message,
            data,
            error
        };
        // 控制台输出
        if (this.enableConsole) {
            this.logToConsole(logEntry);
        }
        // 文件输出
        if (this.enableFile) {
            this.logToFile(logEntry);
        }
    }
    logToConsole(entry) {
        const { timestamp, level, message, data, error } = entry;
        const timeStr = new Date(timestamp).toLocaleTimeString();
        let emoji = '📝';
        let color = '\x1b[0m'; // 重置颜色
        switch (entry.level) {
            case 'ERROR':
                emoji = '❌';
                color = '\x1b[31m'; // 红色
                break;
            case 'WARN':
                emoji = '⚠️';
                color = '\x1b[33m'; // 黄色
                break;
            case 'INFO':
                emoji = '📊';
                color = '\x1b[36m'; // 青色
                break;
            case 'DEBUG':
                emoji = '🔍';
                color = '\x1b[90m'; // 灰色
                break;
        }
        console.log(`${color}${emoji} [${timeStr}] ${level}: ${message}\x1b[0m`);
        if (data) {
            console.log('  📋 数据:', JSON.stringify(data, null, 2));
        }
        if (error) {
            console.error('  🚨 错误:', error.stack || error.message);
        }
    }
    logToFile(entry) {
        const date = new Date().toISOString().split('T')[0];
        const logFile = join(this.logDir, `${date}.log`);
        const logLine = JSON.stringify(entry) + '\n';
        try {
            appendFileSync(logFile, logLine, 'utf8');
        }
        catch (error) {
            console.error('写入日志文件失败:', error);
        }
    }
    error(message, data, error) {
        this.log(LogLevel.ERROR, message, data, error);
    }
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
    // API相关的专用日志方法
    apiRequest(method, url, duration) {
        this.info(`API请求: ${method} ${url}`, { duration });
    }
    apiError(method, url, error, duration) {
        this.error(`API请求失败: ${method} ${url}`, { duration }, error);
    }
    tokenDiscovered(symbol, address, score) {
        this.info(`发现新代币: ${symbol}`, { address, score });
    }
    goldenDogAlert(symbol, address, score, reasons) {
        this.info(`🔥 金狗预警: ${symbol}`, { address, score, reasons });
    }
    priceUpdate(address, price, change24h) {
        this.debug(`价格更新: ${address}`, { price, change24h });
    }
    tradingDataUpdate(address, volume24h, activeTraders) {
        this.debug(`交易数据更新: ${address}`, { volume24h, activeTraders });
    }
}
// 获取日志级别
function getLogLevel() {
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLogLevel) {
        case 'debug': return LogLevel.DEBUG;
        case 'info': return LogLevel.INFO;
        case 'warn': return LogLevel.WARN;
        case 'error': return LogLevel.ERROR;
        default:
            return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
}
// 创建全局日志实例
export const logger = new Logger({
    logLevel: getLogLevel(),
    enableConsole: true,
    enableFile: true
});
// 导出便捷方法
export const log = {
    error: (message, data, error) => logger.error(message, data, error),
    warn: (message, data) => logger.warn(message, data),
    info: (message, data) => logger.info(message, data),
    debug: (message, data) => logger.debug(message, data),
    // API专用
    apiRequest: (method, url, duration) => logger.apiRequest(method, url, duration),
    apiError: (method, url, error, duration) => logger.apiError(method, url, error, duration),
    // 业务专用
    tokenDiscovered: (symbol, address, score) => logger.tokenDiscovered(symbol, address, score),
    goldenDogAlert: (symbol, address, score, reasons) => logger.goldenDogAlert(symbol, address, score, reasons),
    priceUpdate: (address, price, change24h) => logger.priceUpdate(address, price, change24h),
    tradingDataUpdate: (address, volume24h, activeTraders) => logger.tradingDataUpdate(address, volume24h, activeTraders)
};
//# sourceMappingURL=logger.js.map