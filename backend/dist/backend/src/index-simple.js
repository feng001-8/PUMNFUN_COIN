import Fastify from 'fastify';
import { logger } from './utils/logger.js';
import { DatabaseManager } from './database/schema.js';
import { registerRoutes } from './api/routes.js';
const fastify = Fastify({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty'
        }
    }
});
// 初始化数据库
const db = new DatabaseManager();
// 注册路由
fastify.register(async function (fastify) {
    await registerRoutes(fastify, db);
});
// 简单的健康检查路由
fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});
// 启动服务器
const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        logger.info('✅ 简单服务器启动成功: http://localhost:3000');
        // 测试导入服务模块
        logger.info('开始导入PumpFunCollector...');
        const { PumpFunCollector } = await import('./services/pumpfun-collector.js');
        logger.info('✅ PumpFunCollector导入成功');
        const pumpfunCollector = new PumpFunCollector(db);
        logger.info('✅ PumpFunCollector实例化成功');
        // 测试导入AlertEngine
        logger.info('开始导入AlertEngine...');
        const { AlertEngine } = await import('./services/alert-engine.js');
        logger.info('✅ AlertEngine导入成功');
        const alertEngine = new AlertEngine(db);
        logger.info('✅ AlertEngine实例化成功');
        // 测试启动服务
        logger.info('开始启动PumpFunCollector...');
        await pumpfunCollector.start();
        logger.info('✅ PumpFunCollector启动成功');
        logger.info('开始启动AlertEngine...');
        await alertEngine.start();
        logger.info('✅ AlertEngine启动成功');
        logger.info('🎉 所有服务启动完成！');
    }
    catch (err) {
        console.error('❌ 服务器启动失败:', err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index-simple.js.map