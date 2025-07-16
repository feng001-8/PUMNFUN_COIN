import { DatabaseManager } from '../database/schema.js'
import { logger } from '../utils/logger.js'
import { enhancedErrorHandler, ErrorType, ErrorSeverity } from '../utils/enhanced-error-handler.js'
import { environment } from '../config/environment.js'
import type { Server } from 'socket.io'

// KOL信息接口
export interface KOLInfo {
  id?: number
  walletAddress: string
  name?: string
  category: 'trader' | 'influencer' | 'institution'
  influenceScore: number // 0-100
  successRate: number // 0-100
  totalTrades: number
  profitableTrades: number
  avgProfitRate: number
  followersCount: number
  verified: boolean
  tags: string[]
  socialLinks: {
    twitter?: string
    telegram?: string
    discord?: string
    website?: string
  }
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

// KOL交易记录接口
export interface KOLTransaction {
  id?: number
  kolWalletAddress: string
  tokenAddress: string
  transactionHash: string
  action: 'buy' | 'sell'
  amount: number
  price: number
  valueSol: number
  timestamp: Date
  profitLoss?: number
  holdingPeriod?: number // seconds
  createdAt?: Date
}

// KOL信号接口
export interface KOLSignal {
  kolWalletAddress: string
  kolName: string
  tokenAddress: string
  tokenSymbol: string
  action: 'buy' | 'sell'
  amount: number
  price: number
  valueSol: number
  confidence: number // 0-100
  reasoning: string
  timestamp: Date
}

export class KOLTracker {
  private db: DatabaseManager
  private io?: Server
  private isRunning: boolean = false
  private monitoredKOLs: Set<string> = new Set()
  
  constructor(db: DatabaseManager) {
    this.db = db
    logger.info('🎯 KOL追踪器已初始化')
  }

  setSocketIO(io: Server): void {
    this.io = io
  }

  async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    
    try {
      // 加载活跃的KOL列表
      await this.loadActiveKOLs()
      
      // 初始化一些知名KOL数据（示例）
      await this.initializeDefaultKOLs()
      
      logger.info('🎯 KOL追踪器启动完成')
      
      // 定期更新KOL统计数据
      setInterval(() => {
        this.updateKOLStatistics().catch(error => {
          enhancedErrorHandler.handleError(error, 'updateKOLStatistics定时任务')
        })
      }, 300000) // 每5分钟更新一次
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'KOL追踪器启动'
      )
      throw error
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false
    logger.info('🛑 KOL追踪器停止')
  }

