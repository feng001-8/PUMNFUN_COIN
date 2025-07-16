import { DatabaseManager } from '../database/schema.js'
import { logger } from '../utils/logger.js'
import { enhancedErrorHandler, ErrorType, ErrorSeverity } from '../utils/enhanced-error-handler.js'
import type { Server } from 'socket.io'

// 情绪数据接口
export interface SentimentData {
  id?: number
  tokenAddress: string
  source: 'twitter' | 'telegram' | 'discord' | 'reddit' | 'pump_comments'
  sentimentScore: number // -100 to 100
  positiveCount: number
  negativeCount: number
  neutralCount: number
  totalMentions: number
  keywordMentions: {
    bullish: number
    bearish: number
    moon: number
    dump: number
    hodl: number
    sell: number
  }
  influencerMentions: number
  volumeSpike: boolean
  trendingScore: number // 0-100
  timestamp: Date
  createdAt?: Date
}

// 情绪分析结果接口
export interface SentimentAnalysis {
  tokenAddress: string
  tokenSymbol: string
  overallSentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish'
  sentimentScore: number
  confidence: number
  trendDirection: 'rising' | 'falling' | 'stable'
  socialVolume: number
  influencerActivity: number
  keySignals: string[]
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  timestamp: Date
}

// 关键词权重配置
const KEYWORD_WEIGHTS = {
  // 积极关键词
  bullish: 2.0,
  moon: 1.8,
  pump: 1.5,
  hodl: 1.2,
  diamond: 1.5,
  rocket: 1.3,
  gem: 1.4,
  alpha: 1.6,
  
  // 消极关键词
  bearish: -2.0,
  dump: -1.8,
  sell: -1.2,
  crash: -2.2,
  rug: -3.0,
  scam: -2.5,
  dead: -2.0,
  rip: -1.5
}

export class SentimentAnalyzer {
  private db: DatabaseManager
  private io?: Server
  private isRunning: boolean = false
  private analysisInterval?: NodeJS.Timeout
  
  constructor(db: DatabaseManager) {
    this.db = db
    logger.info('📊 情绪分析器已初始化')
  }

  setSocketIO(io: Server): void {
    this.io = io
  }

