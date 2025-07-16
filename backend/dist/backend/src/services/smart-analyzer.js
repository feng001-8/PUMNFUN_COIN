import { logger } from '../utils/logger.js';
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js';
export class SmartAnalyzer {
    db;
    io;
    kolTracker;
    sentimentAnalyzer;
    isRunning = false;
    analysisInterval;
    constructor(db) {
        this.db = db;
        logger.info('🧠 智能分析引擎已初始化');
    }
    setSocketIO(io) {
        this.io = io;
    }
    setKOLTracker(kolTracker) {
        this.kolTracker = kolTracker;
    }
    setSentimentAnalyzer(sentimentAnalyzer) {
        this.sentimentAnalyzer = sentimentAnalyzer;
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        try {
            // 初始化技术指标数据
            await this.initializeTechnicalIndicators();
            logger.info('🧠 智能分析引擎启动完成');
            // 定期执行智能分析
            this.analysisInterval = setInterval(() => {
                this.performSmartAnalysis().catch(error => {
                    enhancedErrorHandler.handleError(error, '智能分析定时任务');
                });
            }, 120000); // 每2分钟分析一次
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, '智能分析引擎启动');
            throw error;
        }
    }
    async stop() {
        this.isRunning = false;
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
        }
        logger.info('🛑 智能分析引擎停止');
    }
    // 执行智能分析
    async performSmartAnalysis() {
        try {
            // 获取活跃代币列表
            const activeTokens = await this.getActiveTokens(10);
            for (const token of activeTokens) {
                const analysis = await this.analyzeToken(token.address);
                if (analysis) {
                    // 广播分析结果
                    if (this.io) {
                        this.io.emit('smart_analysis', analysis);
                    }
                    // 检查是否需要生成预警
                    await this.checkAnalysisAlerts(analysis);
                }
            }
            logger.debug('🧠 智能分析周期完成');
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'performSmartAnalysis');
        }
    }
    // 分析单个代币
    async analyzeToken(tokenAddress) {
        try {
            // 获取代币基本信息
            const tokenInfo = await this.getTokenInfo(tokenAddress);
            if (!tokenInfo)
                return null;
            // 获取各维度分析数据
            const technicalAnalysis = await this.performTechnicalAnalysis(tokenAddress);
            const sentimentAnalysis = await this.getSentimentAnalysis(tokenAddress);
            const kolAnalysis = await this.performKOLAnalysis(tokenAddress);
            const marketAnalysis = await this.performMarketAnalysis(tokenAddress);
            // 计算综合评分
            const overallScore = this.calculateOverallScore(technicalAnalysis, sentimentAnalysis, kolAnalysis, marketAnalysis);
            // 计算风险评分
            const riskScore = this.calculateRiskScore(technicalAnalysis, sentimentAnalysis, marketAnalysis);
            // 计算潜力评分
            const potentialScore = this.calculatePotentialScore(technicalAnalysis, sentimentAnalysis, kolAnalysis, marketAnalysis);
            // 生成投资建议
            const recommendation = this.generateRecommendation(overallScore, riskScore, potentialScore, technicalAnalysis, sentimentAnalysis, marketAnalysis);
            // 生成价格预测
            const prediction = this.generatePricePrediction(tokenAddress, technicalAnalysis, sentimentAnalysis, marketAnalysis);
            const analysis = {
                tokenAddress,
                tokenSymbol: tokenInfo.symbol,
                tokenName: tokenInfo.name,
                overallScore,
                riskScore,
                potentialScore,
                technicalAnalysis,
                sentimentAnalysis,
                kolAnalysis,
                marketAnalysis,
                recommendation,
                prediction,
                timestamp: new Date(),
                lastUpdated: new Date()
            };
            return analysis;
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'analyzeToken', { tokenAddress });
            return null;
        }
    }
    // 执行技术分析
    async performTechnicalAnalysis(tokenAddress) {
        try {
            // 获取价格数据
            const priceData = await this.getPriceData(tokenAddress, 100);
            // 计算技术指标
            const indicators = await this.calculateTechnicalIndicators(tokenAddress, priceData);
            // 分析趋势
            const trend = this.analyzeTrend(priceData);
            // 计算支撑位和阻力位
            const { support, resistance } = this.calculateSupportResistance(priceData);
            // 生成技术信号
            const signals = this.generateTechnicalSignals(indicators, trend);
            // 计算技术分析评分
            const score = this.calculateTechnicalScore(indicators, trend, signals);
            return {
                score,
                signals,
                indicators,
                trend,
                support,
                resistance
            };
        }
        catch (error) {
            logger.error('技术分析失败:', error);
            return {
                score: 50,
                signals: ['数据不足'],
                indicators: [],
                trend: 'neutral',
                support: 0,
                resistance: 0
            };
        }
    }
    // 获取情绪分析
    async getSentimentAnalysis(tokenAddress) {
        try {
            if (!this.sentimentAnalyzer) {
                return {
                    score: 50,
                    sentiment: 'neutral',
                    confidence: 0,
                    socialVolume: 0,
                    keySignals: ['情绪分析服务未启用']
                };
            }
            const analysis = await this.sentimentAnalyzer.analyzeTokenSentiment(tokenAddress);
            if (!analysis) {
                return {
                    score: 50,
                    sentiment: 'neutral',
                    confidence: 0,
                    socialVolume: 0,
                    keySignals: ['暂无情绪数据']
                };
            }
            return {
                score: (analysis.sentimentScore + 100) / 2, // 转换为0-100范围
                sentiment: analysis.overallSentiment,
                confidence: analysis.confidence,
                socialVolume: analysis.socialVolume,
                keySignals: analysis.keySignals
            };
        }
        catch (error) {
            logger.error('获取情绪分析失败:', error);
            return {
                score: 50,
                sentiment: 'neutral',
                confidence: 0,
                socialVolume: 0,
                keySignals: ['情绪分析错误']
            };
        }
    }
    // 执行KOL分析
    async performKOLAnalysis(tokenAddress) {
        try {
            if (!this.kolTracker) {
                return {
                    score: 50,
                    activeKOLs: 0,
                    recentActivity: ['KOL追踪服务未启用'],
                    influenceLevel: 'low'
                };
            }
            // 获取最近24小时的KOL交易
            const recentTransactions = await this.getRecentKOLTransactions(tokenAddress, 24);
            // 分析KOL活动
            const activeKOLs = new Set(recentTransactions.map(tx => tx.kolWalletAddress)).size;
            const recentActivity = this.analyzeKOLActivity(recentTransactions);
            const influenceLevel = this.calculateInfluenceLevel(recentTransactions);
            const score = this.calculateKOLScore(activeKOLs, recentTransactions, influenceLevel);
            return {
                score,
                activeKOLs,
                recentActivity,
                influenceLevel
            };
        }
        catch (error) {
            logger.error('KOL分析失败:', error);
            return {
                score: 50,
                activeKOLs: 0,
                recentActivity: ['KOL分析错误'],
                influenceLevel: 'low'
            };
        }
    }
    // 执行市场分析
    async performMarketAnalysis(tokenAddress) {
        try {
            const db = this.db.getDb();
            // 获取24小时交易数据
            const tradingStmt = db.prepare(`
        SELECT 
          SUM(volume) as volume24h,
          AVG(price) as avgPrice,
          MIN(price) as minPrice,
          MAX(price) as maxPrice,
          COUNT(*) as tradeCount
        FROM trading_data 
        WHERE token_address = ? 
        AND timestamp > datetime('now', '-24 hours')
      `);
            const tradingData = tradingStmt.get(tokenAddress);
            // 获取当前价格
            const priceStmt = db.prepare(`
        SELECT price FROM price_data 
        WHERE token_address = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `);
            const currentPriceData = priceStmt.get(tokenAddress);
            const currentPrice = currentPriceData?.price || 0;
            // 获取24小时前价格
            const oldPriceStmt = db.prepare(`
        SELECT price FROM price_data 
        WHERE token_address = ? 
        AND timestamp <= datetime('now', '-24 hours')
        ORDER BY timestamp DESC 
        LIMIT 1
      `);
            const oldPriceData = oldPriceStmt.get(tokenAddress);
            const oldPrice = oldPriceData?.price || currentPrice;
            // 计算价格变化
            const priceChange24h = oldPrice > 0 ? ((currentPrice - oldPrice) / oldPrice) * 100 : 0;
            // 计算波动率
            const volatility = tradingData?.maxPrice && tradingData?.minPrice
                ? ((tradingData.maxPrice - tradingData.minPrice) / tradingData.avgPrice) * 100
                : 0;
            // 估算市值和流动性（简化计算）
            const marketCap = currentPrice * 1000000; // 假设供应量
            const liquidity = tradingData?.volume24h || 0;
            // 计算市场分析评分
            const score = this.calculateMarketScore(tradingData?.volume24h || 0, priceChange24h, volatility, liquidity);
            return {
                score,
                volume24h: tradingData?.volume24h || 0,
                priceChange24h,
                marketCap,
                liquidity,
                volatility
            };
        }
        catch (error) {
            logger.error('市场分析失败:', error);
            return {
                score: 50,
                volume24h: 0,
                priceChange24h: 0,
                marketCap: 0,
                liquidity: 0,
                volatility: 0
            };
        }
    }
    // 计算综合评分
    calculateOverallScore(technical, sentiment, kol, market) {
        // 权重分配
        const weights = {
            technical: 0.3,
            sentiment: 0.25,
            kol: 0.2,
            market: 0.25
        };
        const weightedScore = technical.score * weights.technical +
            sentiment.score * weights.sentiment +
            kol.score * weights.kol +
            market.score * weights.market;
        return Math.round(weightedScore);
    }
    // 计算风险评分
    calculateRiskScore(technical, sentiment, market) {
        let riskScore = 50; // 基础风险
        // 技术风险
        if (technical.trend === 'bearish')
            riskScore += 15;
        if (technical.signals.some(s => s.includes('卖出')))
            riskScore += 10;
        // 情绪风险
        if (sentiment.sentiment.includes('bearish'))
            riskScore += 15;
        if (sentiment.confidence < 50)
            riskScore += 10;
        // 市场风险
        if (market.volatility > 50)
            riskScore += 20;
        if (market.volume24h < 1000)
            riskScore += 15;
        if (market.priceChange24h < -20)
            riskScore += 25;
        return Math.min(100, Math.max(0, riskScore));
    }
    // 计算潜力评分
    calculatePotentialScore(technical, sentiment, kol, market) {
        let potentialScore = 50; // 基础潜力
        // 技术潜力
        if (technical.trend === 'bullish')
            potentialScore += 15;
        if (technical.signals.some(s => s.includes('买入')))
            potentialScore += 10;
        // 情绪潜力
        if (sentiment.sentiment.includes('bullish'))
            potentialScore += 15;
        if (sentiment.socialVolume > 70)
            potentialScore += 10;
        // KOL潜力
        if (kol.influenceLevel === 'high')
            potentialScore += 20;
        if (kol.activeKOLs > 3)
            potentialScore += 10;
        // 市场潜力
        if (market.priceChange24h > 20)
            potentialScore += 15;
        if (market.volume24h > 10000)
            potentialScore += 10;
        return Math.min(100, Math.max(0, potentialScore));
    }
    // 生成投资建议
    generateRecommendation(overallScore, riskScore, potentialScore, technical, sentiment, market) {
        let action = 'hold';
        let confidence = 50;
        const reasoning = [];
        const riskFactors = [];
        // 基于综合评分决定行动
        if (overallScore >= 80 && riskScore <= 40) {
            action = 'strong_buy';
            confidence = 85;
            reasoning.push('综合评分优秀，风险可控');
        }
        else if (overallScore >= 65 && riskScore <= 60) {
            action = 'buy';
            confidence = 70;
            reasoning.push('综合评分良好');
        }
        else if (overallScore <= 35 || riskScore >= 80) {
            action = 'sell';
            confidence = 75;
            reasoning.push('综合评分较低或风险过高');
        }
        else if (overallScore <= 20 || riskScore >= 90) {
            action = 'strong_sell';
            confidence = 85;
            reasoning.push('综合评分很低，风险极高');
        }
        // 添加具体分析原因
        if (technical.trend === 'bullish') {
            reasoning.push('技术面看涨');
        }
        else if (technical.trend === 'bearish') {
            reasoning.push('技术面看跌');
        }
        if (sentiment.sentiment.includes('bullish')) {
            reasoning.push('市场情绪积极');
        }
        else if (sentiment.sentiment.includes('bearish')) {
            reasoning.push('市场情绪消极');
        }
        // 添加风险因素
        if (market.volatility > 50) {
            riskFactors.push('价格波动较大');
        }
        if (market.volume24h < 1000) {
            riskFactors.push('交易量偏低');
        }
        if (sentiment.confidence < 50) {
            riskFactors.push('情绪分析置信度低');
        }
        // 确定时间范围
        let timeHorizon = 'medium';
        if (market.volatility > 70) {
            timeHorizon = 'short';
        }
        else if (potentialScore > 80) {
            timeHorizon = 'long';
        }
        return {
            action,
            confidence,
            reasoning: reasoning.length > 0 ? reasoning : ['基于综合分析'],
            riskFactors: riskFactors.length > 0 ? riskFactors : ['常规市场风险'],
            timeHorizon
        };
    }
    // 生成价格预测
    generatePricePrediction(tokenAddress, technical, sentiment, market) {
        // 获取当前价格
        const currentPrice = this.getCurrentPrice(tokenAddress);
        // 基于各种因素计算价格变化预期
        let priceChangeExpectation = 0;
        // 技术面影响
        if (technical.trend === 'bullish')
            priceChangeExpectation += 0.1;
        else if (technical.trend === 'bearish')
            priceChangeExpectation -= 0.1;
        // 情绪面影响
        if (sentiment.sentiment.includes('bullish'))
            priceChangeExpectation += 0.08;
        else if (sentiment.sentiment.includes('bearish'))
            priceChangeExpectation -= 0.08;
        // 市场面影响
        if (market.priceChange24h > 0)
            priceChangeExpectation += market.priceChange24h / 1000;
        // 波动率影响
        const volatilityFactor = market.volatility / 100;
        return {
            priceTarget1h: currentPrice * (1 + priceChangeExpectation * 0.1 + Math.random() * volatilityFactor * 0.1),
            priceTarget24h: currentPrice * (1 + priceChangeExpectation * 0.5 + Math.random() * volatilityFactor * 0.2),
            priceTarget7d: currentPrice * (1 + priceChangeExpectation * 2 + Math.random() * volatilityFactor * 0.5),
            probability: Math.max(30, Math.min(90, 60 + sentiment.confidence * 0.3)),
            scenarios: {
                bullish: {
                    probability: sentiment.sentiment.includes('bullish') ? 40 : 25,
                    target: currentPrice * (1 + Math.abs(priceChangeExpectation) * 3)
                },
                neutral: {
                    probability: 35,
                    target: currentPrice * (1 + priceChangeExpectation * 0.1)
                },
                bearish: {
                    probability: sentiment.sentiment.includes('bearish') ? 40 : 25,
                    target: currentPrice * (1 - Math.abs(priceChangeExpectation) * 2)
                }
            }
        };
    }
    // 辅助方法实现...
    async getPriceData(tokenAddress, limit) {
        const db = this.db.getDb();
        const stmt = db.prepare(`
      SELECT price, timestamp FROM price_data 
      WHERE token_address = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
        return stmt.all(tokenAddress, limit);
    }
    async calculateTechnicalIndicators(tokenAddress, priceData) {
        // 简化的技术指标计算
        const indicators = [];
        if (priceData.length >= 14) {
            // 简化的RSI计算
            const rsi = this.calculateRSI(priceData.slice(0, 14));
            indicators.push({
                tokenAddress,
                indicatorType: 'rsi',
                timeframe: '1h',
                value: rsi,
                signal: rsi > 70 ? 'sell' : rsi < 30 ? 'buy' : 'hold',
                strength: Math.abs(rsi - 50) * 2,
                timestamp: new Date(),
                metadata: { period: 14 }
            });
        }
        return indicators;
    }
    calculateRSI(priceData) {
        // 简化的RSI计算
        let gains = 0;
        let losses = 0;
        for (let i = 1; i < priceData.length; i++) {
            const change = priceData[i - 1].price - priceData[i].price;
            if (change > 0)
                gains += change;
            else
                losses += Math.abs(change);
        }
        const avgGain = gains / (priceData.length - 1);
        const avgLoss = losses / (priceData.length - 1);
        if (avgLoss === 0)
            return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    analyzeTrend(priceData) {
        if (priceData.length < 2)
            return 'neutral';
        const recent = priceData.slice(0, 5);
        const older = priceData.slice(5, 10);
        const recentAvg = recent.reduce((sum, d) => sum + d.price, 0) / recent.length;
        const olderAvg = older.reduce((sum, d) => sum + d.price, 0) / older.length;
        const change = (recentAvg - olderAvg) / olderAvg;
        if (change > 0.05)
            return 'bullish';
        if (change < -0.05)
            return 'bearish';
        return 'neutral';
    }
    calculateSupportResistance(priceData) {
        if (priceData.length === 0)
            return { support: 0, resistance: 0 };
        const prices = priceData.map(d => d.price);
        const support = Math.min(...prices);
        const resistance = Math.max(...prices);
        return { support, resistance };
    }
    generateTechnicalSignals(indicators, trend) {
        const signals = [];
        indicators.forEach(indicator => {
            if (indicator.signal === 'buy') {
                signals.push(`${indicator.indicatorType.toUpperCase()} 买入信号`);
            }
            else if (indicator.signal === 'sell') {
                signals.push(`${indicator.indicatorType.toUpperCase()} 卖出信号`);
            }
        });
        if (trend === 'bullish') {
            signals.push('价格趋势向上');
        }
        else if (trend === 'bearish') {
            signals.push('价格趋势向下');
        }
        return signals.length > 0 ? signals : ['无明显技术信号'];
    }
    calculateTechnicalScore(indicators, trend, signals) {
        let score = 50;
        // 基于趋势
        if (trend === 'bullish')
            score += 20;
        else if (trend === 'bearish')
            score -= 20;
        // 基于指标
        indicators.forEach(indicator => {
            if (indicator.signal === 'buy')
                score += 10;
            else if (indicator.signal === 'sell')
                score -= 10;
        });
        return Math.min(100, Math.max(0, score));
    }
    // 其他辅助方法...
    async getRecentKOLTransactions(tokenAddress, hours) {
        // 这里应该调用KOL追踪服务
        return [];
    }
    analyzeKOLActivity(transactions) {
        if (transactions.length === 0)
            return ['暂无KOL活动'];
        const buyCount = transactions.filter(tx => tx.action === 'buy').length;
        const sellCount = transactions.filter(tx => tx.action === 'sell').length;
        const activity = [];
        if (buyCount > sellCount) {
            activity.push('KOL净买入');
        }
        else if (sellCount > buyCount) {
            activity.push('KOL净卖出');
        }
        return activity.length > 0 ? activity : ['KOL活动平衡'];
    }
    calculateInfluenceLevel(transactions) {
        const totalValue = transactions.reduce((sum, tx) => sum + (tx.valueSol || 0), 0);
        if (totalValue > 1000)
            return 'high';
        if (totalValue > 100)
            return 'medium';
        return 'low';
    }
    calculateKOLScore(activeKOLs, transactions, influenceLevel) {
        let score = 50;
        score += activeKOLs * 5;
        score += transactions.length * 2;
        if (influenceLevel === 'high')
            score += 20;
        else if (influenceLevel === 'medium')
            score += 10;
        return Math.min(100, Math.max(0, score));
    }
    calculateMarketScore(volume, priceChange, volatility, liquidity) {
        let score = 50;
        // 交易量评分
        if (volume > 10000)
            score += 20;
        else if (volume > 1000)
            score += 10;
        else if (volume < 100)
            score -= 20;
        // 价格变化评分
        if (priceChange > 0)
            score += Math.min(20, priceChange / 2);
        else
            score += Math.max(-20, priceChange / 2);
        // 波动率评分（适度波动是好的）
        if (volatility > 100)
            score -= 15;
        else if (volatility > 50)
            score -= 5;
        else if (volatility > 10)
            score += 5;
        return Math.min(100, Math.max(0, score));
    }
    getCurrentPrice(tokenAddress) {
        const db = this.db.getDb();
        const stmt = db.prepare(`
      SELECT price FROM price_data 
      WHERE token_address = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
        const result = stmt.get(tokenAddress);
        return result?.price || 0;
    }
    async getActiveTokens(limit = 20) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        SELECT DISTINCT t.address, t.symbol
        FROM tokens t
        LEFT JOIN trading_data td ON t.address = td.token_address
        WHERE td.timestamp > datetime('now', '-24 hours')
        ORDER BY td.volume DESC
        LIMIT ?
      `);
            const rows = stmt.all(limit);
            return rows.map(row => ({ address: row.address, symbol: row.symbol }));
        }
        catch (error) {
            return [];
        }
    }
    async getTokenInfo(tokenAddress) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        SELECT symbol, name FROM tokens WHERE address = ?
      `);
            const row = stmt.get(tokenAddress);
            return row ? { symbol: row.symbol, name: row.name } : null;
        }
        catch (error) {
            return null;
        }
    }
    async initializeTechnicalIndicators() {
        // 初始化一些模拟技术指标数据
        logger.info('📊 技术指标数据初始化完成');
    }
    async checkAnalysisAlerts(analysis) {
        try {
            const alerts = [];
            // 高潜力预警
            if (analysis.potentialScore > 85 && analysis.riskScore < 40) {
                alerts.push(`${analysis.tokenSymbol} 发现高潜力低风险机会`);
            }
            // 强烈买入信号
            if (analysis.recommendation.action === 'strong_buy' && analysis.recommendation.confidence > 80) {
                alerts.push(`${analysis.tokenSymbol} 出现强烈买入信号`);
            }
            // 高风险预警
            if (analysis.riskScore > 80) {
                alerts.push(`${analysis.tokenSymbol} 风险等级较高，请谨慎操作`);
            }
            // 发送预警
            for (const alertMessage of alerts) {
                await this.createAnalysisAlert(analysis.tokenAddress, alertMessage, analysis);
            }
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'checkAnalysisAlerts');
        }
    }
    async createAnalysisAlert(tokenAddress, message, analysis) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        INSERT INTO alerts (
          token_address, type, message, severity, data, is_read
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
            const severity = analysis.riskScore > 80 ? 'high' :
                analysis.potentialScore > 85 ? 'medium' : 'low';
            stmt.run(tokenAddress, 'smart_analysis', message, severity, JSON.stringify({
                overallScore: analysis.overallScore,
                riskScore: analysis.riskScore,
                potentialScore: analysis.potentialScore,
                recommendation: analysis.recommendation.action,
                confidence: analysis.recommendation.confidence
            }), 0);
            // 广播预警
            if (this.io) {
                this.io.emit('new_alert', {
                    type: 'smart_analysis',
                    message,
                    tokenAddress,
                    tokenSymbol: analysis.tokenSymbol,
                    severity,
                    timestamp: new Date()
                });
            }
            logger.info(`🧠 智能分析预警: ${message}`);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'createAnalysisAlert');
        }
    }
}
//# sourceMappingURL=smart-analyzer.js.map