  // 添加KOL到监控列表
  async addKOL(kolInfo: Omit<KOLInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        INSERT INTO kol_info (
          wallet_address, name, category, influence_score, success_rate,
          total_trades, profitable_trades, avg_profit_rate, followers_count,
          verified, tags, social_links, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      const result = stmt.run(
        kolInfo.walletAddress,
        kolInfo.name,
        kolInfo.category,
        kolInfo.influenceScore,
        kolInfo.successRate,
        kolInfo.totalTrades,
        kolInfo.profitableTrades,
        kolInfo.avgProfitRate,
        kolInfo.followersCount,
        kolInfo.verified ? 1 : 0,
        JSON.stringify(kolInfo.tags),
        JSON.stringify(kolInfo.socialLinks),
        kolInfo.isActive ? 1 : 0
      )
      
      this.monitoredKOLs.add(kolInfo.walletAddress)
      logger.info(`✅ 已添加KOL到监控列表: ${kolInfo.name} (${kolInfo.walletAddress})`)
      
      return result.lastInsertRowid as number
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'addKOL',
        { walletAddress: kolInfo.walletAddress }
      )
      throw error
    }
  }

  // 记录KOL交易
  async recordKOLTransaction(transaction: Omit<KOLTransaction, 'id' | 'createdAt'>): Promise<void> {
    const db = this.db.getDb()
    
    try {
      // 检查是否是监控的KOL
      if (!this.monitoredKOLs.has(transaction.kolWalletAddress)) {
        return // 不是监控的KOL，忽略
      }
      
      const stmt = db.prepare(`
        INSERT INTO kol_transactions (
          kol_wallet_address, token_address, transaction_hash, action,
          amount, price, value_sol, timestamp, profit_loss, holding_period
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        transaction.kolWalletAddress,
        transaction.tokenAddress,
        transaction.transactionHash,
        transaction.action,
        transaction.amount,
        transaction.price,
        transaction.valueSol,
        transaction.timestamp.toISOString(),
        transaction.profitLoss || null,
        transaction.holdingPeriod || null
      )
      
      // 生成KOL信号
      await this.generateKOLSignal(transaction)
      
      logger.info(`📊 记录KOL交易: ${transaction.action} ${transaction.amount} tokens`)
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'recordKOLTransaction',
        { kolWallet: transaction.kolWalletAddress, tokenAddress: transaction.tokenAddress }
      )
    }
  }

  // 生成KOL信号
  private async generateKOLSignal(transaction: Omit<KOLTransaction, 'id' | 'createdAt'>): Promise<void> {
    try {
      // 获取KOL信息
      const kolInfo = await this.getKOLInfo(transaction.kolWalletAddress)
      if (!kolInfo) return
      
      // 获取代币信息
      const tokenInfo = await this.getTokenInfo(transaction.tokenAddress)
      if (!tokenInfo) return
      
      // 计算信号置信度
      const confidence = this.calculateSignalConfidence(kolInfo, transaction)
      
      // 生成推理说明
      const reasoning = this.generateSignalReasoning(kolInfo, transaction)
      
      const signal: KOLSignal = {
        kolWalletAddress: transaction.kolWalletAddress,
        kolName: kolInfo.name || 'Unknown KOL',
        tokenAddress: transaction.tokenAddress,
        tokenSymbol: tokenInfo.symbol,
        action: transaction.action,
        amount: transaction.amount,
        price: transaction.price,
        valueSol: transaction.valueSol,
        confidence,
        reasoning,
        timestamp: transaction.timestamp
      }
      
      // 广播KOL信号
      if (this.io && confidence >= 70) { // 只广播高置信度信号
        this.io.emit('kol_signal', signal)
        logger.info(`🎯 广播KOL信号: ${signal.kolName} ${signal.action} ${signal.tokenSymbol}`)
      }
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'generateKOLSignal'
      )
    }
  }

  // 计算信号置信度
  private calculateSignalConfidence(kolInfo: KOLInfo, transaction: Omit<KOLTransaction, 'id' | 'createdAt'>): number {
    let confidence = 50 // 基础置信度
    
    // 基于KOL影响力评分
    confidence += kolInfo.influenceScore * 0.3
    
    // 基于成功率
    confidence += kolInfo.successRate * 0.2
    
    // 基于交易金额（大额交易更有信号价值）
    if (transaction.valueSol > 100) confidence += 10
    else if (transaction.valueSol > 50) confidence += 5
    
    // 基于验证状态
    if (kolInfo.verified) confidence += 10
    
    // 基于KOL类别
    if (kolInfo.category === 'trader') confidence += 5
    else if (kolInfo.category === 'institution') confidence += 15
    
    return Math.min(100, Math.max(0, confidence))
  }

  // 生成信号推理说明
  private generateSignalReasoning(kolInfo: KOLInfo, transaction: Omit<KOLTransaction, 'id' | 'createdAt'>): string {
    const reasons = []
    
    if (kolInfo.influenceScore > 80) {
      reasons.push('高影响力KOL')
    }
    
    if (kolInfo.successRate > 70) {
      reasons.push(`历史成功率${kolInfo.successRate.toFixed(1)}%`)
    }
    
    if (kolInfo.verified) {
      reasons.push('已验证身份')
    }
    
    if (transaction.valueSol > 100) {
      reasons.push('大额交易')
    }
    
    if (kolInfo.category === 'institution') {
      reasons.push('机构投资者')
    }
    
    return reasons.join('，') || '常规交易信号'
  }

  // 获取KOL信息
  private async getKOLInfo(walletAddress: string): Promise<KOLInfo | null> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM kol_info WHERE wallet_address = ? AND is_active = 1
      `)
      
      const row = stmt.get(walletAddress) as any
      if (!row) return null
      
      return {
        id: row.id,
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
        socialLinks: JSON.parse(row.social_links || '{}'),
        isActive: row.is_active === 1,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'getKOLInfo',
        { walletAddress }
      )
      return null
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

  // 加载活跃的KOL列表
  private async loadActiveKOLs(): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT wallet_address FROM kol_info WHERE is_active = 1
      `)
      
      const rows = stmt.all() as any[]
      this.monitoredKOLs.clear()
      
      rows.forEach(row => {
        this.monitoredKOLs.add(row.wallet_address)
      })
      
      logger.info(`📋 加载了 ${this.monitoredKOLs.size} 个活跃KOL`)
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'loadActiveKOLs'
      )
    }
  }

  // 初始化默认KOL数据
  private async initializeDefaultKOLs(): Promise<void> {
    const defaultKOLs: Omit<KOLInfo, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        walletAddress: '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx6LnRTsAD',
        name: 'Solana Whale #1',
        category: 'trader',
        influenceScore: 85,
        successRate: 72.5,
        totalTrades: 156,
        profitableTrades: 113,
        avgProfitRate: 45.2,
        followersCount: 0,
        verified: false,
        tags: ['whale', 'early-adopter', 'defi'],
        socialLinks: {},
        isActive: true
      },
      {
        walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        name: 'PumpFun Expert',
        category: 'influencer',
        influenceScore: 78,
        successRate: 68.3,
        totalTrades: 89,
        profitableTrades: 61,
        avgProfitRate: 38.7,
        followersCount: 15000,
        verified: true,
        tags: ['pumpfun', 'meme-coins', 'alpha'],
        socialLinks: {
          twitter: 'https://twitter.com/pumpfun_expert'
        },
        isActive: true
      }
    ]
    
    for (const kol of defaultKOLs) {
      try {
        // 检查是否已存在
        const existing = await this.getKOLInfo(kol.walletAddress)
        if (!existing) {
          await this.addKOL(kol)
        }
      } catch (error) {
        // 忽略重复添加错误
        logger.debug(`跳过已存在的KOL: ${kol.walletAddress}`)
      }
    }
  }

  // 更新KOL统计数据
  private async updateKOLStatistics(): Promise<void> {
    const db = this.db.getDb()
    
    try {
      // 获取所有活跃KOL
      const kolStmt = db.prepare(`
        SELECT wallet_address FROM kol_info WHERE is_active = 1
      `)
      
      const kols = kolStmt.all() as any[]
      
      for (const kol of kols) {
        // 计算交易统计
        const statsStmt = db.prepare(`
          SELECT 
            COUNT(*) as total_trades,
            SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as profitable_trades,
            AVG(CASE WHEN profit_loss IS NOT NULL THEN profit_loss ELSE 0 END) as avg_profit
          FROM kol_transactions 
          WHERE kol_wallet_address = ?
        `)
        
        const stats = statsStmt.get(kol.wallet_address) as any
        
        if (stats && stats.total_trades > 0) {
          const successRate = (stats.profitable_trades / stats.total_trades) * 100
          
          // 更新KOL统计信息
          const updateStmt = db.prepare(`
            UPDATE kol_info 
            SET 
              total_trades = ?,
              profitable_trades = ?,
              success_rate = ?,
              avg_profit_rate = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE wallet_address = ?
          `)
          
          updateStmt.run(
            stats.total_trades,
            stats.profitable_trades,
            successRate,
            stats.avg_profit || 0,
            kol.wallet_address
          )
        }
      }
      
      logger.debug('📊 KOL统计数据更新完成')
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'updateKOLStatistics'
      )
    }
  }

  // 获取所有KOL列表
  async getAllKOLs(limit: number = 50, offset: number = 0): Promise<KOLInfo[]> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM kol_info 
        WHERE is_active = 1 
        ORDER BY influence_score DESC, success_rate DESC
        LIMIT ? OFFSET ?
      `)
      
      const rows = stmt.all(limit, offset) as any[]
      
      return rows.map(row => ({
        id: row.id,
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
        socialLinks: JSON.parse(row.social_links || '{}'),
        isActive: row.is_active === 1,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }))
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'getAllKOLs'
      )
      return []
    }
  }

  // 获取KOL交易记录
  async getKOLTransactions(walletAddress: string, limit: number = 50): Promise<KOLTransaction[]> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM kol_transactions 
        WHERE kol_wallet_address = ? 
        ORDER BY timestamp DESC
        LIMIT ?
      `)
      
      const rows = stmt.all(walletAddress, limit) as any[]
      
      return rows.map(row => ({
        id: row.id,
        kolWalletAddress: row.kol_wallet_address,
        tokenAddress: row.token_address,
        transactionHash: row.transaction_hash,
        action: row.action,
        amount: row.amount,
        price: row.price,
        valueSol: row.value_sol,
        timestamp: new Date(row.timestamp),
        profitLoss: row.profit_loss,
        holdingPeriod: row.holding_period,
        createdAt: new Date(row.created_at)
      }))
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'getKOLTransactions',
        { walletAddress }
      )
      return []
    }
  }
}