  async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    
    try {
      // 初始化一些模拟数据
      await this.initializeMockSentimentData()
      
      logger.info('📊 情绪分析器启动完成')
      
      // 定期分析情绪数据
      this.analysisInterval = setInterval(() => {
        this.performSentimentAnalysis().catch(error => {
          enhancedErrorHandler.handleError(error, '情绪分析定时任务')
        })
      }, 60000) // 每分钟分析一次
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        '情绪分析器启动'
      )
      throw error
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
    }
    logger.info('🛑 情绪分析器停止')
  }

  // 记录情绪数据
  async recordSentimentData(data: Omit<SentimentData, 'id' | 'createdAt'>): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        INSERT INTO sentiment_data (
          token_address, source, sentiment_score, positive_count, negative_count,
          neutral_count, total_mentions, keyword_mentions, influencer_mentions,
          volume_spike, trending_score, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        data.tokenAddress,
        data.source,
        data.sentimentScore,
        data.positiveCount,
        data.negativeCount,
        data.neutralCount,
        data.totalMentions,
        JSON.stringify(data.keywordMentions),
        data.influencerMentions,
        data.volumeSpike ? 1 : 0,
        data.trendingScore,
        data.timestamp.toISOString()
      )
      
      logger.debug(`📊 记录情绪数据: ${data.source} - ${data.sentimentScore}`)
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'recordSentimentData',
        { tokenAddress: data.tokenAddress, source: data.source }
      )
    }
  }

  // 执行情绪分析
  private async performSentimentAnalysis(): Promise<void> {
    try {
      // 获取最近活跃的代币
      const activeTokens = await this.getActiveTokens()
      
      for (const token of activeTokens) {
        const analysis = await this.analyzeTokenSentiment(token.address)
        if (analysis) {
          // 广播情绪分析结果
          if (this.io) {
            this.io.emit('sentiment_analysis', analysis)
          }
          
          // 如果情绪发生重大变化，生成预警
          await this.checkSentimentAlerts(analysis)
        }
      }
      
      logger.debug('📊 情绪分析周期完成')
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'performSentimentAnalysis'
      )
    }
  }

  // 分析单个代币的情绪
  async analyzeTokenSentiment(tokenAddress: string): Promise<SentimentAnalysis | null> {
    const db = this.db.getDb()
    
    try {
      // 获取代币信息
      const tokenInfo = await this.getTokenInfo(tokenAddress)
      if (!tokenInfo) return null
      
      // 获取最近24小时的情绪数据
      const sentimentStmt = db.prepare(`
        SELECT * FROM sentiment_data 
        WHERE token_address = ? 
        AND timestamp > datetime('now', '-24 hours')
        ORDER BY timestamp DESC
      `)
      
      const sentimentData = sentimentStmt.all(tokenAddress) as any[]
      
      if (sentimentData.length === 0) {
        return null
      }
      
      // 计算综合情绪分数
      const overallScore = this.calculateOverallSentiment(sentimentData)
      
      // 计算趋势方向
      const trendDirection = this.calculateTrendDirection(sentimentData)
      
      // 计算社交媒体活跃度
      const socialVolume = this.calculateSocialVolume(sentimentData)
      
      // 计算影响者活跃度
      const influencerActivity = this.calculateInfluencerActivity(sentimentData)
      
      // 生成关键信号
      const keySignals = this.generateKeySignals(sentimentData)
      
      // 评估风险等级
      const riskLevel = this.assessRiskLevel(overallScore, socialVolume, influencerActivity)
      
      // 生成投资建议
      const recommendation = this.generateRecommendation(overallScore, trendDirection, riskLevel)
      
      // 计算置信度
      const confidence = this.calculateConfidence(sentimentData.length, socialVolume, influencerActivity)
      
      const analysis: SentimentAnalysis = {
        tokenAddress,
        tokenSymbol: tokenInfo.symbol,
        overallSentiment: this.scoresToSentiment(overallScore),
        sentimentScore: overallScore,
        confidence,
        trendDirection,
        socialVolume,
        influencerActivity,
        keySignals,
        riskLevel,
        recommendation,
        timestamp: new Date()
      }
      
      return analysis
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'analyzeTokenSentiment',
        { tokenAddress }
      )
      return null
    }
  }

  // 计算综合情绪分数
  private calculateOverallSentiment(sentimentData: any[]): number {
    if (sentimentData.length === 0) return 0
    
    let weightedSum = 0
    let totalWeight = 0
    
    sentimentData.forEach(data => {
      // 根据数据源给予不同权重
      let sourceWeight = 1.0
      switch (data.source) {
        case 'twitter': sourceWeight = 1.5; break
        case 'telegram': sourceWeight = 1.2; break
        case 'discord': sourceWeight = 1.0; break
        case 'reddit': sourceWeight = 1.3; break
        case 'pump_comments': sourceWeight = 0.8; break
      }
      
      // 根据时间给予衰减权重（越新的数据权重越高）
      const hoursAgo = (Date.now() - new Date(data.timestamp).getTime()) / (1000 * 60 * 60)
      const timeWeight = Math.exp(-hoursAgo / 12) // 12小时半衰期
      
      const finalWeight = sourceWeight * timeWeight * (data.total_mentions || 1)
      
      weightedSum += data.sentiment_score * finalWeight
      totalWeight += finalWeight
    })
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  // 计算趋势方向
  private calculateTrendDirection(sentimentData: any[]): 'rising' | 'falling' | 'stable' {
    if (sentimentData.length < 2) return 'stable'
    
    // 按时间排序
    const sorted = sentimentData.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    // 计算最近几个数据点的趋势
    const recentData = sorted.slice(-6) // 最近6个数据点
    if (recentData.length < 2) return 'stable'
    
    let trendSum = 0
    for (let i = 1; i < recentData.length; i++) {
      trendSum += recentData[i].sentiment_score - recentData[i-1].sentiment_score
    }
    
    const avgTrend = trendSum / (recentData.length - 1)
    
    if (avgTrend > 5) return 'rising'
    if (avgTrend < -5) return 'falling'
    return 'stable'
  }

  // 计算社交媒体活跃度
  private calculateSocialVolume(sentimentData: any[]): number {
    const totalMentions = sentimentData.reduce((sum, data) => sum + (data.total_mentions || 0), 0)
    const avgMentions = totalMentions / Math.max(sentimentData.length, 1)
    
    // 标准化到0-100范围
    return Math.min(100, avgMentions * 2)
  }

  // 计算影响者活跃度
  private calculateInfluencerActivity(sentimentData: any[]): number {
    const totalInfluencerMentions = sentimentData.reduce((sum, data) => sum + (data.influencer_mentions || 0), 0)
    const avgInfluencerMentions = totalInfluencerMentions / Math.max(sentimentData.length, 1)
    
    // 标准化到0-100范围
    return Math.min(100, avgInfluencerMentions * 10)
  }

  // 生成关键信号
  private generateKeySignals(sentimentData: any[]): string[] {
    const signals: string[] = []
    
    // 分析关键词提及
    const keywordStats = this.aggregateKeywordMentions(sentimentData)
    
    if (keywordStats.bullish > keywordStats.bearish * 2) {
      signals.push('强烈看涨情绪')
    } else if (keywordStats.bearish > keywordStats.bullish * 2) {
      signals.push('强烈看跌情绪')
    }
    
    if (keywordStats.moon > 10) {
      signals.push('"登月"热度高涨')
    }
    
    if (keywordStats.hodl > 5) {
      signals.push('持有者信心强')
    }
    
    // 检查交易量激增
    const hasVolumeSpike = sentimentData.some(data => data.volume_spike)
    if (hasVolumeSpike) {
      signals.push('交易量异常激增')
    }
    
    // 检查趋势分数
    const avgTrendingScore = sentimentData.reduce((sum, data) => sum + (data.trending_score || 0), 0) / sentimentData.length
    if (avgTrendingScore > 70) {
      signals.push('社交媒体热度极高')
    }
    
    return signals.length > 0 ? signals : ['常规市场情绪']
  }

  // 聚合关键词提及统计
  private aggregateKeywordMentions(sentimentData: any[]): any {
    const aggregated = {
      bullish: 0,
      bearish: 0,
      moon: 0,
      dump: 0,
      hodl: 0,
      sell: 0
    }
    
    sentimentData.forEach(data => {
      try {
        const keywords = JSON.parse(data.keyword_mentions || '{}')
        Object.keys(aggregated).forEach(key => {
          (aggregated as any)[key] += keywords[key] || 0
        })
      } catch (error) {
        // 忽略JSON解析错误
      }
    })
    
    return aggregated
  }

  // 评估风险等级
  private assessRiskLevel(sentimentScore: number, socialVolume: number, influencerActivity: number): 'low' | 'medium' | 'high' {
    // 极端情绪 + 高社交活跃度 = 高风险
    if ((Math.abs(sentimentScore) > 70 && socialVolume > 80) || influencerActivity > 90) {
      return 'high'
    }
    
    // 中等情绪波动
    if (Math.abs(sentimentScore) > 40 || socialVolume > 50) {
      return 'medium'
    }
    
    return 'low'
  }

  // 生成投资建议
  private generateRecommendation(sentimentScore: number, trendDirection: string, riskLevel: string): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' {
    // 高风险情况下保守建议
    if (riskLevel === 'high') {
      if (sentimentScore > 60 && trendDirection === 'rising') return 'buy'
      if (sentimentScore < -60 && trendDirection === 'falling') return 'sell'
      return 'hold'
    }
    
    // 基于情绪分数和趋势的建议
    if (sentimentScore > 70 && trendDirection === 'rising') return 'strong_buy'
    if (sentimentScore > 40 && trendDirection === 'rising') return 'buy'
    if (sentimentScore < -70 && trendDirection === 'falling') return 'strong_sell'
    if (sentimentScore < -40 && trendDirection === 'falling') return 'sell'
    
    return 'hold'
  }

  // 计算置信度
  private calculateConfidence(dataPoints: number, socialVolume: number, influencerActivity: number): number {
    let confidence = 50 // 基础置信度
    
    // 数据点越多，置信度越高
    confidence += Math.min(30, dataPoints * 2)
    
    // 社交活跃度越高，置信度越高
    confidence += socialVolume * 0.2
    
    // 影响者活跃度提升置信度
    confidence += influencerActivity * 0.1
    
    return Math.min(100, Math.max(0, confidence))
  }

  // 情绪分数转换为情绪标签
  private scoresToSentiment(score: number): 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish' {
    if (score > 60) return 'very_bullish'
    if (score > 20) return 'bullish'
    if (score > -20) return 'neutral'
    if (score > -60) return 'bearish'
    return 'very_bearish'
  }

  // 检查情绪预警
  private async checkSentimentAlerts(analysis: SentimentAnalysis): Promise<void> {
    try {
      const alerts: string[] = []
      
      // 极端情绪预警
      if (Math.abs(analysis.sentimentScore) > 80) {
        alerts.push(`${analysis.tokenSymbol} 出现极端${analysis.sentimentScore > 0 ? '看涨' : '看跌'}情绪`)
      }
      
      // 情绪急剧变化预警
      if (analysis.trendDirection === 'rising' && analysis.sentimentScore > 50) {
        alerts.push(`${analysis.tokenSymbol} 看涨情绪快速上升`)
      } else if (analysis.trendDirection === 'falling' && analysis.sentimentScore < -50) {
        alerts.push(`${analysis.tokenSymbol} 看跌情绪快速下降`)
      }
      
      // 高风险预警
      if (analysis.riskLevel === 'high') {
        alerts.push(`${analysis.tokenSymbol} 情绪波动风险较高`)
      }
      
      // 发送预警
      for (const alertMessage of alerts) {
        await this.createSentimentAlert(analysis.tokenAddress, alertMessage, analysis)
      }
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'checkSentimentAlerts'
      )
    }
  }

  // 创建情绪预警
  private async createSentimentAlert(tokenAddress: string, message: string, analysis: SentimentAnalysis): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        INSERT INTO alerts (
          token_address, type, message, severity, data, is_read
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        tokenAddress,
        'sentiment',
        message,
        analysis.riskLevel === 'high' ? 'high' : 'medium',
        JSON.stringify({
          sentimentScore: analysis.sentimentScore,
          trendDirection: analysis.trendDirection,
          confidence: analysis.confidence,
          recommendation: analysis.recommendation
        }),
        0
      )
      
      // 广播预警
      if (this.io) {
        this.io.emit('new_alert', {
          type: 'sentiment',
          message,
          tokenAddress,
          tokenSymbol: analysis.tokenSymbol,
          severity: analysis.riskLevel === 'high' ? 'high' : 'medium',
          timestamp: new Date()
        })
      }
      
      logger.info(`🚨 情绪预警: ${message}`)
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'createSentimentAlert'
      )
    }
  }

  // 获取活跃代币列表
  private async getActiveTokens(limit: number = 20): Promise<{ address: string; symbol: string }[]> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT DISTINCT t.address, t.symbol
        FROM tokens t
        LEFT JOIN trading_data td ON t.address = td.token_address
        WHERE td.timestamp > datetime('now', '-24 hours')
        ORDER BY td.volume DESC
        LIMIT ?
      `)
      
      const rows = stmt.all(limit) as any[]
      return rows.map(row => ({ address: row.address, symbol: row.symbol }))
    } catch (error) {
      return []
    }
  }

  // 获取代币信息
  private async getTokenInfo(tokenAddress: string): Promise<{ symbol: string; name: string } | null> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT symbol, name FROM tokens WHERE address = ?
      `)
      
      const row = stmt.get(tokenAddress) as any
      return row ? { symbol: row.symbol, name: row.name } : null
    } catch (error) {
      return null
    }
  }

  // 初始化模拟情绪数据
  private async initializeMockSentimentData(): Promise<void> {
    try {
      // 获取一些代币来生成模拟数据
      const tokens = await this.getActiveTokens(5)
      
      for (const token of tokens) {
        // 为每个代币生成一些模拟情绪数据
        const sources = ['twitter', 'telegram', 'discord', 'pump_comments'] as const
        
        for (const source of sources) {
          const mockData: Omit<SentimentData, 'id' | 'createdAt'> = {
            tokenAddress: token.address,
            source,
            sentimentScore: Math.random() * 200 - 100, // -100 to 100
            positiveCount: Math.floor(Math.random() * 50),
            negativeCount: Math.floor(Math.random() * 30),
            neutralCount: Math.floor(Math.random() * 20),
            totalMentions: Math.floor(Math.random() * 100) + 10,
            keywordMentions: {
              bullish: Math.floor(Math.random() * 10),
              bearish: Math.floor(Math.random() * 8),
              moon: Math.floor(Math.random() * 15),
              dump: Math.floor(Math.random() * 5),
              hodl: Math.floor(Math.random() * 12),
              sell: Math.floor(Math.random() * 6)
            },
            influencerMentions: Math.floor(Math.random() * 5),
            volumeSpike: Math.random() > 0.8,
            trendingScore: Math.floor(Math.random() * 100),
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // 过去24小时内
          }
          
          await this.recordSentimentData(mockData)
        }
      }
      
      logger.info('📊 模拟情绪数据初始化完成')
    } catch (error) {
      logger.debug('模拟情绪数据初始化失败，跳过')
    }
  }

  // 获取代币情绪历史
  async getTokenSentimentHistory(tokenAddress: string, hours: number = 24): Promise<SentimentData[]> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM sentiment_data 
        WHERE token_address = ? 
        AND timestamp > datetime('now', '-${hours} hours')
        ORDER BY timestamp DESC
      `)
      
      const rows = stmt.all(tokenAddress) as any[]
      
      return rows.map(row => ({
        id: row.id,
        tokenAddress: row.token_address,
        source: row.source,
        sentimentScore: row.sentiment_score,
        positiveCount: row.positive_count,
        negativeCount: row.negative_count,
        neutralCount: row.neutral_count,
        totalMentions: row.total_mentions,
        keywordMentions: JSON.parse(row.keyword_mentions || '{}'),
        influencerMentions: row.influencer_mentions,
        volumeSpike: row.volume_spike === 1,
        trendingScore: row.trending_score,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.created_at)
      }))
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'getTokenSentimentHistory',
        { tokenAddress }
      )
      return []
    }
  }
}