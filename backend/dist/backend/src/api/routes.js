import { registerMonitoringRoutes } from './monitoring.js';
import { twitterRoutes } from './twitter.js';
import { dataSourceManager } from '../services/data-source-manager.js';
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js';
export async function registerRoutes(fastify, db, twitterService) {
    // 注册监控路由
    await registerMonitoringRoutes(fastify);
    // 注册Twitter路由
    await twitterRoutes(fastify, twitterService || null);
    // 健康检查
    fastify.get('/api/health', async (request, reply) => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };
    });
    // 数据源状态
    fastify.get('/api/data-source/status', async (request, reply) => {
        try {
            const status = dataSourceManager.getDataSourceStatus();
            return {
                success: true,
                data: status
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'GET /api/data-source/status');
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch data source status'
            };
        }
    });
    // 获取所有代币
    fastify.get('/api/tokens', async (request, reply) => {
        try {
            const query = request.query;
            const page = parseInt(query.page || '1');
            const limit = parseInt(query.limit || '20');
            const offset = (page - 1) * limit;
            const search = query.search || '';
            const sortBy = query.sortBy || 'created_at';
            const sortOrder = query.sortOrder || 'DESC';
            const database = db.getDb();
            // 构建查询条件
            let whereClause = 'WHERE is_active = 1';
            const params = [];
            if (search) {
                whereClause += ' AND (name LIKE ? OR symbol LIKE ? OR address LIKE ?)';
                const searchPattern = `%${search}%`;
                params.push(searchPattern, searchPattern, searchPattern);
            }
            // 获取总数
            const countStmt = database.prepare(`SELECT COUNT(*) as total FROM tokens ${whereClause}`);
            const countResult = countStmt.get(...params);
            // 获取代币列表
            const tokensStmt = database.prepare(`
        SELECT * FROM tokens 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `);
            const tokens = tokensStmt.all(...params, limit, offset);
            // 转换数据格式
            const formattedTokens = tokens.map(token => ({
                address: token.address,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                totalSupply: token.total_supply,
                createdAt: new Date(token.created_at),
                creatorAddress: token.creator_address,
                initialLiquidity: token.initial_liquidity,
                socialLinks: token.social_links ? JSON.parse(token.social_links) : undefined,
                isActive: Boolean(token.is_active)
            }));
            return {
                success: true,
                data: formattedTokens,
                total: countResult.total,
                page,
                limit
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'GET /api/tokens');
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch tokens'
            };
        }
    });
    // 获取代币详情
    fastify.get('/api/tokens/:address', async (request, reply) => {
        try {
            const { address } = request.params;
            const database = db.getDb();
            const stmt = database.prepare('SELECT * FROM tokens WHERE address = ?');
            const token = stmt.get(address);
            if (!token) {
                reply.code(404);
                return {
                    success: false,
                    error: 'Token not found'
                };
            }
            // 获取最新价格数据
            const priceStmt = database.prepare(`
        SELECT * FROM price_data 
        WHERE token_address = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `);
            const latestPrice = priceStmt.get(address);
            // 获取最新交易数据
            const tradingStmt = database.prepare(`
        SELECT * FROM trading_data 
        WHERE token_address = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `);
            const latestTrading = tradingStmt.get(address);
            const tokenData = {
                address: token.address,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                totalSupply: token.total_supply,
                createdAt: new Date(token.created_at),
                creatorAddress: token.creator_address,
                initialLiquidity: token.initial_liquidity,
                socialLinks: token.social_links ? JSON.parse(token.social_links) : undefined,
                isActive: Boolean(token.is_active),
                latestPrice: latestPrice ? {
                    price: latestPrice.price,
                    priceChange1m: latestPrice.price_change_1m,
                    priceChange5m: latestPrice.price_change_5m,
                    priceChange15m: latestPrice.price_change_15m,
                    priceChange1h: latestPrice.price_change_1h,
                    priceChange24h: latestPrice.price_change_24h,
                    timestamp: new Date(latestPrice.timestamp)
                } : null,
                latestTrading: latestTrading ? {
                    volume24h: latestTrading.volume_24h,
                    volumeChange: latestTrading.volume_change,
                    txCount24h: latestTrading.tx_count_24h,
                    activeTraders: latestTrading.active_traders,
                    liquidity: latestTrading.liquidity,
                    liquidityChange: latestTrading.liquidity_change,
                    timestamp: new Date(latestTrading.timestamp)
                } : null
            };
            return {
                success: true,
                data: tokenData
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `GET /api/tokens/${request.params}`);
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch token details'
            };
        }
    });
    // 获取价格数据
    fastify.get('/api/tokens/:address/price', async (request, reply) => {
        try {
            const { address } = request.params;
            const query = request.query;
            const limit = parseInt(query.limit || '100');
            const timeframe = query.timeframe || '1h'; // 1m, 5m, 15m, 1h, 24h
            const database = db.getDb();
            // 根据时间范围计算查询条件
            let timeCondition = '';
            const now = new Date();
            switch (timeframe) {
                case '1m':
                    timeCondition = `AND timestamp >= datetime('${new Date(now.getTime() - 60 * 1000).toISOString()}')`;
                    break;
                case '5m':
                    timeCondition = `AND timestamp >= datetime('${new Date(now.getTime() - 5 * 60 * 1000).toISOString()}')`;
                    break;
                case '15m':
                    timeCondition = `AND timestamp >= datetime('${new Date(now.getTime() - 15 * 60 * 1000).toISOString()}')`;
                    break;
                case '1h':
                    timeCondition = `AND timestamp >= datetime('${new Date(now.getTime() - 60 * 60 * 1000).toISOString()}')`;
                    break;
                case '24h':
                    timeCondition = `AND timestamp >= datetime('${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}')`;
                    break;
            }
            const stmt = database.prepare(`
        SELECT * FROM price_data 
        WHERE token_address = ? ${timeCondition}
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
            const priceData = stmt.all(address, limit);
            const formattedData = priceData.map(data => ({
                tokenAddress: data.token_address,
                price: data.price,
                priceChange1m: data.price_change_1m,
                priceChange5m: data.price_change_5m,
                priceChange15m: data.price_change_15m,
                priceChange1h: data.price_change_1h,
                priceChange24h: data.price_change_24h,
                timestamp: new Date(data.timestamp)
            }));
            return {
                success: true,
                data: formattedData,
                total: formattedData.length
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `GET /api/tokens/${request.params}/price`);
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch price data'
            };
        }
    });
    // 获取交易数据
    fastify.get('/api/tokens/:address/trading', async (request, reply) => {
        try {
            const { address } = request.params;
            const query = request.query;
            const limit = parseInt(query.limit || '100');
            const timeframe = query.timeframe || '24h';
            const database = db.getDb();
            // 根据时间范围计算查询条件
            let timeCondition = '';
            const now = new Date();
            switch (timeframe) {
                case '1h':
                    timeCondition = `AND timestamp >= datetime('${new Date(now.getTime() - 60 * 60 * 1000).toISOString()}')`;
                    break;
                case '24h':
                    timeCondition = `AND timestamp >= datetime('${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}')`;
                    break;
                case '7d':
                    timeCondition = `AND timestamp >= datetime('${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}')`;
                    break;
            }
            const stmt = database.prepare(`
        SELECT * FROM trading_data 
        WHERE token_address = ? ${timeCondition}
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
            const tradingData = stmt.all(address, limit);
            const formattedData = tradingData.map(data => ({
                tokenAddress: data.token_address,
                volume24h: data.volume_24h,
                volumeChange: data.volume_change,
                txCount24h: data.tx_count_24h,
                activeTraders: data.active_traders,
                liquidity: data.liquidity,
                liquidityChange: data.liquidity_change,
                timestamp: new Date(data.timestamp)
            }));
            return {
                success: true,
                data: formattedData,
                total: formattedData.length
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `GET /api/tokens/${request.params}/trading`);
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch trading data'
            };
        }
    });
    // 获取预警列表
    fastify.get('/api/alerts', async (request, reply) => {
        try {
            const query = request.query;
            const page = parseInt(query.page || '1');
            const limit = parseInt(query.limit || '20');
            const offset = (page - 1) * limit;
            const type = query.type;
            const unreadOnly = query.unread === 'true';
            const database = db.getDb();
            // 构建查询条件
            let whereClause = 'WHERE 1=1';
            const params = [];
            if (type) {
                whereClause += ' AND type = ?';
                params.push(type);
            }
            if (unreadOnly) {
                whereClause += ' AND is_read = 0';
            }
            // 获取总数
            const countStmt = database.prepare(`SELECT COUNT(*) as total FROM alerts ${whereClause}`);
            const countResult = countStmt.get(...params);
            // 获取预警列表
            const alertsStmt = database.prepare(`
        SELECT a.*, t.name as token_name, t.symbol as token_symbol
        FROM alerts a
        LEFT JOIN tokens t ON a.token_address = t.address
        ${whereClause}
        ORDER BY a.timestamp DESC
        LIMIT ? OFFSET ?
      `);
            const alerts = alertsStmt.all(...params, limit, offset);
            const formattedAlerts = alerts.map(alert => ({
                id: alert.id,
                tokenAddress: alert.token_address,
                tokenName: alert.token_name,
                tokenSymbol: alert.token_symbol,
                type: alert.type,
                title: alert.title,
                message: alert.message,
                score: alert.score,
                conditions: JSON.parse(alert.conditions),
                timestamp: new Date(alert.timestamp),
                isRead: Boolean(alert.is_read)
            }));
            return {
                success: true,
                data: formattedAlerts,
                total: countResult.total,
                page,
                limit
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'GET /api/alerts');
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch alerts'
            };
        }
    });
    // 标记预警为已读
    fastify.patch('/api/alerts/:id/read', async (request, reply) => {
        try {
            const { id } = request.params;
            const database = db.getDb();
            const stmt = database.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?');
            const result = stmt.run(id);
            if (result.changes === 0) {
                reply.code(404);
                return {
                    success: false,
                    error: 'Alert not found'
                };
            }
            return {
                success: true,
                message: 'Alert marked as read'
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `PATCH /api/alerts/${request.params}/read`);
            reply.code(500);
            return {
                success: false,
                error: 'Failed to mark alert as read'
            };
        }
    });
    // KOL相关API
    fastify.get('/api/kols', async (request, reply) => {
        try {
            const { limit = 50, offset = 0 } = request.query;
            // 这里需要从服务容器中获取KOL追踪服务实例
            // 暂时返回模拟数据，实际实现需要依赖注入
            const database = db.getDb();
            const stmt = database.prepare(`
        SELECT 
          wallet_address,
          name,
          category,
          influence_score,
          success_rate,
          total_trades,
          profitable_trades,
          avg_profit_rate,
          followers_count,
          verified,
          tags,
          social_links
        FROM kol_info 
        WHERE is_active = 1 
        ORDER BY influence_score DESC, success_rate DESC
        LIMIT ? OFFSET ?
      `);
            const rows = stmt.all(limit, offset);
            const kols = rows.map(row => ({
                walletAddress: row.wallet_address,
                name: row.name,
                category: row.category,
                influenceScore: row.influence_score,
                successRate: row.success_rate,
                totalTrades: row.total_trades,
                profitableTrades: row.profitable_trades,
                avgProfitRate: row.avg_profit_rate,
                followersCount: row.followers_count,
                verified: row.verified === 1,
                tags: JSON.parse(row.tags || '[]'),
                socialLinks: JSON.parse(row.social_links || '{}')
            }));
            return {
                success: true,
                data: kols
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'GET /api/kols');
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch KOL list'
            };
        }
    });
    // 获取KOL交易记录
    fastify.get('/api/kols/:address/transactions', async (request, reply) => {
        try {
            const { address } = request.params;
            const { limit = 50 } = request.query;
            const database = db.getDb();
            const stmt = database.prepare(`
        SELECT 
          kt.*,
          t.symbol,
          t.name as token_name
        FROM kol_transactions kt
        LEFT JOIN tokens t ON kt.token_address = t.address
        WHERE kt.kol_wallet_address = ? 
        ORDER BY kt.timestamp DESC
        LIMIT ?
      `);
            const rows = stmt.all(address, limit);
            const transactions = rows.map(row => ({
                id: row.id,
                tokenAddress: row.token_address,
                tokenSymbol: row.symbol,
                tokenName: row.token_name,
                transactionHash: row.transaction_hash,
                action: row.action,
                amount: row.amount,
                price: row.price,
                valueSol: row.value_sol,
                timestamp: new Date(row.timestamp),
                profitLoss: row.profit_loss,
                holdingPeriod: row.holding_period
            }));
            return {
                success: true,
                data: transactions
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `GET /api/kols/${request.params}/transactions`);
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch KOL transactions'
            };
        }
    });
    // 情绪分析API
    fastify.get('/api/sentiment/:tokenAddress', async (request, reply) => {
        try {
            const { tokenAddress } = request.params;
            const database = db.getDb();
            const stmt = database.prepare(`
         SELECT *
         FROM sentiment_data 
         WHERE token_address = ? 
         ORDER BY timestamp DESC
         LIMIT 1
       `);
            const row = stmt.get(tokenAddress);
            if (!row) {
                return {
                    success: true,
                    data: null,
                    message: 'No sentiment data found for this token'
                };
            }
            const sentimentData = {
                tokenAddress: row.token_address,
                overallSentiment: row.overall_sentiment,
                sentimentScore: row.sentiment_score,
                trendDirection: row.trend_direction,
                socialMediaActivity: row.social_media_activity,
                influencerActivity: row.influencer_activity,
                keySignals: JSON.parse(row.key_signals || '[]'),
                riskLevel: row.risk_level,
                investmentAdvice: row.investment_advice,
                confidenceLevel: row.confidence_level,
                timestamp: new Date(row.timestamp)
            };
            return {
                success: true,
                data: sentimentData
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `GET /api/sentiment/${request.params}`);
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch sentiment data'
            };
        }
    });
    // 智能分析API
    fastify.get('/api/analysis/:tokenAddress', async (request, reply) => {
        try {
            const { tokenAddress } = request.params;
            // 获取技术指标数据
            const database = db.getDb();
            const techStmt = database.prepare(`
         SELECT *
         FROM technical_indicators 
         WHERE token_address = ? 
         ORDER BY timestamp DESC
         LIMIT 1
       `);
            const techRow = techStmt.get(tokenAddress);
            if (!techRow) {
                return {
                    success: true,
                    data: null,
                    message: 'No analysis data found for this token'
                };
            }
            const analysisData = {
                tokenAddress: techRow.token_address,
                technicalIndicators: {
                    rsi: techRow.rsi,
                    macd: techRow.macd,
                    macdSignal: techRow.macd_signal,
                    macdHistogram: techRow.macd_histogram,
                    bollingerUpper: techRow.bollinger_upper,
                    bollingerMiddle: techRow.bollinger_middle,
                    bollingerLower: techRow.bollinger_lower,
                    sma20: techRow.sma_20,
                    sma50: techRow.sma_50,
                    ema12: techRow.ema_12,
                    ema26: techRow.ema_26,
                    volume: techRow.volume,
                    volumeAvg: techRow.volume_avg
                },
                signals: JSON.parse(techRow.signals || '[]'),
                overallSignal: techRow.overall_signal,
                confidenceLevel: techRow.confidence_level,
                timestamp: new Date(techRow.timestamp)
            };
            return {
                success: true,
                data: analysisData
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, `GET /api/analysis/${request.params}`);
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch analysis data'
            };
        }
    });
    // 用户预警配置API
    fastify.get('/api/alert-configs', async (request, reply) => {
        try {
            const { userId = 'default' } = request.query;
            const database = db.getDb();
            const stmt = database.prepare(`
         SELECT *
         FROM user_alert_configs 
         WHERE user_id = ? AND is_active = 1
         ORDER BY created_at DESC
       `);
            const rows = stmt.all(userId);
            const configs = rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                name: row.name,
                description: row.description,
                conditions: JSON.parse(row.conditions || '[]'),
                actions: JSON.parse(row.actions || '[]'),
                priority: row.priority,
                isActive: row.is_active === 1,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at)
            }));
            return {
                success: true,
                data: configs
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'GET /api/alert-configs');
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch alert configurations'
            };
        }
    });
    fastify.post('/api/alert-configs', async (request, reply) => {
        try {
            const { userId = 'default', name, description, conditions, actions, priority = 'medium' } = request.body;
            const database = db.getDb();
            const stmt = database.prepare(`
         INSERT INTO user_alert_configs (
           user_id, name, description, conditions, actions, priority, is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
       `);
            const result = stmt.run(userId, name, description, JSON.stringify(conditions), JSON.stringify(actions), priority);
            return {
                success: true,
                data: { id: result.lastInsertRowid }
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'POST /api/alert-configs');
            reply.code(500);
            return {
                success: false,
                error: 'Failed to create alert configuration'
            };
        }
    });
    // 获取统计数据
    fastify.get('/api/stats', async (request, reply) => {
        try {
            const database = db.getDb();
            // 获取代币总数
            const totalTokensStmt = database.prepare('SELECT COUNT(*) as count FROM tokens WHERE is_active = 1');
            const totalTokensResult = totalTokensStmt.get();
            // 获取活跃代币数（24小时内有交易的）
            const activeTokensStmt = database.prepare(`
         SELECT COUNT(DISTINCT token_address) as count 
         FROM trading_data 
         WHERE timestamp >= datetime('now', '-24 hours')
       `);
            const activeTokensResult = activeTokensStmt.get();
            // 获取金狗代币数（24小时涨幅超过100%的）
            const goldenDogsStmt = database.prepare(`
         SELECT COUNT(*) as count 
         FROM price_data 
         WHERE price_change_24h > 100 
         AND timestamp >= datetime('now', '-24 hours')
       `);
            const goldenDogsResult = goldenDogsStmt.get();
            // 获取24小时总交易量
            const totalVolumeStmt = database.prepare(`
         SELECT COALESCE(SUM(volume_24h), 0) as total 
         FROM trading_data 
         WHERE timestamp >= datetime('now', '-24 hours')
       `);
            const totalVolumeResult = totalVolumeStmt.get();
            // 获取平均价格变化
            const avgPriceChangeStmt = database.prepare(`
         SELECT COALESCE(AVG(price_change_24h), 0) as avg 
         FROM price_data 
         WHERE timestamp >= datetime('now', '-24 hours')
       `);
            const avgPriceChangeResult = avgPriceChangeStmt.get();
            return {
                success: true,
                data: {
                    totalTokens: totalTokensResult.count,
                    activeTokens: activeTokensResult.count,
                    goldenDogs: goldenDogsResult.count,
                    totalVolume: totalVolumeResult.total,
                    avgPrice: 0, // 暂时设为0，因为需要更复杂的计算
                    priceChange24h: avgPriceChangeResult.avg
                }
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'GET /api/stats');
            reply.code(500);
            return {
                success: false,
                error: 'Failed to fetch statistics'
            };
        }
    });
}
//# sourceMappingURL=routes.js.map