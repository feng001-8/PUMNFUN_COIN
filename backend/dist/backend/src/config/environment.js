import { config } from 'dotenv';
import { logger } from '../utils/logger.js';
// 加载环境变量
config();
// 获取环境变量的辅助函数
function getEnvVar(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`环境变量 ${key} 未设置`);
    }
    return value;
}
function getEnvNumber(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`环境变量 ${key} 未设置`);
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`环境变量 ${key} 不是有效的数字: ${value}`);
    }
    return parsed;
}
function getEnvBoolean(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`环境变量 ${key} 未设置`);
    }
    return value.toLowerCase() === 'true';
}
function getEnvArray(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`环境变量 ${key} 未设置`);
    }
    return value.split(',').map(item => item.trim());
}
// 创建配置对象
export const environment = {
    server: {
        port: getEnvNumber('PORT', 3000),
        host: getEnvVar('HOST', '0.0.0.0'),
        nodeEnv: getEnvVar('NODE_ENV', 'development')
    },
    database: {
        path: getEnvVar('DB_PATH', './data/pumpfun.db'),
        backupInterval: getEnvNumber('DB_BACKUP_INTERVAL', 3600000)
    },
    api: {
        jupiter: {
            baseUrl: getEnvVar('JUPITER_API_URL', 'https://lite-api.jup.ag/v4'),
            cacheDuration: getEnvNumber('JUPITER_CACHE_DURATION', 30000)
        },
        solana: {
            rpcUrl: getEnvVar('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com'),
            commitment: getEnvVar('SOLANA_COMMITMENT', 'confirmed')
        }
    },
    monitoring: {
        scanNewTokensInterval: getEnvNumber('SCAN_NEW_TOKENS_INTERVAL', 30000),
        updatePriceInterval: getEnvNumber('UPDATE_PRICE_INTERVAL', 120000),
        updateTradingInterval: getEnvNumber('UPDATE_TRADING_INTERVAL', 300000),
        checkAlertsInterval: getEnvNumber('CHECK_ALERTS_INTERVAL', 30000)
    },
    alerts: {
        goldenDog: {
            priceChange5m: getEnvNumber('GOLDEN_DOG_PRICE_CHANGE_5M', 50),
            volumeChange: getEnvNumber('GOLDEN_DOG_VOLUME_CHANGE', 300),
            minLiquidity: getEnvNumber('GOLDEN_DOG_MIN_LIQUIDITY', 10),
            minScore: getEnvNumber('GOLDEN_DOG_MIN_SCORE', 70)
        },
        risk: {
            priceDrop5m: getEnvNumber('RISK_PRICE_DROP_5M', -30),
            volumeDrop: getEnvNumber('RISK_VOLUME_DROP', -50),
            liquidityDrop: getEnvNumber('RISK_LIQUIDITY_DROP', 5)
        }
    },
    logging: {
        level: getEnvVar('LOG_LEVEL', 'info'),
        filePath: getEnvVar('LOG_FILE_PATH', './logs'),
        maxFiles: getEnvNumber('LOG_MAX_FILES', 7),
        maxSize: getEnvVar('LOG_MAX_SIZE', '10m')
    },
    cors: {
        origins: getEnvArray('CORS_ORIGINS', ['http://localhost:5173', 'http://192.168.1.30:5173'])
    },
    socket: {
        corsOrigins: getEnvArray('SOCKET_CORS_ORIGINS', ['http://localhost:5173', 'http://192.168.1.30:5173'])
    },
    performance: {
        httpTimeout: getEnvNumber('HTTP_TIMEOUT', 10000),
        httpMaxRetries: getEnvNumber('HTTP_MAX_RETRIES', 3),
        cacheMaxSize: getEnvNumber('CACHE_MAX_SIZE', 1000),
        cacheTtl: getEnvNumber('CACHE_TTL', 300000)
    },
    development: {
        enableMockData: getEnvBoolean('ENABLE_MOCK_DATA', false),
        enableVerboseLogging: getEnvBoolean('ENABLE_VERBOSE_LOGGING', false),
        enablePerformanceMonitoring: getEnvBoolean('ENABLE_PERFORMANCE_MONITORING', true)
    },
    // Twitter API配置（可选）
    twitter: process.env.TWITTER_BEARER_TOKEN ? {
        bearerToken: getEnvVar('TWITTER_BEARER_TOKEN'),
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
        searchInterval: getEnvNumber('TWITTER_SEARCH_INTERVAL', 300000),
        maxTweets: getEnvNumber('TWITTER_MAX_TWEETS', 100),
        influencerMonitorInterval: getEnvNumber('TWITTER_INFLUENCER_MONITOR_INTERVAL', 600000),
        enableSentimentAnalysis: getEnvBoolean('TWITTER_ENABLE_SENTIMENT_ANALYSIS', true)
    } : undefined
};
// 配置验证函数
export function validateConfig() {
    try {
        // 验证端口范围
        if (environment.server.port < 1 || environment.server.port > 65535) {
            throw new Error(`无效的端口号: ${environment.server.port}`);
        }
        // 验证URL格式
        new URL(environment.api.jupiter.baseUrl);
        new URL(environment.api.solana.rpcUrl);
        // 验证时间间隔
        if (environment.monitoring.scanNewTokensInterval < 1000) {
            throw new Error('扫描间隔不能少于1秒');
        }
        // 验证阈值
        if (environment.alerts.goldenDog.minScore < 0 || environment.alerts.goldenDog.minScore > 100) {
            throw new Error('金狗评分阈值必须在0-100之间');
        }
        logger.info('✅ 配置验证通过');
    }
    catch (error) {
        logger.error('❌ 配置验证失败:', error);
        throw error;
    }
}
// 打印配置信息（隐藏敏感信息）
export function printConfig() {
    const safeConfig = {
        server: environment.server,
        monitoring: environment.monitoring,
        alerts: environment.alerts,
        development: environment.development
    };
    logger.info('📋 当前配置:');
    logger.info(JSON.stringify(safeConfig, null, 2));
}
// 导出单例配置
export default environment;
//# sourceMappingURL=environment.js.map